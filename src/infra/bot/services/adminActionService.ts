import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export type AdminActionType = 'ban' | 'advertir' | 'remove' | 'promote' | 'demote' | 'join_reject';

export interface AdminActionData {
    actorJid: string;
    actionType: AdminActionType;
    groupJid: string;
    targetJid?: string;
    description: string;
    beforeState?: string;
    noticeMessageId?: string;
}

export class AdminActionService {
    async create(data: AdminActionData): Promise<any> {
        return prisma.adminAction.create({ data });
    }

    /** Reply com motivo no aviso original — tentativa de reverter uma ação ainda ativa. */
    async findActiveByNoticeMessageId(noticeMessageId: string): Promise<any | null> {
        return prisma.adminAction.findFirst({
            where: { noticeMessageId, status: 'ACTIVE' },
        });
    }

    /** Voto de ratificação — reply/reação na mensagem de ratificação de uma reversão já aplicada. */
    async findPendingByVoteMessageId(voteMessageId: string): Promise<any | null> {
        return prisma.adminAction.findFirst({
            where: { voteMessageId, status: 'REVERTED' },
        });
    }

    async setNoticeMessageId(id: string, noticeMessageId: string): Promise<void> {
        await prisma.adminAction.update({ where: { id }, data: { noticeMessageId } });
    }

    async setVoteMessageId(id: string, voteMessageId: string): Promise<void> {
        await prisma.adminAction.update({ where: { id }, data: { voteMessageId } });
    }

    async resolve(id: string, status: 'REVERTED' | 'RATIFIED' | 'OVERTURNED', revertedBy?: string): Promise<void> {
        await prisma.adminAction.update({
            where: { id },
            data: { status, resolvedAt: new Date(), ...(revertedBy ? { revertedBy } : {}) },
        });
    }
}
