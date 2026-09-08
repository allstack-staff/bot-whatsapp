import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export class PendingAiBanService {
    async createPending(data: {
        userJid: string;
        senderRaw: string;
        groupJid: string;
        reason: string;
        category: string;
        displayName?: string;
        voteMessageId: string;
        messageKeysJson?: string;
    }): Promise<any> {
        return prisma.pendingAiBanConfirmation.create({ data });
    }

    async findPendingByVoteMessageId(voteMessageId: string): Promise<any | null> {
        return prisma.pendingAiBanConfirmation.findFirst({
            where: { voteMessageId, status: 'PENDING' },
        });
    }

    async resolve(id: string, status: 'CONFIRMED' | 'DISMISSED'): Promise<void> {
        await prisma.pendingAiBanConfirmation.update({
            where: { id },
            data: { status, resolvedAt: new Date() },
        });
    }
}
