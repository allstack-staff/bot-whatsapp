import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export class RuleProposalService {
    async createPending(data: {
        proposedBy: string;
        rawIdea: string;
        draftedText: string;
        punishment: string;
        conflictNote?: string;
        voteMessageId: string;
    }): Promise<any> {
        return prisma.ruleProposal.create({ data });
    }

    async findPendingByVoteMessageId(voteMessageId: string): Promise<any | null> {
        return prisma.ruleProposal.findFirst({
            where: { voteMessageId, status: 'PENDING' },
        });
    }

    async resolve(id: string, status: 'APPROVED' | 'REJECTED' | 'PUBLISH_FAILED'): Promise<void> {
        await prisma.ruleProposal.update({
            where: { id },
            data: { status, resolvedAt: new Date() },
        });
    }
}
