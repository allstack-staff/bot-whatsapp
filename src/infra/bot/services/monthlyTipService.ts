import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const TIP_INTERVAL_DAYS = 30;

export class MonthlyTipService {
    async shouldSendTip(): Promise<boolean> {
        const state = await prisma.monthlyTipState.findUnique({ where: { id: 1 } });
        if (!state?.lastSentAt) return true;
        const daysSince = (Date.now() - state.lastSentAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince >= TIP_INTERVAL_DAYS;
    }

    async markSent(): Promise<void> {
        await prisma.monthlyTipState.upsert({
            where: { id: 1 },
            update: { lastSentAt: new Date() },
            create: { id: 1, lastSentAt: new Date() },
        });
    }
}
