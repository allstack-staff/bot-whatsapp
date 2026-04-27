import {
    makeWASocket,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
    proto
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import { botConfig, createLogger } from './commands/commandsList';
import { MessageHandler } from './commands/messageHandler';

const logger = createLogger();
const silentLogger = logger.child({ level: 'silent' });
const msgCache = new Map<string, proto.IMessage>();

async function startBot(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(botConfig.sessionPath);
    state.keys = makeCacheableSignalKeyStore(state.keys, silentLogger);

    const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => {
        logger.warn('Failed to fetch latest Baileys version, using fallback');
        return { version: [2, 3000, 1015901307] as [number, number, number], isLatest: false };
    });

    logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: silentLogger,
        auth: state,
        defaultQueryTimeoutMs: undefined,
        connectTimeoutMs: 60_000,
        syncFullHistory: false,
        fireInitQueries: false,
        getMessage: async (key) => msgCache.get(`${key.remoteJid}_${key.id}`) ?? { conversation: '' },
    });

    sock.ev.on('messages.upsert', ({ messages }) => {
        for (const msg of messages) {
            if (msg.message) msgCache.set(`${msg.key.remoteJid}_${msg.key.id}`, msg.message);
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;

            if (statusCode === DisconnectReason.loggedOut) {
                logger.warn('Logged out — delete authdata and scan QR again.');
                return;
            }

            const cleanup = () => {
                sock.ev.removeAllListeners('messages.upsert');
                sock.ev.removeAllListeners('connection.update');
                sock.ev.removeAllListeners('creds.update');
                sock.ev.removeAllListeners('group-participants.update');
            };

            if (statusCode === DisconnectReason.connectionReplaced) {
                // Aguarda 10s para o servidor liberar a sessão anterior antes de reconectar.
                // Se outro processo do bot estiver rodando, verifique e encerre-o.
                logger.warn('Session replaced — retrying in 10s. Check for duplicate bot processes.');
                cleanup();
                setTimeout(startBot, 10_000);
                return;
            }

            logger.info({ statusCode }, 'Connection closed, reconnecting...');
            cleanup();
            startBot();
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
