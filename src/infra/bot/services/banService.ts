import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { BanType } from '../types';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export interface BanData {
    userJid: string;
    displayName?: string;
    groupJid: string;
    banType: BanType;
    reason: string;
    expiresAt?: Date;
    bannedBy: string;
}

const notExpired = { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] };

export class BanService {
    async ban(data: BanData): Promise<void> {
        await prisma.bannedUser.upsert({
            where: {
                userJid_groupJid: { userJid: data.userJid, groupJid: data.groupJid },
            },
            update: {
                banType: data.banType,
                reason: data.reason,
                expiresAt: data.expiresAt ?? null,
                bannedBy: data.bannedBy,
                // só sobrescreve o nome se veio um novo — não apaga um já conhecido
                ...(data.displayName ? { displayName: data.displayName } : {}),
            },
            create: data,
        });
    }

    async unban(userJid: string, groupJid?: string): Promise<number> {
        const where: any = { userJid };
        if (groupJid) where.groupJid = groupJid;
        const result = await prisma.bannedUser.deleteMany({ where });
        return result.count;
    }

    async getBans(): Promise<any[]> {
        return prisma.bannedUser.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async getUserBans(userJid: string): Promise<any[]> {
        return prisma.bannedUser.findMany({ where: { userJid } });
    }

    async isBanned(userJid: string, groupJid: string): Promise<boolean> {
        const ban = await this.getActiveBan(userJid, groupJid);
        return ban !== null;
    }

    /**
     * COMUNIDADE bans apply everywhere (any group the bot manages); PERMANENTE
     * and TEMPORARIO only apply to the specific group they were issued in.
     */
    async getActiveBan(userJid: string, groupJid: string): Promise<any | null> {
        return prisma.bannedUser.findFirst({
            where: {
                userJid,
                AND: [
                    notExpired,
                    {
                        OR: [{ banType: 'COMUNIDADE' }, { groupJid, banType: { in: ['PERMANENTE', 'TEMPORARIO'] } }],
                    },
                ],
            },
        });
    }

    async updateBanType(userJid: string, groupJid: string, banType: BanType): Promise<boolean> {
        const result = await prisma.bannedUser.updateMany({ where: { userJid, groupJid }, data: { banType } });
        return result.count > 0;
    }

    async updateExpiresAt(userJid: string, groupJid: string, expiresAt: Date | null): Promise<boolean> {
        const result = await prisma.bannedUser.updateMany({ where: { userJid, groupJid }, data: { expiresAt } });
        return result.count > 0;
    }

    async cleanupExpired(): Promise<number> {
        const result = await prisma.bannedUser.deleteMany({
            where: { banType: 'TEMPORARIO', expiresAt: { lte: new Date() } },
        });
        return result.count;
    }
}
