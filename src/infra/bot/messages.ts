/**
 * Catálogo único de toda mensagem que o bot manda pro WhatsApp (resposta no
 * grupo, log no grupo de admins, DM, aviso de retentativa, log técnico de
 * debug). Existe pra ser auditável: quem quiser saber tudo que o bot é capaz
 * de dizer lê este arquivo, sem precisar vasculhar o handler inteiro.
 *
 * Cada entrada é uma função (ou string, quando não há variável nenhuma) que
 * devolve o texto exato — sem lógica de decisão (isso continua no handler,
 * que decide QUAL mensagem mandar e monta os parâmetros). Fragmentos
 * reutilizáveis só de formatação técnica (detalhe de erro, rótulo de tipo de
 * banimento) continuam como helper no handler — não são "mensagem", são
 * formatação de um valor que entra como parâmetro aqui.
 *
 * Migrado em lotes (extração pura — nenhuma frase foi reescrita no processo).
 * Seções seguem a mesma organização do messageHandler.ts.
 */

export const MESSAGES = {
    // ===== $asb ban =====
    banNoTarget: '❌ Marque o usuário ou responda a mensagem dele. Ex: $asb ban @user permanente motivo',
    banTargetIsAdmin: '❌ Não é possível banir um admin do grupo.',
    banTargetIsBot: '❌ Não é possível banir a própria conta do bot.',
    banConfirmPublic: (p: { number: string; typeLabel: string; expiresLabel: string; reason: string }) =>
        `🚫 *Banido*\nUsuário: @${p.number}\nTipo: ${p.typeLabel}${p.expiresLabel}\nMotivo: ${p.reason}`,
    banAdminActionDescription: (p: { number: string; typeLabel: string; groupName: string; reason: string }) =>
        `baniu @${p.number} (${p.typeLabel}) em *${p.groupName}* — motivo: ${p.reason}`,
    banAdminActionNotice: (p: { number: string; typeLabel: string; expiresLabel: string; escopoLabel: string; reason: string }) =>
        `🚫 Membro @${p.number} banido — ${p.typeLabel}${p.expiresLabel} — ${p.escopoLabel} — Motivo: ${p.reason}`,

    // Compartilhada entre $asb ban e $asb advertir — mesma trava, mesmo texto.
    pendingRatificationBlock: (p: { number: string }) =>
        `❌ @${p.number} tem uma decisão em votação de ratificação — vote nela (✅/❌ com motivo) em vez de tomar uma nova ação. Aguarde a votação concluir.`,

    // ===== $asb unban =====
    unbanInvalidNumber: '❌ Número inválido. Use o DDI + DDD + número. Ex: 5541995850310',
    unbanNoTarget: '❌ Marque a pessoa, responda a mensagem dela, ou use: $asb unban 5541995850310',
    unbanReasonRequired: '❌ Motivo obrigatório. Ex: $asb unban @user reavaliado, sem novas violações\n(admin de comunidade não precisa informar motivo)',
    unbanConfirmPublic: (p: { number: string; count: number; reasonLabel: string }) =>
        `✅ Usuário @${p.number} foi desbanido (${p.count} registro(s) removido(s)).${p.reasonLabel}`,
    unbanLog: (p: { number: string; count: number; reasonLabel: string }) =>
        `✅ Membro @${p.number} desbanido — ${p.count} registro(s) removido(s).${p.reasonLabel}`,
    unbanNotFound: (p: { number: string }) => `❌ Nenhum banimento encontrado para @${p.number}.`,

    // ===== $asb bans =====
    bansEmpty: '📋 Nenhum usuário banido no momento.',
    bansHeader: (p: { count: number }) => `📋 *Usuários Banidos (${p.count})*\n\n`,
    bansLine: (p: { index: number; number: string; nameSuffix: string; banType: string; expiresSuffix: string; reason: string }) =>
        `${p.index}. ${p.number}${p.nameSuffix} — ${p.banType}${p.expiresSuffix}\n   Motivo: ${p.reason}`,

    // ===== $asb banedit =====
    baneditUsage: '❌ Use: $asb banedit @user [tipo|tempo] [valor]\nOu responda a mensagem + $asb banedit tipo permanente\nEx: $asb banedit @user tipo permanente\nEx: $asb banedit @user tempo 7d',
    baneditInvalidType: '❌ Tipo inválido. Use: permanente, temporario, comunidade',
    baneditTypeChangedPublic: (p: { number: string; typeLabel: string }) =>
        `✅ Banimento de @${p.number} alterado para *${p.typeLabel}*.`,
    baneditTypeChangedLog: (p: { number: string; typeLabel: string }) =>
        `🔄 Banimento de @${p.number} alterado para ${p.typeLabel}.`,
    baneditInvalidDuration: '❌ Formato inválido. Use: 7d (dias), 12h (horas), 30m (minutos)',
    baneditDurationChangedPublic: (p: { number: string; value: string }) =>
        `✅ Banimento de @${p.number} atualizado — expira em ${p.value}.`,
    baneditDurationChangedLog: (p: { number: string; value: string }) =>
        `🔄 Banimento de @${p.number} — expira em ${p.value}.`,
    baneditInvalidField: '❌ Campo inválido. Use: tipo ou tempo.',

    // ===== $asb advertir =====
    advertirNoTarget: '❌ Marque a pessoa ou responda a mensagem dela. Ex: $asb advertir @user flood no grupo',
    advertirConfirmPublic: (p: { number: string; count: number; reason: string }) =>
        `⚠️ @${p.number} advertido (${p.count}/3 esse mês).\nMotivo: ${p.reason}`,
    advertirAdminActionDescription: (p: { number: string; groupName: string; reason: string }) =>
        `advertiu @${p.number} em *${p.groupName}* — motivo: ${p.reason}`,
    advertirAdminActionNotice: (p: { number: string; count: number; reason: string }) =>
        `⚠️ @${p.number} recebeu advertência (${p.count}/3 esse mês) — Motivo: ${p.reason}`,

    // ===== Punição automática por acúmulo de advertências (applyWarningPunishment) =====
    warningPunishmentTierNote: '\n⚠️ Essa é a 3ª vez (ou mais) que essa pessoa é punida por acúmulo de advertências nesse grupo — avaliem se deve virar banimento de comunidade (use $asb banedit @user tipo comunidade se decidirem).',
    warningPunishmentNotAdminAlert: (p: { number: string; groupName: string; durationLabel: string }) =>
        `@${p.number} atingiu 3 advertências no mês em *${p.groupName}* (banimento ${p.durationLabel} registrado), mas o bot não é admin desse grupo — não consegui remover. Promova o bot a admin, ou remova manualmente.`,
    warningPunishmentNotAdminHeadline: (p: { number: string; durationLabel: string; tierNote: string }) =>
        `🚫 @${p.number} banido automaticamente por acúmulo de advertências (3/mês) — ${p.durationLabel}, mas o bot não é admin do grupo e não conseguiu remover.${p.tierNote}`,
    warningPunishmentRemoveFailedRetry: (p: { number: string; durationLabel: string; errorDetail: string }) =>
        `⚠️ @${p.number} atingiu 3 advertências no mês (banimento ${p.durationLabel} aplicado) mas não foi possível removê-lo(a) do grupo automaticamente — motivo: ${p.errorDetail}.`,
    warningPunishmentRemoveRetrySuccess: (p: { number: string }) =>
        `✅ @${p.number} removido(a) do grupo com sucesso (retentativa).`,
    warningPunishmentRemoveRetryFailure: (p: { number: string; errorDetail: string }) =>
        `⚠️ @${p.number} segue no grupo apesar do banimento por advertências — motivo: ${p.errorDetail}.`,
    warningPunishmentConfirmPublic: (p: { number: string; durationLabel: string }) =>
        `🚫 @${p.number} atingiu 3 advertências no mês e foi banido automaticamente (${p.durationLabel}).`,
    warningPunishmentHeadline: (p: { number: string; durationLabel: string; tierNote: string }) =>
        `🚫 @${p.number} banido automaticamente por acúmulo de advertências (3/mês) — ${p.durationLabel}.${p.tierNote}`,

    // ===== Punição revisável (notifyRevertiblePunishment / revertAutomatedPunishment) =====
    revertiblePunishmentNotice: (p: { headline: string }) =>
        `${p.headline}\n\nReaja ❌ pra desfazer, ou responda esta mensagem com o motivo pra desfazer com justificativa.`,
    revertAutomatedPunishmentLog: (p: { number: string; admin: string; sourceLabel: string; reasonLabel: string }) =>
        `🔄 ${p.sourceLabel} identificou um comportamento e puniu @${p.number}, mas o admin @${p.admin} revisou e reverteu a medida.${p.reasonLabel}`,

    // ===== Banimento de comunidade por IA (executeAiCommunityBan) =====
    // Prefixo "[IA]" deixa explícito pra quem está no grupo que foi uma
    // decisão automatizada, não de um admin humano — mesma wording pro
    // resto de ações da IA que venham a ganhar aviso público no futuro.
    aiCommunityBanConfirmPublic: (p: { number: string; reason: string }) =>
        `[IA] @${p.number} foi removido(a).\n\nMotivo: ${p.reason}`,

    // ===== Varredura de banimento de comunidade (sweepCommunityBan) =====
    sweepBanRemoveFailedRetry: (p: { number: string; groupLabel: string; errorDetail: string }) =>
        `⚠️ @${p.number} está banido de comunidade mas não foi possível removê-lo(a) do grupo *${p.groupLabel}* automaticamente — motivo: ${p.errorDetail}.`,
    sweepBanRemoveRetrySuccess: (p: { number: string; groupLabel: string }) =>
        `✅ @${p.number} removido(a) do grupo *${p.groupLabel}* com sucesso.`,
    sweepBanRemoveRetryFailure: (p: { number: string; groupLabel: string; errorDetail: string }) =>
        `⚠️ Não foi possível remover @${p.number} do grupo *${p.groupLabel}* — motivo: ${p.errorDetail}.`,
    sweepBanNotAdminWithActionable: (p: { number: string; groupLabel: string; mentionList: string }) =>
        `@${p.number} está banido de comunidade e ainda está no grupo *${p.groupLabel}*, mas o bot não é admin lá — não consigo remover. ${p.mentionList}, remova manualmente.`,
    sweepBanNotAdminNoActionable: (p: { number: string; groupLabel: string }) =>
        `@${p.number} está banido de comunidade e ainda está no grupo *${p.groupLabel}*, mas o bot não é admin lá e nenhum admin desse grupo está no grupo de admins pra marcar — remova manualmente.`,
};
