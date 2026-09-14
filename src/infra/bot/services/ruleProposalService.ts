import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export class RuleProposalService {
    /** Admin comum propôs — vota ANTES de publicar. */
    async createPending(data: {
        proposedBy: string;
        rawIdea: string;
        draftedText: string;
        punishment: string;
        conflictNote?: string;
        voteMessageId: string;
    }): Promise<any> {
        return prisma.ruleProposal.create({ data: { ...data, status: 'PENDING' } });
    }

    /** Admin de comunidade propôs — decisão monocrática, já publicada; vota DEPOIS (ratificação). */
    async createLive(data: {
        proposedBy: string;
        rawIdea: string;
        draftedText: string;
        punishment: string;
        conflictNote?: string;
        ruleNumber: number;
        voteMessageId: string;
    }): Promise<any> {
        return prisma.ruleProposal.create({ data: { ...data, status: 'LIVE_PENDING_RATIFICATION' } });
    }

    async findPendingByVoteMessageId(voteMessageId: string): Promise<any | null> {
        return prisma.ruleProposal.findFirst({
            where: { voteMessageId, status: 'PENDING' },
        });
    }

    async findLiveByVoteMessageId(voteMessageId: string): Promise<any | null> {
        return prisma.ruleProposal.findFirst({
            where: { voteMessageId, status: 'LIVE_PENDING_RATIFICATION' },
        });
    }

    async resolve(id: string, status: 'APPROVED' | 'REJECTED' | 'PUBLISH_FAILED' | 'RATIFIED' | 'REVERTED' | 'NEEDS_ADJUSTMENT'): Promise<void> {
        await prisma.ruleProposal.update({
            where: { id },
            data: { status, resolvedAt: new Date() },
        });
    }
}
