import {
    makeWASocket,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { botConfig, createLogger } from './infra/bot/config';
import { MessageHandler } from './infra/bot/handlers/messageHandler';

async function startBot(): Promise<void> {
    const logger = createLogger();
    const { state, saveCreds } = await useMultiFileAuthState(botConfig.sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: logger.child({ level: 'silent' }),
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.info({ shouldReconnect }, 'Connection closed');
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            logger.info(`Logged in as ${sock.user?.name} ${sock.user?.id}`);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    const messageHandler = new MessageHandler(sock);

    sock.ev.on('messages.upsert', messageHandler.handleMessage.bind(messageHandler));
    sock.ev.on('group-participants.update', messageHandler.handleGroupParticipantUpdate.bind(messageHandler));
}

if (require.main === module) {
    startBot().catch((err) => {
        console.error('Error starting bot:', err);
    });
}
