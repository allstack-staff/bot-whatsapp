import * as fs from 'fs';
import * as path from 'path';
import { GroupMetadata, WAMessageKey, WASocket } from '@whiskeysockets/baileys';
import { MessageUpsert } from '../types';
import { botConfig } from '../config';
import { BanService } from '../services/banService';
import { AdminService } from '../services/adminService';
import { WarningService } from '../services/warningService';
import { DescriptionChangeService } from '../services/descriptionChangeService';
import { AdminResponsibilityService } from '../services/adminResponsibilityService';
import { AiModerationService } from '../services/aiModerationService';
import { CommunityGroupService } from '../services/communityGroupService';
import { logger } from '../utils/logger';
import { findParticipant, isGroupAdmin, resolvePnJid } from '../utils/jid';
import { humanBulkActionDelay, humanReplyDelay } from '../utils/delay';
import { parseDurationMs } from '../utils/duration';

const DEFAULT_LOGO_PATH = path.join(process.cwd(), 'assets', 'logo.jpg');

export class MessageHandler {
    private banService: BanService;
    private adminService: AdminService;
    private warningService: WarningService;
    private descriptionChangeService: DescriptionChangeService;
    private adminResponsibilityService: AdminResponsibilityService;
    private aiModerationService: AiModerationService;
    private communityGroupService: CommunityGroupService;

    // Mensagens de grupo desde a última checagem da IA — se estiver vazio na
    // hora do ciclo, não submete nada (nem gasta chamada de API à toa).
    private pendingModerationMessages: Map<string, { sender: string; text: string }[]> = new Map();
    private static readonly MAX_PENDING_MESSAGES_PER_GROUP = 300;

    // Rastro (em memória) dos comandos digitados pro bot e das respostas dele em
    // cada grupo, só pra viabilizar o $clear. Não precisa sobreviver a um restart.
    private groupMessageLog: Map<string, WAMessageKey[]> = new Map();
    private static readonly MAX_TRACKED_PER_GROUP = 300;

    // Marca mudanças de descrição feitas pelo próprio bot, pra não confundir
    // com edição manual de admin (que dispara votação de aprovação).
    private recentSelfDescriptionUpdate: Map<string, number> = new Map();
    private static readonly SELF_UPDATE_WINDOW_MS = 15_000;

    // Última descrição conhecida de cada grupo, pra saber se uma mudança é de
    // verdade (não sobrevive a um restart — reprimed via primeDescriptionCache).
    private descriptionCache: Map<string, string | undefined> = new Map();

    // Ao reconectar, o WhatsApp reemite `groups.update` pra vários grupos (parte
    // da sincronização), mesmo sem ninguém ter mudado nada de verdade. Se esses
    // eventos chegarem antes do cache ser preenchido, toda descrição parece uma
    // mudança "de vazia pra atual" — falso positivo real, observado em produção
    // (proposta de votação duplicada pra "All Stack Debugging" sem edição nenhuma).
    // Só processa handleGroupsUpdate depois que o cache inicial estiver pronto.
    private descriptionCachePrimed = false;

    // Votos (por reação) de cada proposta de mudança de descrição pendente,
    // por id da mensagem de votação. Em memória de propósito — perder isso
    // num restart só significa recomeçar a contagem, não perder a trava/estado.
    private descriptionVotes: Map<string, Map<string, 'approve' | 'reject'>> = new Map();

    // Grupos onde o bot não é admin (logo não pode trocar a foto), com o
    // horário da última tentativa. Evita reenviar updateProfilePicture pro
    // WhatsApp toda hora pra um grupo que vai sempre falhar até alguém tornar
    // o bot admin lá — tanto por ruído de log quanto por ser uma chamada
    // repetitiva e previsível de mais pro gosto de "legit em relação a ban".
    private notAuthorizedPhotoGroups: Map<string, number> = new Map();
    private static readonly PHOTO_RETRY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

    constructor(private sock: WASocket) {
        this.banService = new BanService();
        this.adminService = new AdminService();
        this.warningService = new WarningService();
        this.descriptionChangeService = new DescriptionChangeService();
        this.adminResponsibilityService = new AdminResponsibilityService();
        this.aiModerationService = new AiModerationService();
        this.communityGroupService = new CommunityGroupService();
    }

    private commands: Record<string, (msg: any, args: string[]) => Promise<void>> = {
        home: (msg: any) => this.homeCommand(msg),
        ban: (msg: any, args: string[]) => this.banCommand(msg, args),
        unban: (msg: any, args: string[]) => this.unbanCommand(msg, args),
        bans: (msg: any) => this.bansCommand(msg),
        banedit: (msg: any, args: string[]) => this.baneditCommand(msg, args),
        advertir: (msg: any, args: string[]) => this.advertirCommand(msg, args),
        clear: (msg: any) => this.clearCommand(msg),
        status: (msg: any) => this.statusCommand(msg),
        ajuda: (msg: any) => this.helpCommand(msg),
        help: (msg: any) => this.helpCommand(msg),
        regras: (msg: any) => this.regrasCommand(msg),
        grupos: (msg: any) => this.gruposCommand(msg),
        responsavel: (msg: any, args: string[]) => this.responsavelCommand(msg, args),
        promover: (msg: any) => this.promoverCommand(msg),
    };

    private trackGroupMessage(jid: string | undefined, key: WAMessageKey | undefined): void {
        if (!jid?.endsWith('@g.us') || !key?.id) return;
        const keys = this.groupMessageLog.get(jid) ?? [];
        keys.push(key);
        if (keys.length > MessageHandler.MAX_TRACKED_PER_GROUP) {
            keys.splice(0, keys.length - MessageHandler.MAX_TRACKED_PER_GROUP);
        }
        this.groupMessageLog.set(jid, keys);
    }

    private bufferForModeration(jid: string | undefined, sender: string | undefined, text: string): void {
        if (!jid?.endsWith('@g.us') || !sender) return;
        const buffer = this.pendingModerationMessages.get(jid) ?? [];
        buffer.push({ sender, text });
        if (buffer.length > MessageHandler.MAX_PENDING_MESSAGES_PER_GROUP) {
            buffer.splice(0, buffer.length - MessageHandler.MAX_PENDING_MESSAGES_PER_GROUP);
        }
        this.pendingModerationMessages.set(jid, buffer);
    }

    async handleMessage({ messages, type }: MessageUpsert): Promise<void> {
        if (type !== 'notify') return;

        for (const msg of messages) {
            let msgContent: any;
            try {
                msgContent = msg.message;
                if (!msgContent || msg.key.remoteJid === 'status@broadcast') continue;
            } catch (err) {
                logger.warn({ err }, '[handleMessage] skipping undecryptable message');
                continue;
            }

            try {
                // O número do bot participa de várias outras communities/grupos sem
                // relação com a All Stack — em grupo, o bot só processa/reage se
                // for um grupo vinculado à All Stack Community. Privado (DM) segue liberado.
                const remoteJid = msg.key.remoteJid;
                if (remoteJid?.endsWith('@g.us') && !(await this.isCommunityGroup(remoteJid))) {
                    continue;
                }

                const text: string =
                    msgContent.conversation ||
                    msgContent.extendedTextMessage?.text ||
                    '';

                if (!text) continue;

                this.bufferForModeration(msg.key.remoteJid, msg.key.participant || msg.key.remoteJid, text);

                if (text.startsWith(botConfig.commands.prefix)) {
                    logger.debug({ text, jid: msg.key.remoteJid }, '[handleMessage] command detected');
                    this.trackGroupMessage(msg.key.remoteJid, msg.key);
                    await this.handleCommand(msg, text.split(' '));
                }
            } catch (err) {
                logger.error({ err, text: msgContent.conversation?.slice(0, 50) }, '[handleMessage] command error');
            }
        }
    }

