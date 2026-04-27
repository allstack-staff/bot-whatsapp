import { WASocket } from '@whiskeysockets/baileys';

export interface ConnectionUpdate {
    connection?: 'open' | 'close' | 'connecting' | 'refresher';
    lastDisconnect?: {
        error?: Error;
    };
    qr?: string;
    isNewLogin?: boolean;
    receivedPendingNotifications?: boolean;
}

export interface MessageUpsert {
    messages: any[];
    type: 'notify' | 'append';
    requestId?: string;
}

export interface BotCommand {
    name: string;
    description: string;
    usage: string;
    handler: (sock: WASocket, msg: any, args: string[]) => Promise<void>;
}

export interface BotContext {
    sock: WASocket;
    msg: any;
    args: string[];
    command: string;
}
