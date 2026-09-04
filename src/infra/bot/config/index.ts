import * as dotenv from 'dotenv';
dotenv.config();

export const botConfig = {
    sessionPath: process.env.SESSION_PATH || './auth',
    logLevel: process.env.LOG_LEVEL || 'info',
    docsUrl: process.env.DOCS_URL || 'https://allstack-staff.github.io/bot-whatsapp/',
    // JID da WhatsApp Community "All Stack Community" — o número do bot participa de
    // dezenas de outros grupos/communities sem relação nenhuma com a All Stack, e toda
    // ação em massa ou automática do bot deve ficar restrita a grupos vinculados aqui
    // (meta.linkedParent === communityJid). Descoberto uma vez via debugLogCommunityMetadata.
    communityJid: process.env.COMMUNITY_JID,
    commands: {
        prefix: process.env.BOT_PREFIX || '$',
        // Comando "pai" — todo comando é invocado como "$asb <comando> [args]",
        // nunca "$<comando>" direto. Ex: $asb ban @user permanente motivo.
        parent: process.env.BOT_PARENT_COMMAND || 'asb',
        list: {
            home: {
                description: 'Registra este grupo como grupo de admins',
                usage: '$asb home',
            },
            ban: {
                description: 'Bane um membro: $asb ban @user [tipo] [motivo]',
                usage: '$asb ban @user [permanente|temporario|comunidade] [motivo]',
            },
            unban: {
                description: 'Remove o banimento de um membro',
                usage: '$asb unban @user',
            },
            bans: {
                description: 'Lista todos os membros banidos',
                usage: '$asb bans',
            },
            banedit: {
                description: 'Altera tipo/tempo de um banimento',
                usage: '$asb banedit @user [tipo|tempo] [valor]',
            },
            clear: {
                description: 'Apaga os comandos digitados pro bot e as respostas dele neste grupo',
                usage: '$asb clear',
            },
            status: {
                description: 'Mostra número conectado, grupos de admin e contagem de banimentos',
                usage: '$asb status',
            },
            ajuda: {
                description: 'Mostra os comandos principais e o link da documentação completa',
                usage: '$asb ajuda',
            },
            advertir: {
                description: 'Dá uma advertência; 3 no mês geram banimento temporário automático',
                usage: '$asb advertir @user [motivo]',
            },
            regras: {
                description: 'Aplica o link das regras da comunidade na descrição de todos os grupos',
                usage: '$asb regras',
            },
            grupos: {
                description: 'Lista os grupos da comunidade com um ID curto pra referenciar em outros comandos',
                usage: '$asb grupos',
            },
            assumir: {
                description: 'Vira admin de um grupo (atual, ou por ID — veja $asb grupos) se já estiver no grupo de admins',
                usage: '$asb assumir [id]',
            },
            responsavel: {
                description: 'Marca um admin como responsável por um grupo (atual, ou por ID — veja $asb grupos)',
                usage: '$asb responsavel [id] @admin',
            },
            promover: {
                description: 'Promove alguém a admin, marca como responsável e anuncia',
                usage: '$asb promover @user',
            },
            moderar: {
                description: 'Roda a moderação por IA na hora e reagenda o próximo ciclo automático pra 1h a partir daí',
                usage: '$asb moderar',
            },
            anunciar: {
                description: 'Publica um anúncio (com formatação livre) num grupo da comunidade, marcando todo mundo de forma invisível',
                usage: '$asb anunciar <id> <mensagem>',
            },
        },
    },
    features: {
        autoRead: false,
        typingIndicator: true,
    },
};

export type BotConfig = typeof botConfig;
