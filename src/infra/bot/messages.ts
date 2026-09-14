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
    // ===== Dica pra membros (checkMemberTip) =====
    memberTip: (p: { tip: string; rulesUrl: string }) =>
        `💡 *Dica*\n\n${p.tip}\n\nRegras completas: ${p.rulesUrl}`,

    // ===== Compartilhada entre vários comandos que aceitam ID curto de grupo =====
    groupIdNotFound: (p: { id: number }) => `❌ Nenhum grupo com o ID ${p.id}. Use $asb grupos pra ver a lista.`,

    // ===== $asb assumir =====
    assumirOnlyInGroup: '❌ Este comando só funciona em grupos.',
    assumirNotInAdminGroup: '❌ Você precisa estar no grupo de administração para usar este comando.',
    assumirNotCommunityGroup: '❌ Esse grupo não é da All Stack Community.',
    assumirMetadataError: '❌ Erro ao buscar dados do grupo. Tente novamente.',
    assumirNotMember: (p: { groupName: string }) =>
        `❌ Você não é membro do grupo *${p.groupName}* — entre nele antes de usar $asb assumir.`,
    assumirAlreadyAdmin: (p: { groupName: string }) => `⚠️ Você já é admin do grupo *${p.groupName}*.`,
    assumirPromoteFailedPublic: (p: { groupLabel: string; reason: string }) =>
        `⚠️ Não foi possível te tornar admin do grupo *${p.groupLabel}* automaticamente — motivo: ${p.reason}. Confira se o bot ainda é admin lá.`,
    assumirPromoteFailedRetry: (p: { number: string; groupLabel: string; reason: string }) =>
        `⚠️ @${p.number} tentou virar admin do grupo *${p.groupLabel}* via $asb assumir, mas a promoção falhou — motivo: ${p.reason}.`,
    assumirPromoteRetrySuccess: (p: { number: string; groupLabel: string }) =>
        `✅ @${p.number} promovido(a) a admin do grupo *${p.groupLabel}* com sucesso (retentativa).`,
    assumirPromoteRetryFailure: (p: { number: string; groupLabel: string; errorDetail: string }) =>
        `⚠️ @${p.number} ainda não conseguiu virar admin do grupo *${p.groupLabel}* via $asb assumir — motivo: ${p.errorDetail}.`,
    assumirConfirmPublic: (p: { groupName: string }) => `✅ Você agora é admin do grupo *${p.groupName}*.`,
    assumirLog: (p: { number: string; groupName: string }) =>
        `👑 @${p.number} virou admin do grupo *${p.groupName}* via $asb assumir.`,

    // ===== $asb responsavel =====
    responsavelNoTarget: '❌ Marque a pessoa (ou várias) ou responda a mensagem dela. Ex: $asb responsavel @admin1 @admin2 (ou $asb responsavel <id1> <id2> @admin a partir do grupo de admins — veja $asb grupos)',
    responsavelNoValidTarget: '❌ Nenhuma pessoa válida marcada.',
    responsavelMetadataError: (p: { groupJid: string }) => `❌ Não foi possível buscar os dados do grupo ${p.groupJid}.`,
    responsavelSkippedNote: (p: { skippedList: string }) => ` (ignorado(s) por não ser admin do grupo: ${p.skippedList})`,
    responsavelGroupSummaryAssigned: (p: { groupName: string; assignedList: string; plural: boolean; skippedNote: string }) =>
        `*${p.groupName}*: ${p.assignedList} ${p.plural ? 'agora são responsáveis' : 'agora é responsável'}.${p.skippedNote}`,
    responsavelGroupSummaryNoAdmin: (p: { groupName: string }) =>
        `*${p.groupName}*: ninguém marcado é admin desse grupo — nenhuma alteração.`,
    responsavelFailure: (p: { summaries: string }) => `❌ ${p.summaries}`,
    responsavelSuccess: (p: { summaryText: string }) => `✅ ${p.summaryText}`,
    responsavelLog: (p: { summaryText: string }) => `👤 Responsável(is) atualizado(s):\n${p.summaryText}`,

    // ===== $asb revogar =====
    revogarNoAdminGroup: '❌ Nenhum grupo de admins registrado. Use $asb home no grupo de admins primeiro.',
    revogarNoTarget: '❌ Marque a pessoa ou responda a mensagem dela. Ex: $asb revogar @admin motivo',
    revogarTargetIsBot: '❌ Não dá pra revogar o próprio bot.',
    revogarTargetNotAdmin: '❌ Essa pessoa não é admin de comunidade — nada pra revogar.',
    revogarAlreadyPending: '❌ Já existe uma votação de remoção em andamento pra essa pessoa.',
    revogarVoteText: (p: { number: string; requestedByNumber: string; reason: string }) => [
        `🗳️ *Proposta de remoção de admin* — @${p.number}`,
        `Por: @${p.requestedByNumber}`,
        `Motivo: ${p.reason}`,
        '',
        'Se aprovada pela maioria dos admins de comunidade, a pessoa sai do grupo de admins e perde o cargo de admin em todos os grupos da comunidade.',
        'Reaja ✅ (remover) ou ❌ (manter) — ou responda "sim"/"não".',
    ].join('\n'),
    revogarVoteFailed: '❌ Não foi possível abrir a votação. Tente novamente.',
    revogarVoteOpenedElsewhere: (p: { number: string }) => `🗳️ Votação de remoção aberta no grupo de admins pra @${p.number}.`,
    adminRemovalRejected: (p: { number: string }) =>
        `✅ Remoção de @${p.number} rejeitada pela maioria — cargo de admin mantido.`,
    adminRemovalNoOtherGroups: 'nenhum outro grupo (já não era admin em mais nenhum além do de admins)',
    adminRemovalExecutedLog: (p: { number: string; demotedList: string }) =>
        `✅ @${p.number} removido(a) do grupo de admins e rebaixado(a) em: ${p.demotedList}.`,

    // ===== $asb promover =====
    promoverNoTarget: '❌ Marque a pessoa ou responda a mensagem dela. Ex: $asb promover @user',
    promoverNotInGroup: '❌ Essa pessoa não está nesse grupo.',
    promoverAnnouncement: (p: { number: string; groupName: string }) =>
        `🎉 @${p.number} foi promovido(a) a admin — agora é responsável pelo grupo *${p.groupName}*.`,

    // ===== $asb propor =====
    proporWrongGroup: '❌ Esse comando só pode ser usado no grupo de administração.',
    proporNotConfigured: '❌ Redação de regras por IA não está configurada (falta GEMINI_API_KEY no servidor).',
    proporNoIdea: (p: { usage: string }) =>
        `❌ Descreva a ideia da regra. Uso: ${p.usage}\nEx: $asb propor proibir gente pedindo doação de dinheiro nos grupos`,
    proporDraftFailed: '❌ Não foi possível redigir a proposta agora. Tente de novo em instantes.',
    proporInsufficientDetail: (p: { feedback: string; usage: string }) =>
        `❌ ${p.feedback}\nDetalhe melhor e tente de novo. Uso: ${p.usage}`,
    proporConflictNote: (p: { conflictNote: string }) => `\n⚠️ Possível conflito: ${p.conflictNote}`,
    proporPublishNotConfigured: '❌ Publicação automática não está configurada (falta GITHUB_RULES_TOKEN) — decisão monocrática exige publicar na hora, então não dá pra seguir sem isso. Publique manualmente ou peça pra configurar o token.',
    proporPublishFailed: (p: { errorDetail: string }) => `❌ Não foi possível publicar agora — motivo: ${p.errorDetail}.`,
    proporLiveVoteOpen: (p: { ruleNumber: number; number: string; draftedText: string; punishmentLabel: string; conflictBlock: string }) =>
        `📋 *Regra ${p.ruleNumber} publicada* — decisão monocrática de @${p.number}, já em vigor.\n\n"${p.draftedText}"\nPunição: *${p.punishmentLabel}*${p.conflictBlock}\n\nOutros admins de comunidade: reaja ✅ manter, ❌ reverter, 🔧 ajustar (ou responda "manter"/"reverter"/"ajustar"). Admin comum também pode votar, mas quem decide é a turma de admin de comunidade.`,
    proporLiveVoteOpenFailed: '❌ Regra publicada, mas não foi possível abrir a votação de ratificação — abra manualmente uma discussão sobre ela no grupo de admins.',
    proporPendingVoteOpen: (p: { number: string; draftedText: string; punishmentLabel: string; conflictBlock: string }) =>
        `📋 *Proposta de nova regra* (sugerida por @${p.number}, redigida por IA)\n\n"${p.draftedText}"\nPunição: *${p.punishmentLabel}*${p.conflictBlock}\n\nReaja ✅/❌ ou responda "sim"/"não" pra aprovar/rejeitar. Só votos de admins de comunidade contam.`,
    proporPendingVoteOpenNoPublishWarning: (p: { baseText: string }) =>
        `${p.baseText}\n\n⚠️ Aviso: publicação automática não está configurada ainda (falta GITHUB_RULES_TOKEN) — mesmo aprovada, alguém vai precisar publicar manualmente.`,
    proporPendingVoteFailed: '❌ Não foi possível postar a proposta pra votação.',

    // ===== Votação de proposta de regra — admin comum (tallyRuleProposalVote) =====
    ruleProposalApprovedPublished: (p: { draftedText: string }) =>
        `✅ Regra aprovada pela maioria e publicada em docs/regras.md: "${p.draftedText}".`,
    ruleProposalPublishFailed: (p: { draftedText: string; punishment: string; errorDetail: string }) =>
        `⚠️ Regra aprovada mas não foi possível publicar automaticamente — motivo: ${p.errorDetail}. Publique manualmente: "${p.draftedText}" (${p.punishment}).`,
    ruleProposalRejected: (p: { draftedText: string }) =>
        `❌ Proposta de regra rejeitada pela maioria: "${p.draftedText}".`,

    // ===== Mudança de descrição (handleGroupsUpdate / openDescriptionVote / tallyDescriptionVote) =====
    descLockRevertFailedRetry: (p: { groupLabel: string; lockedUntil: string; errorDetail: string }) =>
        `⚠️ Grupo *${p.groupLabel}* está travado (rejeitado anteriormente) e a descrição foi alterada de novo, mas não foi possível reverter automaticamente — motivo: ${p.errorDetail}. Trava até ${p.lockedUntil}.`,
    descLockRevertRetrySuccess: (p: { groupLabel: string }) =>
        `✅ Descrição do grupo *${p.groupLabel}* revertida com sucesso (retentativa).`,
    descLockRevertRetryFailure: (p: { groupLabel: string; errorDetail: string }) =>
        `⚠️ Grupo *${p.groupLabel}* segue travado sem conseguir reverter a descrição — motivo: ${p.errorDetail}.`,
    descLockRevertedLog: (p: { groupLabel: string; lockedUntil: string }) =>
        `🔒 Grupo *${p.groupLabel}* está com a descrição travada (rejeitada anteriormente) — mudança revertida automaticamente. Trava até ${p.lockedUntil}.`,
    descriptionVoteText: (p: { groupName: string; proposedByLine: string; oldDescription: string; newDescription: string }) => [
        `📝 *Mudança de descrição detectada* — ${p.groupName}`,
        p.proposedByLine,
        '',
        '*Antes:*',
        p.oldDescription,
        '',
        '*Depois:*',
        p.newDescription,
        '',
        'Reaja ✅/❌ ou responda "sim"/"não". Se a maioria rejeitar, a versão antiga volta e o grupo fica travado por 7 dias.',
    ].filter(Boolean).join('\n'),
    descriptionApproved: '✅ Mudança de descrição aprovada pela maioria — mantida.',
    descriptionRejected: '❌ Mudança de descrição rejeitada pela maioria — restaurada a versão anterior. Grupo travado por 7 dias.',

    // ===== Pipeline de AdminAction (recordAdminAction / revisão / ratificação) =====
    adminActionNotice: (p: { noticeText: string }) =>
        `${p.noticeText}\n\nAdmin de comunidade: responda esta mensagem com o motivo (embasado nas regras) pra reverter.`,
    joinRejectRevertedDm: (p: { inviteLink: string }) =>
        `Sua entrada no grupo foi reavaliada e aceita.${p.inviteLink}`,
    adminActionRevertNotGrounded: (p: { feedback: string }) =>
        `❌ Reversão não aplicada — motivo não embasado nas regras.\n${p.feedback}`,
    adminActionRevertNotGroundedLog: (p: { number: string }) =>
        `🧭 Tentativa de reversão de @${p.number} não embasada nas regras — feedback enviado no privado.`,
    adminActionRevertedLog: (p: { number: string; description: string; groundingNote: string; reasonText: string }) =>
        `🔄 @${p.number} (admin de comunidade) reverteu: "${p.description}"${p.groundingNote}.\nMotivo: ${p.reasonText}`,
    adminActionRatificationOpen: (p: { number: string; description: string }) =>
        `⚖️ Decisão monocrática de @${p.number}, já em vigor: reverteu "${p.description}".\nOutros admins de comunidade: reaja ✅/❌ ou responda "sim"/"não" pra ratificar/derrubar.`,
    adminActionRatified: (p: { description: string }) =>
        `✅ Decisão ratificada pela maioria dos admins de comunidade: "${p.description}".`,
    adminActionOverturned: (p: { description: string }) =>
        `❌ Decisão derrubada pela maioria dos admins de comunidade — "${p.description}" volta a valer.`,

    // ===== Ratificação de regra publicada ($asb propor, admin de comunidade) =====
    ruleRatified: (p: { ruleNumber: number; draftedText: string }) =>
        `✅ Regra ${p.ruleNumber} ratificada pela maioria dos admins de comunidade — mantida: "${p.draftedText}".`,
    ruleReverted: (p: { ruleNumber: number; draftedText: string }) =>
        `❌ Regra ${p.ruleNumber} derrubada pela maioria dos admins de comunidade e removida de docs/regras.md: "${p.draftedText}".`,
    ruleRevertFailed: (p: { ruleNumber: number; draftedText: string; errorDetail: string }) =>
        `⚠️ Regra ${p.ruleNumber} derrubada pela maioria mas não foi possível remover automaticamente — motivo: ${p.errorDetail}. Remova manualmente de docs/regras.md: "${p.draftedText}".`,
    ruleNeedsAdjustment: (p: { ruleNumber: number }) =>
        `🔧 Regra ${p.ruleNumber} precisa de ajuste, segundo a maioria dos admins de comunidade — ela continua em vigor por ora. Proponha o ajuste com $asb propor.`,

    // ===== Moderação por IA (executeAiCommunityBan / runAiModerationCycle) =====
    aiNotAdminAlert: (p: { number: string; groupName: string; reason: string }) =>
        `IA identificou uma possível violação de @${p.number} em *${p.groupName}*, mas o bot não é admin desse grupo — não consigo agir. Promova o bot a admin, ou aja manualmente.\nMotivo: ${p.reason}`,
    aiTargetIsAdminLog: (p: { number: string; groupName: string; reason: string }) =>
        `🤖⚠️ *Possível violação — admin*\nUsuário: @${p.number}\nGrupo: *${p.groupName}*\nMotivo: ${p.reason}\nNão executado — decisão manual.`,
    aiPendingRatificationLog: (p: { number: string; reason: string }) =>
        `🤖⚠️ IA identificou uma possível violação de @${p.number}, mas há uma decisão em votação de ratificação sobre a mesma pessoa — não executado até a votação concluir.\nMotivo: ${p.reason}`,
    aiBanRemoveFailedRetry: (p: { number: string; groupLabel: string; errorDetail: string }) =>
        `⚠️ IA baniu @${p.number} mas não foi possível removê-lo(a) do grupo *${p.groupLabel}* automaticamente — motivo: ${p.errorDetail}.`,
    aiBanRemoveRetrySuccess: (p: { number: string; groupLabel: string }) =>
        `✅ @${p.number} removido(a) do grupo *${p.groupLabel}* com sucesso.`,
    aiViolationGraveHeadline: (p: { number: string; groupName: string; reason: string }) =>
        `🤖🚫 Uma violação grave de @${p.number} foi identificada em *${p.groupName}* — banido de toda a comunidade.\nMotivo: ${p.reason}`,
    aiModerationCycleFailed: (p: { errorDetail: string }) =>
        `⚠️ Não foi possível concluir o ciclo de moderação por IA — motivo: ${p.errorDetail}. As mensagens continuam na fila pro próximo ciclo.`,
    aiModerationCycleFailedDebug: (p: { detail: string }) =>
        `[runAiModerationCycle] evaluateBatch falhou:\n${p.detail}`,
    aiRemovedPublicationNote: ' (publicação removida)',
    aiRemovedPublicationNoteNotAdmin: ' (bot não é admin desse grupo — publicação não removida)',
    aiWarningIssuedLog: (p: { number: string; groupName: string; removedNote: string; count: number; reason: string }) =>
        `🤖⚠️ Uma advertência foi aplicada a @${p.number} em *${p.groupName}*${p.removedNote} (${p.count}/3 esse mês).\nMotivo: ${p.reason}`,
    aiModerationGroupFailed: (p: { groupJid: string; errorDetail: string }) =>
        `⚠️ Não foi possível concluir a moderação por IA no grupo *${p.groupJid}* — motivo: ${p.errorDetail}.`,
    aiModerationGroupFailedDebug: (p: { groupJid: string; detail: string }) =>
        `[runAiModerationCycle] falha processando grupo ${p.groupJid}:\n${p.detail}`,

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
