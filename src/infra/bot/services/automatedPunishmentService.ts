import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export interface CreateAutomatedPunishmentData {
    userJid: string;
    groupJid: string;
    banType: string;
    reason: string;
    source: 'ia' | 'advertencias';
}

export class AutomatedPunishmentService {
    async create(data: CreateAutomatedPunishmentData): Promise<{ id: string }> {
        return prisma.automatedPunishment.create({ data, select: { id: true } });
    }

    async setMessageId(id: string, messageId: string): Promise<void> {
        await prisma.automatedPunishment.update({ where: { id }, data: { messageId } });
    }

    async findActiveByMessageId(messageId: string): Promise<any | null> {
        return prisma.automatedPunishment.findFirst({ where: { messageId, status: 'ACTIVE' } });
    }

    async revert(id: string, revertedBy: string, revertReason?: string): Promise<void> {
        await prisma.automatedPunishment.update({
            where: { id },
            data: { status: 'REVERTED', resolvedAt: new Date(), revertedBy, revertReason },
        });
    }
}