    async handleGroupParticipantsUpdate({ id, participants, action }: any): Promise<void> {
        logger.debug({ id, participants, action }, '[handleGroupParticipantsUpdate] event received');

        if (action !== 'add' || !participants?.length) return;
        if (!(await this.isCommunityGroup(id))) return;

        for (const participant of participants) {
            try {
                const participantId: string = participant.id;
                const resolvedJid = participant.phoneNumber
                    ? participant.phoneNumber
                    : await resolvePnJid(this.sock, participantId);

                logger.debug({ participantId, resolvedJid, groupId: id }, '[handleGroupParticipantsUpdate] checking ban for participant');

                const ban = await this.banService.getActiveBan(resolvedJid, id);
                logger.debug({ resolvedJid, found: !!ban }, '[handleGroupParticipantsUpdate] ban lookup result');
                if (!ban) continue;

                logger.info({ resolvedJid, groupId: id }, 'Removing banned user on re-entry');

                // Se várias pessoas banidas entrarem juntas (add em lote), espaça as remoções.
                await humanBulkActionDelay();
                const removeFailed = await this.sock.groupParticipantsUpdate(id, [participantId], 'remove')
                    .then(() => false)
                    .catch((e: any) => {
                        logger.error({ err: e }, 'Failed to remove banned user on re-entry');
                        return true;
                    });

                const number = resolvedJid.split('@')[0];
                const banTypeLabel = this.resolveBanTypeLabel(ban.banType);
                const expires = ban.expiresAt
                    ? ` (expira: ${new Date(ban.expiresAt).toLocaleString('pt-BR')})`
                    : '';

                if (removeFailed) {
                    await this.sendLog(
                        `⚠️ @${number} reentrou com banimento ativo (${banTypeLabel}${expires} — Motivo: ${ban.reason}) mas não consegui removê-lo(a) automaticamente. Confira manualmente.`,
                        [resolvedJid],
                    );
                    continue;
                }

                const msg = `🚫 @${number} removido — banimento ativo\nTipo: ${banTypeLabel}${expires}\nMotivo: ${ban.reason}`;
                await this.replySafe(id, msg);
                logger.info({ resolvedJid, groupId: id, reason: ban.reason }, 'Banned user removed on re-entry');

                await this.sendLog(
                    `🚫 @${number} tentou re-entrar e foi removido — ${banTypeLabel}${expires} — Motivo: ${ban.reason}`,
                    [resolvedJid],
                );
            } catch (err) {
                logger.warn({ err, participant }, '[handleGroupParticipantsUpdate] error checking participant');
            }
        }
    }

    /**
     * Pedido de entrada em grupo com aprovação de admin ativada — rejeita na hora
     * se a pessoa tiver um banimento ativo pra esse grupo (comunidade, ou
     * permanente/temporário daquele grupo específico), sem deixar ela entrar.
     */
    async handleGroupJoinRequest({ id, participant, participantPn, action }: any): Promise<void> {
        logger.debug({ id, participant, action }, '[handleGroupJoinRequest] event received');

        if (action !== 'created') return;
        if (!(await this.isCommunityGroup(id))) return;

        try {
            const resolvedJid = participantPn || (await resolvePnJid(this.sock, participant));

            const ban = await this.banService.getActiveBan(resolvedJid, id);
            if (ban) {
                const number = resolvedJid.split('@')[0];
                const banTypeLabel = this.resolveBanTypeLabel(ban.banType);

                const rejectFailed = await this.sock.groupRequestParticipantsUpdate(id, [participant], 'reject')
                    .then(() => false)
                    .catch((e: any) => {
                        logger.error({ err: e }, 'Failed to reject join request from banned user');
                        return true;
                    });

                if (rejectFailed) {
                    await this.sendLog(
                        `⚠️ @${number} pediu entrada com banimento ${banTypeLabel} ativo (Motivo: ${ban.reason}) mas não consegui rejeitar automaticamente. Confira manualmente.`,
                        [resolvedJid],
                    );
                    return;
                }

                logger.info({ resolvedJid, groupId: id, reason: ban.reason }, 'Rejected join request from banned user');

                await this.sendLog(
                    `🚫 Pedido de entrada de @${number} rejeitado automaticamente — banimento ${banTypeLabel} ativo — Motivo: ${ban.reason}`,
                    [resolvedJid],
                );
                return;
            }

            // Não banido — só avisa quem é responsável pelo grupo, pra revisar manualmente.
            const responsibleAdmins = await this.adminResponsibilityService.getResponsibleAdmins(id);
            if (!responsibleAdmins.length) return;

            let groupName = id;
            try {
                groupName = (await this.sock.groupMetadata(id)).subject;
            } catch { /* usa o jid mesmo se falhar */ }

            const mentionsText = responsibleAdmins.map((a) => `@${a.split('@')[0]}`).join(' ');
            await this.sendLog(
                `📥 Pedido de entrada pendente em *${groupName}* — @${resolvedJid.split('@')[0]}. ${mentionsText}, dá uma olhada quando puder.`,
                [...responsibleAdmins, resolvedJid],
            );
        } catch (err) {
            logger.warn({ err, participant }, '[handleGroupJoinRequest] error checking join request');
        }
    }

    /**
     * Varre todos os grupos que o bot participa e aplica o logo da comunidade
     * em qualquer um que não tenha foto. Chamado ao conectar e a cada ciclo
     * horário — só grava (updateProfilePicture) nos grupos que precisam, e
     * espaça essas escritas pra não parecer uma rajada de ações do bot.
     */
    async checkAndApplyGroupPhotos(): Promise<void> {
        if (!fs.existsSync(DEFAULT_LOGO_PATH)) {
            logger.warn({ path: DEFAULT_LOGO_PATH }, '[checkAndApplyGroupPhotos] logo padrão não encontrado, pulando');
            return;
        }

        let groups: Record<string, GroupMetadata>;
        try {
            groups = await this.sock.groupFetchAllParticipating();
        } catch (err) {
            logger.warn({ err }, '[checkAndApplyGroupPhotos] falha ao listar grupos');
            await this.sendLog('⚠️ Falha na varredura automática de fotos de grupo (não consegui nem listar os grupos). Confira os logs do servidor.').catch(() => {});
            return;
        }

        const logoBuffer = fs.readFileSync(DEFAULT_LOGO_PATH);
        const communityGroupIds = await this.getCommunityGroupIds();

        for (const gid of Object.keys(groups)) {
            if (!communityGroupIds.has(gid)) continue;

            const lastNotAuthorized = this.notAuthorizedPhotoGroups.get(gid);
            if (lastNotAuthorized && Date.now() - lastNotAuthorized < MessageHandler.PHOTO_RETRY_COOLDOWN_MS) {
                continue;
            }

            try {
                await this.sock.profilePictureUrl(gid, 'image');
                // já tem foto — não mexe
                this.notAuthorizedPhotoGroups.delete(gid);
            } catch {
                await humanBulkActionDelay();
                try {
                    await this.sock.updateProfilePicture(gid, logoBuffer);
                    logger.info({ groupId: gid }, '[checkAndApplyGroupPhotos] logo aplicado (grupo sem foto)');
                    this.notAuthorizedPhotoGroups.delete(gid);
                } catch (err) {
                    if (err instanceof Error && err.message === 'not-authorized') {
                        this.notAuthorizedPhotoGroups.set(gid, Date.now());
                        logger.debug({ groupId: gid }, '[checkAndApplyGroupPhotos] bot não é admin nesse grupo, pulando por 24h');
                    } else {
                        logger.warn({ err, groupId: gid }, '[checkAndApplyGroupPhotos] falha ao aplicar logo');
                        await this.sendLog(`⚠️ Não consegui aplicar a logo automaticamente no grupo *${(groups[gid] as GroupMetadata)?.subject || gid}*. Confira os logs do servidor.`).catch(() => {});
                    }
                }
            }
        }
    }

