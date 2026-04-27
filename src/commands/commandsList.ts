import pino from 'pino';

export const botConfig = {
    sessionPath: './authdata',
    logLevel: 'info',
    commands: {
        prefix: '$asb',
        list: {
            makeadmin: {
                description: 'Promove o usuário mencionado a administrador',
                usage: '$asb makeadmin'
            },
            '-ma': {
                description: 'Alias para makeadmin',
                usage: '$asb -ma'
            },
            mention: {
                description: 'Menciona um usuário pelo número',
                usage: '$asb mention [número]'
            },
            '-me': {
                description: 'Alias para mention',
                usage: '$asb -me [número]'
            },
            gpt: {
                description: 'Envia uma mensagem para o ChatGPT',
                usage: '$asb gpt [mensagem]'
            },
            bc: {
                description: 'Envia uma mensagem para o BlackClown AI',
                usage: '$asb bc [mensagem]'
            },
            img: {
                description: 'Gera uma imagem com DALL-E',
                usage: '$asb img [descrição]'
            },
            regras: {
                description: 'Envia as regras do grupo',
                usage: '$asb regras'
            },
            ban: {
                description: 'Bane um usuário mencionado do grupo',
                usage: '$asb ban @usuário [motivo]'
            },
            unban: {
                description: 'Remove um usuário da blacklist',
                usage: '$asb unban [número]'
            },
            doc: {
                description: 'Envia um documento',
                usage: '$asb doc'
            },
            addgroup: {
                description: 'Adiciona o grupo atual à whitelist do bot',
                usage: '$asb addgroup'
            },
            removegroup: {
                description: 'Remove o grupo atual da whitelist do bot',
                usage: '$asb removegroup'
            }
        }
    },
    features: {
        autoRead: false,
        typingIndicator: false,
        presenceUpdates: false
    }
};

export type BotConfig = typeof botConfig;

export const createLogger = () => pino({
    level: botConfig.logLevel,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname'
        }
    }
});
