// Precisa vir antes de qualquer outro import — a VM roda em UTC, mas toda data
// mostrada pro usuário (ex: "Expira: ...") e log do bot devem refletir o
// horário de Brasília, não o do servidor.
process.env.TZ = 'America/Sao_Paulo';

import pino from 'pino';
import * as qrcode from 'qrcode-terminal';
import * as dotenv from 'dotenv';
import {
    makeWASocket,
    fetchLatestBaileysVersion,
    DisconnectReason,
    useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { botConfig } from './infra/bot/config';
import { logger } from './infra/bot/utils/logger';
import { MessageHandler } from './infra/bot/handlers/messageHandler';

dotenv.config();

const MAX_RECONNECT_ATTEMPTS = 5;
const HOURLY_TICK_MS = 60 * 60 * 1000;
const BAN_EXPIRY_TICK_MS = 5 * 60 * 1000;
let reconnectAttempts = 0;
let hourlyTick: ReturnType<typeof setInterval> | undefined;
let banExpiryTick: ReturnType<typeof setInterval> | undefined;

async function startBot(): Promise<void> {
    const { state, saveCreds } = await useMultiFileAuthState(botConfig.sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        syncFullHistory: true,
        connectTimeoutMs: 60_000,
        defaultQueryTimeoutMs: 60_000,
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            reconnectAttempts = 0;
            logger.info('QR code received — scan with WhatsApp to log in.');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            reconnectAttempts = 0;
            logger.info(`Logged in as ${sock.user?.name || sock.user?.id}`);

            messageHandler.checkAndApplyGroupPhotos().catch((err) => {
                logger.warn({ err }, 'Falha na varredura inicial de fotos de grupo');
            });
            messageHandler.primeDescriptionCache().catch((err) => {
                logger.warn({ err }, 'Falha ao preencher cache inicial de descrições');
            });

            if (hourlyTick) clearInterval(hourlyTick);
            hourlyTick = setInterval(() => {
                messageHandler.checkAndApplyGroupPhotos().catch((err) => {
                    logger.warn({ err }, 'Falha na varredura horária de fotos de grupo');
                });
                messageHandler.runAiModerationCycle().catch((err) => {
                    logger.warn({ err }, 'Falha no ciclo horário de moderação por IA');
                });
            }, HOURLY_TICK_MS);

            if (banExpiryTick) clearInterval(banExpiryTick);
            banExpiryTick = setInterval(() => {
                messageHandler.reAddExpiredBans().catch((err) => {
                    logger.warn({ err }, 'Falha no ciclo de readição de banimentos expirados');
                });
            }, BAN_EXPIRY_TICK_MS);
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const noReconnect = [
                DisconnectReason.loggedOut,
                DisconnectReason.connectionReplaced,
            ].includes(statusCode);

            if (noReconnect) {
                if (statusCode === DisconnectReason.loggedOut) {
                    logger.warn('Logged out — delete auth folder and restart.');
                } else if (statusCode === DisconnectReason.connectionReplaced) {
                    logger.warn('Connection replaced — another instance is using this session.');
                }
                return;
            }

            reconnectAttempts++;
            if (reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
                logger.error(
                    { reconnectAttempts, statusCode },
                    'Max reconnection attempts reached. Stopping. Delete auth/ and restart.',
                );
                return;
            }

            logger.info(
                { statusCode, attempt: reconnectAttempts, max: MAX_RECONNECT_ATTEMPTS },
                'Connection closed, reconnecting...',
            );
            startBot();
        }
    });

    const messageHandler = new MessageHandler(sock);

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('messages.upsert', messageHandler.handleMessage.bind(messageHandler));
    sock.ev.on('group-participants.update', messageHandler.handleGroupParticipantsUpdate.bind(messageHandler));
    sock.ev.on('group.join-request', messageHandler.handleGroupJoinRequest.bind(messageHandler));
    sock.ev.on('groups.update', messageHandler.handleGroupsUpdate.bind(messageHandler));
    sock.ev.on('messages.reaction', messageHandler.handleReaction.bind(messageHandler));
}

startBot().catch((err) => {
    logger.error({ err }, 'Fatal error starting bot');
    process.exit(1);
});