    /**
     * Ciclo horário de moderação por IA. Só olha grupos com mensagem nova desde
     * a última vez (buffer não-vazio) — se não tiver nenhuma, nem chama a IA.
     * Ações: `banir_comunidade` vai direto pro BanService (regras que preveem
     * banimento imediato); qualquer outra violação vira uma advertência comum,
     * que já escalona sozinha em 3/mês via WarningService.
     */
    async runAiModerationCycle(): Promise<void> {
        if (!this.aiModerationService.isConfigured()) return;

        for (const [groupJid, messages] of this.pendingModerationMessages.entries()) {
            if (!messages.length) continue;
            this.pendingModerationMessages.set(groupJid, []); // consome antes de processar

            try {
                const violations = await this.aiModerationService.evaluateMessages(messages);
                if (!violations.length) continue;

                let metadata: GroupMetadata | undefined;
                try { metadata = await this.sock.groupMetadata(groupJid); } catch { /* segue sem nome bonito */ }

                for (const violation of violations) {
                    const resolvedJid = await resolvePnJid(this.sock, violation.sender, metadata);
                    const number = resolvedJid.split('@')[0];

                    if (violation.action === 'banir_comunidade') {
                        const targetParticipant = metadata ? findParticipant(metadata, resolvedJid) : undefined;
                        await this.banService.ban({
                            userJid: resolvedJid,
                            displayName: targetParticipant?.notify || targetParticipant?.name || undefined,
                            groupJid,
                            banType: 'COMUNIDADE' as any,
                            reason: `[IA] ${violation.reason}`,
                            bannedBy: 'ia-moderacao',
                        });
                        if (targetParticipant) {
                            await this.sock.groupParticipantsUpdate(groupJid, [targetParticipant.id], 'remove').catch(async (err: any) => {
                                logger.error({ err, groupJid, targetJid: resolvedJid }, '[runAiModerationCycle] falha ao remover após ban da IA');
                                await this.sendLog(`⚠️ IA baniu @${number} mas não consegui removê-lo(a) do grupo *${metadata?.subject || groupJid}* automaticamente. Confira manualmente.`, [resolvedJid]);
                            });
                        }
                        await this.sendLog(
                            `🤖🚫 IA detectou violação grave de @${number} em *${metadata?.subject || groupJid}* — banido de toda a comunidade.\nMotivo: ${violation.reason}`,
                            [resolvedJid],
                        );
                    } else {
                        await this.warningService.issue(resolvedJid, groupJid, `[IA] ${violation.reason}`, 'ia-moderacao');
                        const count = await this.warningService.countThisMonth(resolvedJid, groupJid);
                        await this.sendLog(
                            `🤖⚠️ IA advertiu @${number} em *${metadata?.subject || groupJid}* (${count}/3 esse mês).\nMotivo: ${violation.reason}`,
                            [resolvedJid],
                        );
                        if (count >= 3 && metadata) {
                            await this.applyWarningPunishment(resolvedJid, groupJid, metadata);
                        }
                    }
                }
            } catch (err) {
                logger.warn({ err, groupJid }, '[runAiModerationCycle] erro processando moderação do grupo');
                await this.sendLog(`⚠️ Erro no ciclo de moderação por IA num grupo. Confira os logs do servidor.`).catch(() => {});
            }
        }
    }

    /**
     * Roda periodicamente — readiciona automaticamente quem teve um
     * banimento temporário expirado, sem esperar a pessoa pedir pra voltar.
     * O registro do banimento é removido de qualquer forma (o tempo já
     * passou), a tentativa de readição é só uma cortesia por cima disso.
     */
    async reAddExpiredBans(): Promise<void> {
        let expired: any[];
        try {
            expired = await this.banService.getExpiredTemporaryBans();
        } catch (err) {
            logger.warn({ err }, '[reAddExpiredBans] falha ao buscar banimentos expirados');
            return;
        }

        for (const ban of expired) {
            const { userJid, groupJid } = ban;
            await this.banService.unban(userJid, groupJid).catch(() => {});
            await this.tryReAddToGroup(userJid, groupJid, 'o banimento temporário expirou');
        }
    }

    /**
     * Tenta readicionar alguém a um grupo — usado tanto pela expiração
     * automática de banimento temporário quanto pelo `$unban` manual. Pula
     * silenciosamente se o grupo não existir mais ou a pessoa já estiver
     * nele; sempre avisa o grupo de admins no sucesso ou na falha (com link
     * de convite de fallback, já que privacidade pode impedir add direto).
     */
    private async tryReAddToGroup(userJid: string, groupJid: string, contextLabel: string): Promise<void> {
        const number = userJid.split('@')[0];

        let metadata: GroupMetadata;
        try {
            metadata = await this.sock.groupMetadata(groupJid);
        } catch {
            return; // grupo não existe mais / bot saiu — nada pra readicionar
        }

        if (findParticipant(metadata, userJid)) return; // já está no grupo

        try {
            await humanBulkActionDelay();
            const result = await this.sock.groupParticipantsUpdate(groupJid, [userJid], 'add');
            const status = result?.[0]?.status;

            if (status === '200') {
                await this.sendLog(`✅ @${number} foi readicionado(a) ao grupo *${metadata.subject}* automaticamente — ${contextLabel}.`, [userJid]);
            } else {
                let inviteLink = '';
                try {
                    const code = await this.sock.groupInviteCode(groupJid);
                    if (code) inviteLink = `\nLink de convite: https://chat.whatsapp.com/${code}`;
                } catch { /* segue sem link */ }
                await this.sendLog(
                    `⚠️ @${number} — ${contextLabel}, mas não consegui readicioná-lo(a) automaticamente ao grupo *${metadata.subject}* (provavelmente as configurações de privacidade dela não permitem). Precisa convidar manualmente.${inviteLink}`,
                    [userJid],
                );
            }
        } catch (err) {
            logger.error({ err, userJid, groupJid }, '[tryReAddToGroup] erro tentando readicionar');
            await this.sendLog(`⚠️ Erro ao tentar readicionar @${number} automaticamente ao grupo *${metadata.subject}* (${contextLabel}). Confira manualmente.`, [userJid]).catch(() => {});
        }
    }

    /** Preenche o cache de descrições conhecidas — chamado ao conectar. */
    async primeDescriptionCache(): Promise<void> {
        try {
            const groups = await this.sock.groupFetchAllParticipating();
            const communityGroupIds = await this.getCommunityGroupIds();
            for (const [gid, meta] of Object.entries(groups)) {
                if (!communityGroupIds.has(gid)) continue;
                this.descriptionCache.set(gid, (meta as any).desc);
            }
            this.descriptionCachePrimed = true;
        } catch (err) {
            logger.warn({ err }, '[primeDescriptionCache] falha ao listar grupos');
        }
    }

    // Cache dos grupos que pertencem à All Stack Community (via linkedParent).
    // O número do bot participa de dezenas de outros grupos/communities sem
    // relação nenhuma com a All Stack — nada disso pode ser tocado pelo bot.
    private communityGroupIdsCache: { ids: Set<string>; at: number } | undefined;
    private static readonly COMMUNITY_CACHE_TTL_MS = 10 * 60 * 1000;

    private async getCommunityGroupIds(): Promise<Set<string>> {
        if (this.communityGroupIdsCache && Date.now() - this.communityGroupIdsCache.at < MessageHandler.COMMUNITY_CACHE_TTL_MS) {
            return this.communityGroupIdsCache.ids;
        }

        // Preferência: Community detectada automaticamente quando $home rodou
        // (gravada no banco); COMMUNITY_JID no .env é só um fallback manual,
        // pra quando o grupo de admins registrado não é o de uma Community.
        const communityJid = (await this.adminService.getCommunityJid()) || botConfig.communityJid;
        if (!communityJid) {
            logger.warn('[getCommunityGroupIds] nenhuma Community detectada (rode $home de novo, ou configure COMMUNITY_JID) — nenhuma ação em massa vai rodar');
            return new Set();
        }

        const ids = new Set<string>([communityJid]);
        try {
            const groups = await this.sock.groupFetchAllParticipating();
            for (const [gid, meta] of Object.entries(groups)) {
                if ((meta as GroupMetadata).linkedParent === communityJid) {
                    ids.add(gid);
                }
            }
        } catch (err) {
            logger.warn({ err }, '[getCommunityGroupIds] falha ao listar grupos');
        }

        this.communityGroupIdsCache = { ids, at: Date.now() };
        return ids;
    }

