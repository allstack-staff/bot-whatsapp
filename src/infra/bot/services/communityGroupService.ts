import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export interface CommunityGroupEntry {
    shortId: number;
    groupJid: string;
    subject: string | null;
}

export class CommunityGroupService {
    async upsertSeen(groupJid: string, subject: string | undefined): Promise<void> {
        await prisma.communityGroup.upsert({
            where: { groupJid },
            update: { subject: subject ?? null },
            create: { groupJid, subject: subject ?? null },
        });
    }

    async getAll(): Promise<CommunityGroupEntry[]> {
        return prisma.communityGroup.findMany({ orderBy: { shortId: 'asc' } });
    }

    async getJidByShortId(shortId: number): Promise<string | null> {
        const entry = await prisma.communityGroup.findUnique({ where: { shortId } });
        return entry?.groupJid ?? null;
    }
}
