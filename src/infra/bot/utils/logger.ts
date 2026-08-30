import pino from 'pino';
import { botConfig } from '../config';

export const logger = pino({
    level: botConfig.logLevel,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss o',
            ignore: 'pid,hostname',
        },
    },
});
