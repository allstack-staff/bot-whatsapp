import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export class GroupModerationMemoryService {
    async get(groupJid: string): Promise<string | null> {
        const row = await prisma.groupModerationMemory.findUnique({ where: { groupJid } });
        return row?.summary ?? null;
    }

    async set(groupJid: string, summary: string): Promise<void> {
        await prisma.groupModerationMemory.upsert({
            where: { groupJid },
            update: { summary },
            create: { groupJid, summary },
        });
    }
}