    private async isCommunityGroup(gid: string | undefined): Promise<boolean> {
        if (!gid) return false;
        const ids = await this.getCommunityGroupIds();
        return ids.has(gid);
    }

    /**
     * Detecta mudança de descrição de grupo (evento `groups.update`). Três
     * casos: (1) foi o próprio bot que mudou (ex: $regras) — só atualiza o
     * cache; (2) o grupo está travado por rejeição anterior — restaura a
     * versão congelada na hora; (3) edição de verdade por um admin — abre
     * votação no grupo de admins.
     */
    async handleGroupsUpdate(updates: Partial<GroupMetadata>[]): Promise<void> {
        if (!this.descriptionCachePrimed) return;

        for (const update of updates) {
            const gid = update.id;
            if (!gid || update.desc === undefined) continue;
            if (!(await this.isCommunityGroup(gid))) continue;

            const newDesc = update.desc;
            const oldDesc = this.descriptionCache.get(gid);
            if (newDesc === oldDesc) continue;

            const selfUpdateAt = this.recentSelfDescriptionUpdate.get(gid);
            const isSelfUpdate = selfUpdateAt !== undefined && Date.now() - selfUpdateAt < MessageHandler.SELF_UPDATE_WINDOW_MS;
            if (isSelfUpdate) {
                this.recentSelfDescriptionUpdate.delete(gid);
                this.descriptionCache.set(gid, newDesc);
                continue;
            }

            try {
                const lock = await this.descriptionChangeService.getLock(gid);
                if (lock) {
                    logger.info({ groupId: gid }, '[handleGroupsUpdate] descrição alterada durante trava — restaurando');
                    this.recentSelfDescriptionUpdate.set(gid, Date.now());
                    const revertFailed = await this.sock.groupUpdateDescription(gid, lock.frozenDescription ?? undefined)
                        .then(() => false)
                        .catch((err: any) => {
                            logger.error({ err, groupId: gid }, '[handleGroupsUpdate] falha ao reverter descrição travada');
                            return true;
                        });

                    if (revertFailed) {
                        this.recentSelfDescriptionUpdate.delete(gid);
                        this.descriptionCache.set(gid, newDesc);
                        await this.sendLog(
                            `⚠️ Grupo *${update.subject || gid}* está travado (rejeitado anteriormente) e a descrição foi alterada de novo, mas não consegui reverter automaticamente. Confira/reverta manualmente. Trava até ${lock.lockedUntil.toLocaleString('pt-BR')}.`,
                        );
                        continue;
                    }

                    this.descriptionCache.set(gid, lock.frozenDescription ?? undefined);
                    await this.sendLog(
                        `🔒 Grupo *${update.subject || gid}* está com a descrição travada (rejeitada anteriormente) — mudança revertida automaticamente. Trava até ${lock.lockedUntil.toLocaleString('pt-BR')}.`,
                    );
                    continue;
                }

                // Marca a descrição nova no cache ANTES de abrir a votação (que é
                // assíncrona e demora, por causa do delay humanizado no envio). Se o
                // WhatsApp disparar o mesmo evento de novo enquanto a votação ainda
                // está sendo postada, essa segunda chamada já vê newDesc === oldDesc
                // e ignora, em vez de abrir uma votação duplicada pra mesma mudança.
                this.descriptionCache.set(gid, newDesc);
                await this.openDescriptionVote(gid, oldDesc, newDesc, update.descOwner || update.subjectOwner);
            } catch (err) {
                logger.warn({ err, groupId: gid }, '[handleGroupsUpdate] erro processando mudança de descrição');
            }
        }
    }

    private async openDescriptionVote(
        groupJid: string,
        oldDescription: string | undefined,
        newDescription: string | undefined,
        proposedBy: string | undefined,
    ): Promise<void> {
        const adminGroupJid = await this.getLogJid();
        if (!adminGroupJid) {
            logger.warn({ groupId: groupJid }, '[openDescriptionVote] sem grupo de admins registrado — não dá pra votar');
            return;
        }

        let groupName = groupJid;
        try {
            groupName = (await this.sock.groupMetadata(groupJid)).subject;
        } catch { /* usa o jid mesmo se falhar */ }

        const text = [
            `📝 *Mudança de descrição detectada* — ${groupName}`,
            proposedBy ? `Por: @${proposedBy.split('@')[0]}` : '',
            '',
            '*Antes:*',
            oldDescription || '_(vazia)_',
            '',
            '*Depois:*',
            newDescription || '_(vazia)_',
            '',
            'Reaja ✅ pra aprovar ou ❌ pra rejeitar. Se a maioria rejeitar, a versão antiga volta e o grupo fica travado por 7 dias.',
        ].filter(Boolean).join('\n');

        const sent = await this.sock.sendMessage(adminGroupJid, {
            text,
            mentions: proposedBy ? [proposedBy] : undefined,
        }).catch((err) => {
            logger.warn({ err }, '[openDescriptionVote] falha ao postar votação');
            return undefined;
        });

        if (!sent?.key?.id) return;
        this.trackGroupMessage(adminGroupJid, sent.key);

        await this.descriptionChangeService.createPending({
            groupJid,
            oldDescription,
            newDescription,
            proposedBy: proposedBy || 'desconhecido',
            voteMessageId: sent.key.id,
            voteGroupJid: adminGroupJid,
        });
    }

    /** Reações (`messages.reaction`) — só processa quando batem com uma votação de descrição pendente. */
    async handleReaction(reactions: { key: any; reaction: any }[]): Promise<void> {
        for (const { key, reaction } of reactions) {
            if (!key?.id) continue;

            try {
                const change = await this.descriptionChangeService.findPendingByVoteMessageId(key.id);
                if (!change) continue;

                const emoji: string | undefined = reaction?.text;
                const reactorRaw: string | undefined = reaction?.key?.participant || reaction?.key?.remoteJid;
                if (!reactorRaw) continue;

                const votes = this.descriptionVotes.get(key.id) ?? new Map<string, 'approve' | 'reject'>();
                if (emoji === '✅') {
                    votes.set(reactorRaw, 'approve');
                } else if (emoji === '❌') {
                    votes.set(reactorRaw, 'reject');
                } else {
                    votes.delete(reactorRaw); // reação removida ou trocada por outro emoji — não conta
                }
                this.descriptionVotes.set(key.id, votes);

                await this.tallyDescriptionVote(change, votes);
            } catch (err) {
                logger.warn({ err }, '[handleReaction] erro processando reação de votação');
            }
        }
    }

    private async tallyDescriptionVote(change: any, votes: Map<string, 'approve' | 'reject'>): Promise<void> {
        let adminCount = 0;
        try {
            const meta = await this.sock.groupMetadata(change.voteGroupJid);
            adminCount = meta.participants.length;
        } catch {
            return; // sem saber o total, não arrisca decidir
        }

        const majority = Math.floor(adminCount / 2) + 1;
        const approvals = [...votes.values()].filter((v) => v === 'approve').length;
        const rejections = [...votes.values()].filter((v) => v === 'reject').length;

        if (approvals >= majority) {
            await this.descriptionChangeService.resolve(change.id, 'APPROVED');
            this.descriptionVotes.delete(change.voteMessageId);
            await this.sendLog(`✅ Mudança de descrição aprovada pela maioria — mantida.`);
        } else if (rejections >= majority) {
            await this.descriptionChangeService.resolve(change.id, 'REJECTED');
            await this.descriptionChangeService.setLock(change.groupJid, change.oldDescription ?? undefined);
            this.descriptionVotes.delete(change.voteMessageId);
            this.recentSelfDescriptionUpdate.set(change.groupJid, Date.now());
            await this.sock.groupUpdateDescription(change.groupJid, change.oldDescription ?? undefined).catch((err) => {
                logger.warn({ err }, '[tallyDescriptionVote] falha ao restaurar descrição rejeitada');
            });
            this.descriptionCache.set(change.groupJid, change.oldDescription ?? undefined);
            await this.sendLog(
                `❌ Mudança de descrição rejeitada pela maioria — restaurada a versão anterior. Grupo travado por 7 dias.`,
            );
        }
        // senão, segue pendente aguardando mais votos
    }

