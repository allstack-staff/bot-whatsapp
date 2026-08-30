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
        list: {
            home: {
                description: 'Registra este grupo como grupo de admins',
                usage: '$home',
            },
            ban: {
                description: 'Bane um membro: $ban @user [tipo] [motivo]',
                usage: '$ban @user [permanente|temporario|comunidade] [motivo]',
            },
            unban: {
                description: 'Remove o banimento de um membro',
                usage: '$unban @user',
            },
            bans: {
                description: 'Lista todos os membros banidos',
                usage: '$bans',
            },
            banedit: {
                description: 'Altera tipo/tempo de um banimento',
                usage: '$banedit @user [tipo|tempo] [valor]',
            },
            clear: {
                description: 'Apaga os comandos digitados pro bot e as respostas dele neste grupo',
                usage: '$clear',
            },
            status: {
                description: 'Mostra número conectado, grupos de admin e contagem de banimentos',
                usage: '$status',
            },
            ajuda: {
                description: 'Mostra os comandos principais e o link da documentação completa',
                usage: '$ajuda',
            },
            advertir: {
                description: 'Dá uma advertência; 3 no mês geram banimento temporário automático',
                usage: '$advertir @user [motivo]',
            },
            regras: {
                description: 'Aplica o link das regras da comunidade na descrição de todos os grupos',
                usage: '$regras',
            },
            grupos: {
                description: 'Lista os grupos da comunidade com um ID curto pra referenciar em outros comandos',
                usage: '$grupos',
            },
            assumir: {
                description: 'Vira admin de um grupo (atual, ou por ID — veja $grupos) se já estiver no grupo de admins',
                usage: '$assumir [id]',
            },
            responsavel: {
                description: 'Marca um admin como responsável por um grupo (atual, ou por ID — veja $grupos)',
                usage: '$responsavel [id] @admin',
            },
            promover: {
                description: 'Promove alguém a admin, marca como responsável e anuncia',
                usage: '$promover @user',
            },
        },
    },
    features: {
        autoRead: false,
        typingIndicator: true,
    },
};

export type BotConfig = typeof botConfig;
