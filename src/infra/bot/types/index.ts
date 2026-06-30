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
}

export type BanType = 'PERMANENTE' | 'TEMPORARIO' | 'COMUNIDADE';
