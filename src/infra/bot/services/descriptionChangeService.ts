import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const LOCK_DAYS = 7;

export class DescriptionChangeService {
    async createPending(data: {
        groupJid: string;
        oldDescription?: string;
        newDescription?: string;
        proposedBy: string;
        voteMessageId: string;
        voteGroupJid: string;
    }): Promise<any> {
        return prisma.groupDescriptionChange.create({ data });
    }

    async findPendingByVoteMessageId(voteMessageId: string): Promise<any | null> {
        return prisma.groupDescriptionChange.findFirst({
            where: { voteMessageId, status: 'PENDING' },
        });
    }

    async resolve(id: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
        await prisma.groupDescriptionChange.update({
            where: { id },
            data: { status, resolvedAt: new Date() },
        });
    }

    async getLock(groupJid: string): Promise<any | null> {
        const lock = await prisma.groupDescriptionLock.findUnique({ where: { groupJid } });
        if (!lock) return null;
        if (lock.lockedUntil <= new Date()) {
            await prisma.groupDescriptionLock.delete({ where: { groupJid } }).catch(() => {});
            return null;
        }
        return lock;
    }

    async setLock(groupJid: string, frozenDescription: string | undefined): Promise<void> {
        const lockedUntil = new Date(Date.now() + LOCK_DAYS * 24 * 60 * 60 * 1000);
        await prisma.groupDescriptionLock.upsert({
            where: { groupJid },
            update: { lockedUntil, frozenDescription },
            create: { groupJid, lockedUntil, frozenDescription },
        });
    }
}
