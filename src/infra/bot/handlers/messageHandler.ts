import { WASocket } from '@whiskeysockets/baileys';
import { MessageUpsert } from '../types';
import { botConfig } from '../config';
import { BanService } from '../services/banService';
import { AdminService } from '../services/adminService';
import { logger } from '../utils/logger';

export class MessageHandler {
    private banService: BanService;
    private adminService: AdminService;

    constructor(private sock: WASocket) {
        this.banService = new BanService();
        this.adminService = new AdminService();
    }

    private commands: Record<string, (msg: any, args: string[]) => Promise<void>> = {
        home: (msg: any) => this.homeCommand(msg),
        ban: (msg: any, args: string[]) => this.banCommand(msg, args),
        unban: (msg: any, args: string[]) => this.unbanCommand(msg, args),
        bans: (msg: any) => this.bansCommand(msg),
        banedit: (msg: any, args: string[]) => this.baneditCommand(msg, args),
    };

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
                const text: string =
                    msgContent.conversation ||
                    msgContent.extendedTextMessage?.text ||
                    '';

                if (!text) continue;

                if (text.startsWith(botConfig.commands.prefix)) {
                    logger.debug({ text, jid: msg.key.remoteJid }, '[handleMessage] command detected');
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

        for (const participant of participants) {
            try {
                let participantJid: string;
                if (typeof participant === 'string') {
                    participantJid = participant;
                } else {
                    participantJid = participant.phoneNumber || participant.id;
                }

                logger.debug({ participantJid, groupId: id }, '[handleGroupParticipantsUpdate] checking ban for participant');

                const ban = await this.banService.getActiveBan(participantJid, id);
                logger.debug({ participantJid, found: !!ban }, '[handleGroupParticipantsUpdate] ban lookup result');
                if (!ban) continue;

                logger.info({ participantJid, groupId: id }, 'Removing banned user on re-entry');

                await this.sock.groupParticipantsUpdate(id, [participantJid], 'remove').catch((e: any) => {
                    logger.error({ err: e }, 'Failed to remove banned user on re-entry');
                    return;
                });

                const number = participantJid.split('@')[0];
                const banTypeLabel = this.resolveBanTypeLabel(ban.banType);
                const expires = ban.expiresAt
                    ? ` (expira: ${new Date(ban.expiresAt).toLocaleString('pt-BR')})`
                    : '';

                const msg = `🚫 @${number} removido — banimento ativo\nTipo: ${banTypeLabel}${expires}\nMotivo: ${ban.reason}`;
                await this.replySafe(id, msg);
                logger.info({ participantJid, groupId: id, reason: ban.reason }, 'Banned user removed on re-entry');

                await this.sendLog(
                    `🚫 @${number} tentou re-entrar e foi removido — ${banTypeLabel}${expires} — Motivo: ${ban.reason}`,
                    [participantJid],
                );
            } catch (err) {
                logger.warn({ err, participant }, '[handleGroupParticipantsUpdate] error checking participant');
            }
        }
    }

    private async handleCommand(msg: any, parts: string[]): Promise<void> {
        const command = parts[0].slice(botConfig.commands.prefix.length).toLowerCase();
        const args = parts.slice(1);

        const handler = this.commands[command];
        if (handler) {
            await handler(msg, args);
        }
    }

