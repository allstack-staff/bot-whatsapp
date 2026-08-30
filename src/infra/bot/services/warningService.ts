import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const WARNINGS_TO_PUNISH = 3;

export class WarningService {
    async issue(userJid: string, groupJid: string, reason: string, issuedBy: string): Promise<void> {
        await prisma.warning.create({ data: { userJid, groupJid, reason, issuedBy } });
    }

    /** Advertências desse usuário nesse grupo, contadas dentro do mês corrente (reseta todo mês). */
    async countThisMonth(userJid: string, groupJid: string): Promise<number> {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        return prisma.warning.count({
            where: { userJid, groupJid, createdAt: { gte: startOfMonth } },
        });
    }

    async getWarnings(userJid: string, groupJid: string): Promise<any[]> {
        return prisma.warning.findMany({ where: { userJid, groupJid }, orderBy: { createdAt: 'desc' } });
    }

    /** true se essa advertência (já registrada) atingiu o limite do mês e deve gerar punição. */
    async shouldPunish(userJid: string, groupJid: string): Promise<boolean> {
        const count = await this.countThisMonth(userJid, groupJid);
        return count >= WARNINGS_TO_PUNISH;
    }
}
