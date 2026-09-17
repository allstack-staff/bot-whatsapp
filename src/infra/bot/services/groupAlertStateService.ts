import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

/**
 * Cooldown persistido pra alertas recorrentes por grupo (ex: "grupo sem
 * admin responsável") — persistido, não em memória, porque deploy reinicia
 * o processo com frequência e um cooldown em memória zeraria toda vez.
 */
export class GroupAlertStateService {
    /** true se já pode mandar de novo (nunca mandou, ou o cooldown já passou). */
    async shouldSend(groupJid: string, alertType: string, cooldownMs: number): Promise<boolean> {
        const state = await prisma.groupAlertState.findUnique({
            where: { groupJid_alertType: { groupJid, alertType } },
        });
        if (!state) return true;
        return Date.now() - state.lastSentAt.getTime() >= cooldownMs;
    }

    async markSent(groupJid: string, alertType: string): Promise<void> {
        await prisma.groupAlertState.upsert({
            where: { groupJid_alertType: { groupJid, alertType } },
            update: { lastSentAt: new Date() },
            create: { groupJid, alertType, lastSentAt: new Date() },
        });
    }

    /** null = nunca mandado — usado pra escolher quem avisar primeiro num rodízio justo entre vários pendentes. */
    async getLastSentAt(groupJid: string, alertType: string): Promise<Date | null> {
        const state = await prisma.groupAlertState.findUnique({
            where: { groupJid_alertType: { groupJid, alertType } },
        });
        return state?.lastSentAt ?? null;
    }
}