    private async handleCommand(msg: any, parts: string[]): Promise<void> {
        const command = parts[0].slice(botConfig.commands.prefix.length).toLowerCase();
        const args = parts.slice(1);
        const jid = msg.key.remoteJid!;

        const handler = this.commands[command];
        if (handler) {
            // Confirma na hora que reconheceu o comando e vai processar — o
            // handler específico pode reagir de novo depois (ex: ⚠️ no
            // $advertir) e essa reação final substitui a ✅ automaticamente.
            await this.reactSafe(jid, msg.key, '✅');
            await handler(msg, args);
        } else {
            await this.reactSafe(jid, msg.key, '❌');
        }
    }

    /**
     * Sender must be (a) admin of the group the command was typed in, and
     * (b) a member of a registered admin group (see $home).
     */
    private async isAuthorized(msg: any): Promise<boolean> {
        const jid = msg.key.remoteJid!;

        if (!jid.endsWith('@g.us')) {
            await this.replySafe(jid, '❌ Este comando só funciona em grupos.');
            return false;
        }

        let metadata: GroupMetadata;
        try {
            metadata = await this.sock.groupMetadata(jid);
        } catch {
            await this.replySafe(jid, '❌ Erro ao verificar permissões. Tente novamente.');
            return false;
        }

        const senderRaw = msg.key.participant! || msg.key.remoteJid!;
        const senderParticipant = findParticipant(metadata, senderRaw);

        if (!isGroupAdmin(senderParticipant)) {
            await this.replySafe(jid, '❌ Você precisa ser admin do grupo para usar este comando.');
            return false;
        }

        const senderJid = await resolvePnJid(this.sock, senderRaw, metadata);
        if (!(await this.isMemberOfAdminGroup(senderRaw, senderJid))) {
            await this.replySafe(jid, '❌ Você precisa estar no grupo de administração para usar este comando.');
            return false;
        }

        return true;
    }

    private async isMemberOfAdminGroup(rawJid: string, resolvedJid: string): Promise<boolean> {
        const adminGroups = await this.adminService.getAdminGroups();
        for (const groupJid of adminGroups) {
            try {
                const meta = await this.sock.groupMetadata(groupJid);
                if (findParticipant(meta, rawJid) || findParticipant(meta, resolvedJid)) return true;
            } catch (err) {
                logger.warn({ err, groupJid }, '[isMemberOfAdminGroup] failed to fetch admin group metadata');
            }
        }
        return false;
    }

    private async getLogJid(): Promise<string | null> {
        const groups = await this.adminService.getAdminGroups();
        return groups.length > 0 ? groups[0] : null;
    }

    private async sendLog(text: string, mentions?: string[]): Promise<void> {
        const logJid = await this.getLogJid();
        if (!logJid) return;
        const opts: any = { text };
        if (mentions?.length) opts.mentions = mentions;
        const sent = await this.sock.sendMessage(logJid, opts).catch((e: any) => {
            logger.error({ err: e }, 'Failed to send log message');
            return undefined;
        });
        this.trackGroupMessage(logJid, sent?.key);
    }

    private resolveBanType(arg: string): string {
        switch (arg) {
            case 'permanente':
            case 'perm': return 'PERMANENTE';
            case 'comunidade':
            case 'comm': return 'COMUNIDADE';
            case 'temporario':
            case 'temp':
            default: return 'TEMPORARIO';
        }
    }

    private resolveBanTypeLabel(t: string): string {
        const map: Record<string, string> = {
            PERMANENTE: 'permanente',
            TEMPORARIO: 'temporário',
            COMUNIDADE: 'comunidade',
        };
        return map[t] || t;
    }

    private getTargetJid(msg: any): { jid: string | null; fromQuoted: boolean } {
        // 1. Try mention
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentioned?.length) {
            return { jid: mentioned[0], fromQuoted: false };
        }

        // 2. Try quoted message (resposta a mensagem do membro)
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (quotedParticipant) {
            return { jid: quotedParticipant, fromQuoted: true };
        }

