import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export class MemberActivityService {
    async increment(userJid: string, groupJid: string): Promise<number> {
        const row = await prisma.memberActivity.upsert({
            where: { userJid_groupJid: { userJid, groupJid } },
            update: { messageCount: { increment: 1 } },
            create: { userJid, groupJid, messageCount: 1 },
        });
        return row.messageCount;
    }

    async getCount(userJid: string, groupJid: string): Promise<number> {
        const row = await prisma.memberActivity.findUnique({
            where: { userJid_groupJid: { userJid, groupJid } },
        });
        return row?.messageCount ?? 0;
    }
}
