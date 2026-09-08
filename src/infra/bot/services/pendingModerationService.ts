import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const RETENTION_MS = 24 * 60 * 60 * 1000;

/**
 * Fila de mensagens pendentes de moderação por IA, persistida no banco —
 * sobrevive a restart/deploy do bot (diferente do Map em memória de antes,
 * que perdia tudo a cada reinício, incluindo mensagens que nunca chegaram a
 * ser avaliadas). Sempre mantém só as últimas 24h: mais velho que isso é
 * tratado como se não existisse mais. Guarda também a WAMessageKey de cada
 * mensagem, pra poder apagá-la se ela virar um banimento.
 */
export class PendingModerationService {
    async add(groupJid: string, sender: string, text: string, messageKey?: unknown): Promise<void> {
        await prisma.pendingModerationMessage.create({
            data: {
                groupJid,
                sender,
                text,
                messageKeyJson: messageKey ? JSON.stringify(messageKey) : null,
            },
        });
    }

    async getBatchByGroup(onlyGroupJid?: string): Promise<Map<string, { sender: string; text: string; messageKey?: any }[]>> {
        const cutoff = new Date(Date.now() - RETENTION_MS);
        const rows = await prisma.pendingModerationMessage.findMany({
            where: {
                createdAt: { gte: cutoff },
                ...(onlyGroupJid ? { groupJid: onlyGroupJid } : {}),
            },
            orderBy: { createdAt: 'asc' },
        });

        const byGroup = new Map<string, { sender: string; text: string; messageKey?: any }[]>();
        for (const row of rows) {
            const arr = byGroup.get(row.groupJid) ?? [];
            let messageKey: any;
            if (row.messageKeyJson) {
                try { messageKey = JSON.parse(row.messageKeyJson); } catch { /* ignora, segue sem key */ }
            }
            arr.push({ sender: row.sender, text: row.text, messageKey });
            byGroup.set(row.groupJid, arr);
        }
        return byGroup;
    }

    async clearGroup(groupJid: string): Promise<void> {
        await prisma.pendingModerationMessage.deleteMany({ where: { groupJid } });
    }

    /** Apaga tudo com mais de 24h — chamado no ciclo horário, independente de moderação ter rodado. */
    async pruneOld(): Promise<void> {
        const cutoff = new Date(Date.now() - RETENTION_MS);
        await prisma.pendingModerationMessage.deleteMany({ where: { createdAt: { lt: cutoff } } });
    }
}
