import * as dotenv from 'dotenv';
dotenv.config();

export const botConfig = {
    sessionPath: process.env.SESSION_PATH || './auth',
    logLevel: process.env.LOG_LEVEL || 'info',
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
        },
    },
    features: {
        autoRead: false,
        typingIndicator: true,
    },
};

export type BotConfig = typeof botConfig;
