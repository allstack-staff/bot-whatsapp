import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export class AdminRemovalService {
    async createPending(data: {
        targetJid: string;
        requestedBy: string;
        reason?: string;
        voteMessageId: string;
        voteGroupJid: string;
    }): Promise<any> {
        return prisma.adminRemoval.create({ data });
    }

    async findActivePendingForTarget(targetJid: string): Promise<any | null> {
        return prisma.adminRemoval.findFirst({ where: { targetJid, status: 'PENDING' } });
    }

    async findPendingByVoteMessageId(voteMessageId: string): Promise<any | null> {
        return prisma.adminRemoval.findFirst({ where: { voteMessageId, status: 'PENDING' } });
    }

    async resolve(id: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
        await prisma.adminRemoval.update({
            where: { id },
            data: { status, resolvedAt: new Date() },
        });
    }
}