    private async isAuthorized(msg: any): Promise<boolean> {
        const jid = msg.key.remoteJid!;

        if (!jid.endsWith('@g.us')) {
            await this.replySafe(jid, '❌ Este comando só funciona em grupos.');
            return false;
        }

        let metadata: any;
        try {
            metadata = await this.sock.groupMetadata(jid);
        } catch {
            await this.replySafe(jid, '❌ Erro ao verificar permissões. Tente novamente.');
            return false;
        }

        const participantId = msg.key.participant! || msg.key.remoteJid;
        const normalize = (id: string) => id.split('@')[0].split(':')[0];
        const isGroupAdmin = metadata.participants.some(
            (p: any) => normalize(p.id) === normalize(participantId) && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        if (!isGroupAdmin) {
            await this.replySafe(jid, '❌ Você precisa ser admin do grupo para usar este comando.');
            return false;
        }

        return true;
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
        await this.sock.sendMessage(logJid, opts).catch((e: any) => {
            logger.error({ err: e }, 'Failed to send log message');
        });
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

    private async isGroupAdminJid(targetJid: string, groupJid: string): Promise<boolean> {
        try {
            const metadata = await this.sock.groupMetadata(groupJid);
            const normalize = (id: string) => id.split('@')[0].split(':')[0];
            return metadata.participants.some(
                (p: any) => normalize(p.id) === normalize(targetJid) && (p.admin === 'admin' || p.admin === 'superadmin')
            );
        } catch {
            return false;
        }
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

        let metadata: any;
        try {
            metadata = await this.sock.groupMetadata(jid);
        } catch (err) {
            logger.error({ err }, '[homeCommand] failed to fetch group metadata');
            await this.replySafe(jid, '❌ Erro ao buscar dados do grupo. Tente novamente.');
            return;
        }

        const participantId = msg.key.participant! || msg.key.remoteJid;
        const normalize = (id: string) => id.split('@')[0].split(':')[0];
        const isGroupAdmin = metadata.participants.some(
            (p: any) => normalize(p.id) === normalize(participantId) && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        if (!isGroupAdmin) {
            await this.replySafe(jid, '❌ Apenas admins do grupo podem registrar o grupo de admins.');
            return;
        }

        await this.adminService.registerGroup(jid);
        await this.replySafe(jid, `✅ Grupo registrado como admin/log.\nID: \`${jid}\``);
        logger.info({ groupJid: jid }, 'Admin group registered');
    }

    private async replySafe(jid: string, text: string): Promise<void> {
        await this.sendSafe(jid, { text });
    }

    private async reactSafe(jid: string, key: any, emoji: string): Promise<void> {
        await this.sendSafe(jid, { react: { text: emoji, key } });
    }

    private async sendSafe(jid: string, content: any): Promise<void> {
        const maxRetries = 5;
        for (let i = 0; i < maxRetries; i++) {
            try {
                await this.sock.sendMessage(jid, content);
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
        const { jid: targetJid, fromQuoted } = this.getTargetJid(msg);

        if (!targetJid) {
            await this.replySafe(jid, '❌ Marque o usuário ou responda a mensagem dele. Ex: $ban @user permanente motivo');
            return;
        }

        // Não permite banir admins
        const isTargetAdmin = await this.isGroupAdminJid(targetJid, jid);
        if (isTargetAdmin) {
            await this.replySafe(jid, '❌ Não é possível banir um admin do grupo.');
            return;
        }

        // Parse args: se veio de reply, args começa do tipo. Se veio de menção, args[0] é a menção
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const mentionOffset = (!fromQuoted && mentionedJid?.length) ? 1 : 0;

        const banTypeArg = args[mentionOffset]?.toLowerCase() || 'temporario';
        const reason = args.slice(mentionOffset + 1).join(' ') || 'Não informado';

        const banType = this.resolveBanType(banTypeArg);
        const bannedBy = msg.key.participant! || msg.key.remoteJid!;

        await this.banService.ban({
            userJid: targetJid,
            groupJid: jid,
            banType: banType as any,
            reason,
            expiresAt: banType === 'TEMPORARIO' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
            bannedBy,
        });

        await this.reactSafe(jid, msg.key, '✅');

        // Remoção
        if (banType === 'COMUNIDADE') {
            const allGroups = await this.sock.groupFetchAllParticipating();
            // Descobre a comunidade do grupo atual
            const currentMeta = allGroups[jid];
            const communityId = currentMeta?.linkedParent;
            if (communityId) {
                // Só remove de grupos que pertencem à MESMA comunidade
                for (const [gid, meta] of Object.entries(allGroups)) {
                    if (gid !== jid && (meta as any)?.linkedParent === communityId) {
                        await this.sock.groupParticipantsUpdate(gid, [targetJid], 'remove').catch(() => {});
                    }
                }
            }
            // Se o grupo atual não tiver linkedParent, não remove de nenhum outro
        }

        await this.sock.groupParticipantsUpdate(jid, [targetJid], 'remove').catch(() => {});

        // Resposta no grupo
        const escopoLabel = banType === 'COMUNIDADE' ? 'removido de todos os grupos' : 'removido do grupo';
        await this.replySafe(jid, `🚫 *Banido*\nUsuário: @${targetJid.split('@')[0]}\nTipo: ${this.resolveBanTypeLabel(banType)}\nMotivo: ${reason}`);

        // Log no grupo admin
        await this.sendLog(
            `🚫 Membro @${targetJid.split('@')[0]} banido — ${this.resolveBanTypeLabel(banType)} — ${banType === 'COMUNIDADE' ? 'removido de todos os grupos' : 'removido do grupo'} — Motivo: ${reason}`,
            [targetJid],
        );

        logger.info({ targetJid, groupJid: jid, banType, reason }, 'User banned');
    }

    private async unbanCommand(msg: any, args: string[]): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;

        if (!args.length) {
            await this.replySafe(jid, '❌ Use: $unban 5541995850310 (número do usuário sem @ nem +)');
            return;
        }

        const rawNumber = args[0].replace(/\D/g, '');
        if (rawNumber.length < 10) {
            await this.replySafe(jid, '❌ Número inválido. Use o DDI + DDD + número. Ex: 5541995850310');
            return;
        }

        const userJid = `${rawNumber}@s.whatsapp.net`;
        const count = await this.banService.unban(userJid);

        await this.reactSafe(jid, msg.key, '✅');

        if (count > 0) {
            await this.replySafe(jid, `✅ Usuário ${rawNumber} foi desbanido (${count} registro(s) removido(s)).`);

            await this.sendLog(
                `✅ Membro ${rawNumber} desbanido — ${count} registro(s) removido(s).`,
            );
        } else {
            await this.replySafe(jid, `❌ Nenhum banimento encontrado para ${rawNumber}.`);
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
            const expires = b.expiresAt ? ` (expira: ${new Date(b.expiresAt).toLocaleString('pt-BR')})` : '';
            return `${i + 1}. ${number} — ${b.banType}${expires}\n   Motivo: ${b.reason}`;
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

    private async baneditCommand(msg: any, args: string[]): Promise<void> {
        if (!(await this.isAuthorized(msg))) return;

        const jid = msg.key.remoteJid!;
        const { jid: targetJid } = this.getTargetJid(msg);

        if (!targetJid || args.length < 2) {
            await this.replySafe(jid, '❌ Use: $banedit @user [tipo|tempo] [valor]\nOu responda a mensagem + $banedit tipo permanente\nEx: $banedit @user tipo permanente\nEx: $banedit @user tempo 7d');
            return;
        }

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
            const match = value.match(/^(\d+)([dhms])$/);
            if (!match) {
                await this.replySafe(jid, '❌ Formato inválido. Use: 7d (dias), 12h (horas), 30m (minutos)');
                return;
            }

            const num = parseInt(match[1]);
            const unit = match[2];
            let ms = 0;
            switch (unit) {
                case 'd': ms = num * 86400000; break;
                case 'h': ms = num * 3600000; break;
                case 'm': ms = num * 60000; break;
                case 's': ms = num * 1000; break;
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
}