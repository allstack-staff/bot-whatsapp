import * as dotenv from 'dotenv';
dotenv.config();

export const botConfig = {
    sessionPath: process.env.SESSION_PATH || './auth',
    logLevel: process.env.LOG_LEVEL || 'info',
    // TODO: trocar pelo link do GitBook assim que estiver publicado e conectado ao repo.
    docsUrl: process.env.DOCS_URL || 'https://github.com/allstack-staff/bot-whatsapp/tree/main/docs',
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
        },
    },
    features: {
        autoRead: false,
        typingIndicator: true,
    },
};

export type BotConfig = typeof botConfig;