        return { jid: null, fromQuoted: false };
    }

    private async homeCommand(msg: any): Promise<void> {
        const jid = msg.key.remoteJid!;

        if (!jid.endsWith('@g.us')) {
            await this.sock.sendMessage(jid, { text: '❌ Este comando só funciona em grupos.' }).catch(() => {});
            return;
        }

        let metadata: GroupMetadata;
        try {
            metadata = await this.sock.groupMetadata(jid);
        } catch (err) {
            logger.error({ err }, '[homeCommand] failed to fetch group metadata');
            await this.replySafe(jid, '❌ Erro ao buscar dados do grupo. Tente novamente.');
            return;
        }

        const senderRaw = msg.key.participant! || msg.key.remoteJid!;
        const senderParticipant = findParticipant(metadata, senderRaw);

        if (!isGroupAdmin(senderParticipant)) {
            await this.replySafe(jid, '❌ Apenas admins do grupo podem registrar o grupo de admins.');
            return;
        }

        await this.adminService.registerGroup(jid);

        // Detecta a Community automaticamente a partir do próprio grupo de admins —
        // elimina a necessidade de configurar COMMUNITY_JID na mão no servidor.
        const communityJid = metadata.linkedParent;
        if (communityJid) {
            await this.adminService.setCommunityJid(jid, communityJid);
            this.communityGroupIdsCache = undefined; // força recalcular já, sem esperar o cache expirar
            await this.replySafe(jid, `✅ Grupo registrado como admin/log.\nID: \`${jid}\`\n🏘️ Community detectada — ações em massa (regras, foto, $ban comunidade, etc.) ficam restritas só aos grupos dela.`);
        } else {
            await this.replySafe(jid, `✅ Grupo registrado como admin/log.\nID: \`${jid}\`\n⚠️ Esse grupo não está vinculado a nenhuma Community do WhatsApp — ações em massa só funcionam se \`COMMUNITY_JID\` estiver configurado manualmente no servidor.`);
        }

        logger.info({ groupJid: jid, communityJid }, 'Admin group registered');
    }

    /**
     * Diagnóstico rápido — sobretudo útil depois de trocar o número do bot
     * (perda/ban do número atual), pra confirmar que ele reconectou com o
     * número certo e que os dados persistidos (grupos de admin, banimentos)
     * seguiram intactos, já que nada disso depende do número do bot.
     */
    private async statusCommand(msg: any): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const botNumber = this.sock.user?.id?.split(':')[0]?.split('@')[0] || 'desconhecido';
        const adminGroups = await this.adminService.getAdminGroups();
        const bans = await this.banService.getBans();
        const activeBans = bans.filter((b) => !b.expiresAt || new Date(b.expiresAt) > new Date());

        const text = [
            '🤖 *Status do bot*',
            `Número conectado: ${botNumber}`,
            `Grupos de admin registrados: ${adminGroups.length}`,
            `Banimentos ativos: ${activeBans.length} (histórico total: ${bans.length})`,
        ].join('\n');

        await this.replySafe(jid, text);
    }

    /**
     * Sem exigir isAuthorized() de propósito: é justamente quem ainda não sabe
     * usar o bot (ou nem foi adicionado ao grupo de admins ainda) que mais
     * precisa conseguir ver isso.
     */
    private async helpCommand(msg: any): Promise<void> {
        const jid = msg.key.remoteJid!;
        const prefix = botConfig.commands.prefix;

        const text = [
            '🤖 *Comandos principais*',
            '',
            `${prefix}home — registra este grupo como grupo de administração`,
            `${prefix}ban @user [permanente|temporario|comunidade] [motivo] — bane alguém (ou responda a mensagem dela)`,
            `${prefix}unban @user — remove o banimento (menção, reply, ou número)`,
            `${prefix}bans — lista quem está banido`,
            '',
            `📖 Guia completo com todos os comandos e como o banimento funciona:`,
            botConfig.docsUrl,
        ].join('\n');

        await this.replySafe(jid, text);
    }

    /**
     * Aplica o link das regras da comunidade na descrição de TODOS os grupos
     * que o bot administra, na próxima linha livre — pula quem já tem o link.
     * É uma ação em massa (uma escrita por grupo), então espaça cada escrita
     * pra não parecer uma rajada de mudanças vindas do mesmo número.
     */
    private async regrasCommand(msg: any): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const rulesUrl = `${botConfig.docsUrl}regras.html`;

        let groups: Record<string, any>;
        try {
            groups = await this.sock.groupFetchAllParticipating();
        } catch (err) {
            logger.warn({ err }, '[regrasCommand] falha ao listar grupos');
            await this.replySafe(jid, '❌ Erro ao listar os grupos. Tente novamente.');
            return;
        }

        let updated = 0;
        let skipped = 0;
        const communityGroupIds = await this.getCommunityGroupIds();

        for (const [gid, meta] of Object.entries(groups)) {
            if (!communityGroupIds.has(gid)) continue;

            const currentDesc: string = (meta as any).desc || '';
            if (currentDesc.includes(rulesUrl)) {
                skipped++;
                continue;
            }

            const newDesc = currentDesc
                ? `${currentDesc}\n\n📋 Regras: ${rulesUrl}`
                : `📋 Regras: ${rulesUrl}`;

            await humanBulkActionDelay();
            try {
                this.recentSelfDescriptionUpdate.set(gid, Date.now());
                await this.sock.groupUpdateDescription(gid, newDesc);
                updated++;
            } catch (err) {
                logger.warn({ err, groupId: gid }, '[regrasCommand] falha ao atualizar descrição');
            }
        }

        await this.reactSafe(jid, msg.key, '✅');
        await this.replySafe(jid, `✅ Link das regras aplicado em ${updated} grupo(s) (${skipped} já tinham o link).`);
        await this.sendLog(`📋 $regras rodado — ${updated} grupo(s) atualizado(s), ${skipped} já tinham o link.`);
    }

    /** Acha o grupo "Avisos" que o WhatsApp cria automaticamente pra toda Community. */
    private async findCommunityAnnounceGroupJid(): Promise<string | null> {
        // O bot participa do "Avisos" de várias communities diferentes — tem que
        // ser especificamente o vinculado à All Stack, senão o anúncio de
        // promoção pode ir parar na community errada.
        const communityGroupIds = await this.getCommunityGroupIds();
        if (!communityGroupIds.size) return null;

        try {
            const groups = await this.sock.groupFetchAllParticipating();
            for (const [gid, meta] of Object.entries(groups)) {
                if ((meta as GroupMetadata).isCommunityAnnounce && communityGroupIds.has(gid)) return gid;
            }
        } catch (err) {
            logger.warn({ err }, '[findCommunityAnnounceGroupJid] falha ao listar grupos');
        }
        return null;
    }

    /**
     * Lista os grupos da All Stack Community com um ID curto e estável (veja
     * CommunityGroup no schema) — pra referenciar um grupo em $responsavel sem
     * precisar colar o JID nem estar dentro dele.
     */
    private async gruposCommand(msg: any): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const communityGroupIds = await this.getCommunityGroupIds();

        let groups: Record<string, GroupMetadata>;
        try {
            groups = await this.sock.groupFetchAllParticipating();
        } catch (err) {
            logger.warn({ err }, '[gruposCommand] falha ao listar grupos');
            await this.replySafe(jid, '❌ Erro ao listar os grupos. Tente novamente.');
            return;
        }

        for (const [gid, meta] of Object.entries(groups)) {
            if (!communityGroupIds.has(gid)) continue;
            await this.communityGroupService.upsertSeen(gid, (meta as GroupMetadata).subject);
        }

        const entries = (await this.communityGroupService.getAll()).filter((e) => communityGroupIds.has(e.groupJid));

        if (!entries.length) {
            await this.replySafe(jid, '❌ Nenhum grupo da comunidade encontrado ainda.');
            return;
        }

        const list = entries.map((e) => `${e.shortId}. ${e.subject || e.groupJid}`).join('\n');
        await this.reactSafe(jid, msg.key, '✅');
        await this.replySafe(
            jid,
            `📋 *Grupos da comunidade* (${entries.length})\n${list}\n\nUse o número pra referenciar o grupo, ex: $responsavel ${entries[0].shortId} @admin`,
        );
    }

    /**
     * Marca um admin como responsável por um grupo. Sem argumento numérico,
     * usa o grupo atual (comportamento original). Com um ID no início (veja
     * $grupos), referencia outro grupo — dá pra rodar isso do grupo de admins
     * sem precisar entrar no grupo alvo.
     */
    private async responsavelCommand(msg: any, args: string[]): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const currentJid = msg.key.remoteJid!;

        let targetGroupJid = currentJid;
        const maybeId = args[0] && /^\d+$/.test(args[0]) ? parseInt(args[0], 10) : null;
        if (maybeId !== null) {
            const resolved = await this.communityGroupService.getJidByShortId(maybeId);
            if (!resolved) {
                await this.replySafe(currentJid, `❌ Nenhum grupo com o ID ${maybeId}. Use $grupos pra ver a lista.`);
                return;
            }
            targetGroupJid = resolved;
        }

        const metadata = await this.sock.groupMetadata(targetGroupJid);
        const { jid: targetRaw } = this.getTargetJid(msg);

        if (!targetRaw) {
            await this.replySafe(currentJid, '❌ Marque a pessoa ou responda a mensagem dela. Ex: $responsavel @admin (ou $responsavel <id> @admin a partir do grupo de admins — veja $grupos)');
            return;
        }

        const targetJid = await resolvePnJid(this.sock, targetRaw, metadata);
        await this.adminResponsibilityService.assign(targetJid, targetGroupJid);

        const number = targetJid.split('@')[0];
        await this.reactSafe(currentJid, msg.key, '✅');
        await this.replySafe(currentJid, `✅ @${number} agora é responsável pelo grupo *${metadata.subject}*.`);

        const logJid = await this.getLogJid();
        if (logJid && logJid !== currentJid) {
            await this.sendLog(`👤 @${number} marcado como responsável pelo grupo *${metadata.subject}*.`, [targetJid]);
        }
    }

    /**
     * Promove alguém a admin do grupo atual, marca ela como responsável por
     * esse grupo, e anuncia no grupo "Avisos" da Community e no próprio grupo.
     */
    private async promoverCommand(msg: any): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const metadata = await this.sock.groupMetadata(jid);
        const { jid: targetRaw } = this.getTargetJid(msg);

        if (!targetRaw) {
            await this.replySafe(jid, '❌ Marque a pessoa ou responda a mensagem dela. Ex: $promover @user');
            return;
        }

        const targetParticipant = findParticipant(metadata, targetRaw);
        const targetJid = await resolvePnJid(this.sock, targetRaw, metadata);

        if (!targetParticipant) {
            await this.replySafe(jid, '❌ Essa pessoa não está nesse grupo.');
            return;
        }

        await this.sock.groupParticipantsUpdate(jid, [targetParticipant.id], 'promote').catch((err: any) => {
            logger.warn({ err }, '[promoverCommand] falha ao promover no WhatsApp');
        });
        await this.adminResponsibilityService.assign(targetJid, jid);

        const number = targetJid.split('@')[0];
        const announcement = `🎉 @${number} foi promovido(a) a admin — agora é responsável pelo grupo *${metadata.subject}*.`;

        await this.reactSafe(jid, msg.key, '✅');
        await this.replySafe(jid, announcement);

        const announceJid = await this.findCommunityAnnounceGroupJid();
        if (announceJid && announceJid !== jid) {
            await this.sendSafe(announceJid, { text: announcement, mentions: [targetJid] });
        }
        await this.sendLog(announcement, [targetJid]);
    }

    private async replySafe(jid: string, text: string): Promise<void> {
        await this.sendSafe(jid, { text });
    }

    private async reactSafe(jid: string, key: any, emoji: string): Promise<void> {
        await this.sendSafe(jid, { react: { text: emoji, key } });
    }

    private async sendSafe(jid: string, content: any): Promise<void> {
        // Pausa curta e aleatória — resposta sempre instantânea é um dos padrões que
        // os modelos de detecção de bot da Meta mais pesam.
        await humanReplyDelay();

        const maxRetries = 5;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const sent = await this.sock.sendMessage(jid, content);
                this.trackGroupMessage(jid, sent?.key);
                return;
            } catch (err) {
                const isSessionError = (err as any)?.name === 'SessionError'
                    || (err as any)?.message?.includes('No sessions')
                    || (err as any)?.message === 'not-acceptable';
                if (isSessionError && i < maxRetries - 1) {
                    logger.warn({ jid, attempt: i + 1 }, '[sendSafe] session not ready, retrying in 3s...');
                    await new Promise((r) => setTimeout(r, 3000));
                } else {
                    logger.warn({ err, jid }, '[sendSafe] failed to send message');
                    return;
                }
            }
        }
    }

    private async banCommand(msg: any, args: string[]): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const metadata = await this.sock.groupMetadata(jid);
        const { jid: targetRaw, fromQuoted } = this.getTargetJid(msg);

        if (!targetRaw) {
            await this.replySafe(jid, '❌ Marque o usuário ou responda a mensagem dele. Ex: $ban @user permanente motivo');
            return;
        }

        const targetParticipant = findParticipant(metadata, targetRaw);

        // Não permite banir admins
        if (isGroupAdmin(targetParticipant)) {
            await this.replySafe(jid, '❌ Não é possível banir um admin do grupo.');
            return;
        }

        const targetJid = await resolvePnJid(this.sock, targetRaw, metadata);
        const bannedBy = await resolvePnJid(this.sock, msg.key.participant! || msg.key.remoteJid!, metadata);

        // Parse args: se veio de reply, args começa do tipo. Se veio de menção, args[0] é a menção
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const mentionOffset = (!fromQuoted && mentionedJid?.length) ? 1 : 0;

        const banTypeArg = args[mentionOffset]?.toLowerCase() || 'temporario';
        const banType = this.resolveBanType(banTypeArg);

        // Duração opcional logo após o tipo (só faz sentido pra TEMPORARIO) — ex:
        // "$ban @user temporario 1m motivo". Se não vier ou não bater o formato,
        // usa o padrão de 7 dias e trata o token como parte do motivo mesmo.
        const durationArg = args[mentionOffset + 1];
        const durationMs = durationArg ? parseDurationMs(durationArg) : null;
        const reasonOffset = mentionOffset + (durationMs !== null ? 2 : 1);
        const reason = args.slice(reasonOffset).join(' ') || 'Não informado';

        const expiresAt = banType === 'TEMPORARIO'
            ? new Date(Date.now() + (durationMs ?? 7 * 24 * 60 * 60 * 1000))
            : undefined;

        await this.banService.ban({
            userJid: targetJid,
            displayName: targetParticipant?.notify || targetParticipant?.name || undefined,
            groupJid: jid,
            banType: banType as any,
            reason,
            expiresAt,
            bannedBy,
        });

        await this.reactSafe(jid, msg.key, '✅');

        // Remoção
        if (banType === 'COMUNIDADE') {
            // "comunidade" = todos os grupos vinculados à All Stack Community (via
            // linkedParent) — nunca outros grupos/communities onde o bot só por acaso participa.
            const allGroups = await this.sock.groupFetchAllParticipating();
            const communityGroupIds = await this.getCommunityGroupIds();
            for (const [gid, meta] of Object.entries(allGroups)) {
                if (!communityGroupIds.has(gid)) continue;
                const p = findParticipant(meta as GroupMetadata, targetJid);
                if (p) {
                    // Espaça as remoções — várias saídas de grupo em sequência rápida, vindas
                    // do mesmo número, é um padrão que a detecção de bot da Meta observa.
                    await humanBulkActionDelay();
                    await this.sock.groupParticipantsUpdate(gid, [p.id], 'remove').catch(() => {});
                }
            }
        } else if (targetParticipant) {
            await this.sock.groupParticipantsUpdate(jid, [targetParticipant.id], 'remove').catch(() => {});
        }

        // Resposta no grupo
        const escopoLabel = banType === 'COMUNIDADE' ? 'removido de todos os grupos' : 'removido do grupo';
        const expiresLabel = expiresAt ? `\nExpira: ${expiresAt.toLocaleString('pt-BR')}` : '';
        await this.replySafe(jid, `🚫 *Banido*\nUsuário: @${targetJid.split('@')[0]}\nTipo: ${this.resolveBanTypeLabel(banType)}${expiresLabel}\nMotivo: ${reason}`);

        // Log no grupo admin
        await this.sendLog(
            `🚫 Membro @${targetJid.split('@')[0]} banido — ${this.resolveBanTypeLabel(banType)}${expiresLabel} — ${escopoLabel} — Motivo: ${reason}`,
            [targetJid],
        );

        logger.info({ targetJid, groupJid: jid, banType, reason }, 'User banned');
    }

    private async unbanCommand(msg: any, args: string[]): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;

        // Alvo por menção/reply (mesmo se a pessoa já não estiver mais no grupo) ou, se
        // nenhum dos dois vier, pelo número completo como fallback: $unban 5541995850310
        const { jid: targetRaw } = this.getTargetJid(msg);
        let userJid: string;

        if (targetRaw) {
            const metadata = await this.sock.groupMetadata(jid).catch(() => undefined);
            userJid = await resolvePnJid(this.sock, targetRaw, metadata);
        } else if (args[0]) {
            const rawNumber = args[0].replace(/\D/g, '');
            if (rawNumber.length < 10) {
                await this.replySafe(jid, '❌ Número inválido. Use o DDI + DDD + número. Ex: 5541995850310');
                return;
            }
            userJid = `${rawNumber}@s.whatsapp.net`;
        } else {
            await this.replySafe(jid, '❌ Marque a pessoa, responda a mensagem dela, ou use: $unban 5541995850310');
            return;
        }

        const number = userJid.split('@')[0];
        const priorBans = await this.banService.getUserBans(userJid);
        const count = await this.banService.unban(userJid);

        await this.reactSafe(jid, msg.key, '✅');

        if (count > 0) {
            await this.replySafe(jid, `✅ Usuário @${number} foi desbanido (${count} registro(s) removido(s)).`);

            await this.sendLog(
                `✅ Membro @${number} desbanido — ${count} registro(s) removido(s).`,
                [userJid],
            );

            // Reverte o efeito do ban de verdade — readiciona nos grupos de onde
            // ela foi removida. COMUNIDADE cobria todos os grupos da comunidade;
            // PERMANENTE/TEMPORARIO, só o grupo específico do registro.
            const communityGroupIds = await this.getCommunityGroupIds();
            const groupIdsToTry = new Set<string>();
            for (const ban of priorBans) {
                if (ban.banType === 'COMUNIDADE') {
                    communityGroupIds.forEach((gid) => groupIdsToTry.add(gid));
                } else {
                    groupIdsToTry.add(ban.groupJid);
                }
            }
            for (const groupJid of groupIdsToTry) {
                await this.tryReAddToGroup(userJid, groupJid, 'foi desbanido(a)');
            }
        } else {
            await this.replySafe(jid, `❌ Nenhum banimento encontrado para @${number}.`);
        }

        logger.info({ userJid, count }, 'User unbanned');
    }

    private async bansCommand(msg: any): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const bans = await this.banService.getBans();

        if (bans.length === 0) {
            await this.replySafe(jid, '📋 Nenhum usuário banido no momento.');
            return;
        }

        const lines = bans.map((b, i) => {
            const number = b.userJid.split('@')[0];
            const name = b.displayName ? ` (${b.displayName})` : '';
            const expires = b.expiresAt ? ` (expira: ${new Date(b.expiresAt).toLocaleString('pt-BR')})` : '';
            return `${i + 1}. ${number}${name} — ${b.banType}${expires}\n   Motivo: ${b.reason}`;
        });

        const text = `📋 *Usuários Banidos (${bans.length})*\n\n${lines.join('\n')}`;

        if (text.length > 4000) {
            const chunks: string[] = [];
            let current = `📋 *Usuários Banidos (${bans.length})*\n\n`;
            for (const line of lines) {
                if (current.length + line.length > 4000) {
                    chunks.push(current);
                    current = '';
                }
                current += line + '\n';
            }
            if (current) chunks.push(current);

            for (const chunk of chunks) {
                await this.replySafe(jid, chunk);
            }
        } else {
            await this.sendSafe(jid, { text, mentions: bans.map((b) => b.userJid) });
        }
    }

    /**
     * Apaga (delete for everyone) os comandos digitados pro bot e as respostas
     * dele nesse grupo. Requer o bot ser admin do grupo — o WhatsApp só permite
     * apagar mensagens de terceiros nessa condição.
     */
    private async clearCommand(msg: any): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const tracked = this.groupMessageLog.get(jid) ?? [];
        this.groupMessageLog.delete(jid);

        const seen = new Set<string>();
        const toDelete: WAMessageKey[] = [];
        for (const key of [...tracked, msg.key]) {
            if (!key?.id || seen.has(key.id)) continue;
            seen.add(key.id);
            toDelete.push(key);
        }

        let deleted = 0;
        for (const key of toDelete) {
            try {
                await this.sock.sendMessage(jid, { delete: key });
                deleted++;
            } catch (err) {
                logger.warn({ err, key }, '[clearCommand] failed to delete message');
            }
        }

        logger.info({ jid, deleted, attempted: toDelete.length }, 'Cleared bot-related messages from group');
    }

    private async baneditCommand(msg: any, args: string[]): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const metadata = await this.sock.groupMetadata(jid);
        const { jid: targetRaw } = this.getTargetJid(msg);

        if (!targetRaw || args.length < 2) {
            await this.replySafe(jid, '❌ Use: $banedit @user [tipo|tempo] [valor]\nOu responda a mensagem + $banedit tipo permanente\nEx: $banedit @user tipo permanente\nEx: $banedit @user tempo 7d');
            return;
        }

        const targetJid = await resolvePnJid(this.sock, targetRaw, metadata);
        const field = args[0]?.toLowerCase();
        const value = args.slice(1).join(' ');

        if (field === 'tipo') {
            const banType = this.resolveBanType(value.toLowerCase());
            const validTypes = ['PERMANENTE', 'TEMPORARIO', 'COMUNIDADE'];
            if (!validTypes.includes(banType)) {
                await this.replySafe(jid, '❌ Tipo inválido. Use: permanente, temporario, comunidade');
                return;
            }

            await this.banService.updateBanType(targetJid, jid, banType as any);
            await this.reactSafe(jid, msg.key, '✅');
            await this.replySafe(jid, `✅ Banimento de @${targetJid.split('@')[0]} alterado para *${this.resolveBanTypeLabel(banType)}*.`);

            await this.sendLog(
                `🔄 Banimento de @${targetJid.split('@')[0]} alterado para ${this.resolveBanTypeLabel(banType)}.`,
                [targetJid],
            );

        } else if (field === 'tempo') {
            const ms = parseDurationMs(value);
            if (ms === null) {
                await this.replySafe(jid, '❌ Formato inválido. Use: 7d (dias), 12h (horas), 30m (minutos)');
                return;
            }

            const expiresAt = new Date(Date.now() + ms);
            await this.banService.updateExpiresAt(targetJid, jid, expiresAt);

            await this.reactSafe(jid, msg.key, '✅');
            await this.replySafe(jid, `✅ Banimento de @${targetJid.split('@')[0]} atualizado — expira em ${value}.`);

            await this.sendLog(
                `🔄 Banimento de @${targetJid.split('@')[0]} — expira em ${value}.`,
                [targetJid],
            );
        } else {
            await this.replySafe(jid, '❌ Campo inválido. Use: tipo ou tempo.');
        }
    }

    /**
     * Advertência manual (a IA de moderação usa o mesmo WarningService.issue por
     * baixo, sem passar por esse comando). Ao bater 3 advertências no mês
     * corrente, aplica automaticamente um banimento temporário (7 dias) naquele
     * grupo — mesmo mecanismo do $ban, só que disparado pelo acúmulo.
     */
    private async advertirCommand(msg: any, args: string[]): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const metadata = await this.sock.groupMetadata(jid);
        const { jid: targetRaw, fromQuoted } = this.getTargetJid(msg);

        if (!targetRaw) {
            await this.replySafe(jid, '❌ Marque a pessoa ou responda a mensagem dela. Ex: $advertir @user flood no grupo');
            return;
        }

        const targetJid = await resolvePnJid(this.sock, targetRaw, metadata);
        const issuedBy = await resolvePnJid(this.sock, msg.key.participant! || msg.key.remoteJid!, metadata);

        // Se veio de menção, args[0] é o "@numero" literal no texto — pula pro motivo de verdade.
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const mentionOffset = (!fromQuoted && mentionedJid?.length) ? 1 : 0;
        const reason = args.slice(mentionOffset).join(' ') || 'Não informado';

        await this.warningService.issue(targetJid, jid, reason, issuedBy);
        const count = await this.warningService.countThisMonth(targetJid, jid);

        await this.reactSafe(jid, msg.key, '⚠️');
        await this.replySafe(jid, `⚠️ @${targetJid.split('@')[0]} advertido (${count}/3 esse mês).\nMotivo: ${reason}`);

        await this.sendLog(
            `⚠️ @${targetJid.split('@')[0]} recebeu advertência (${count}/3 esse mês) — Motivo: ${reason}`,
            [targetJid],
        );

        if (count >= 3) {
            await this.applyWarningPunishment(targetJid, jid, metadata);
        }
    }

    /** Aplica banimento temporário automático quando o limite de advertências do mês é atingido. */
    private async applyWarningPunishment(targetJid: string, groupJid: string, metadata: GroupMetadata): Promise<void> {
        const targetParticipant = findParticipant(metadata, targetJid);

        await this.banService.ban({
            userJid: targetJid,
            displayName: targetParticipant?.notify || targetParticipant?.name || undefined,
            groupJid,
            banType: 'TEMPORARIO' as any,
            reason: 'Acúmulo de 3 ou mais advertências no mês',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            bannedBy: 'sistema (advertências)',
        });

        if (targetParticipant) {
            await this.sock.groupParticipantsUpdate(groupJid, [targetParticipant.id], 'remove').catch(() => {});
        }

        const number = targetJid.split('@')[0];
        await this.replySafe(groupJid, `🚫 @${number} atingiu 3 advertências no mês e foi banido automaticamente (temporário, 7 dias).`);
        await this.sendLog(
            `🚫 @${number} banido automaticamente por acúmulo de advertências (3/mês) — temporário, 7 dias.`,
            [targetJid],
        );
    }
}
