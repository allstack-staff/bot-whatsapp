import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { BanType } from '../types';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const AUTH_DIR = path.join(__dirname, '..', '..', '..', '..', 'auth');

export interface BanData {
    userJid: string;
    groupJid: string;
    banType: BanType;
    reason: string;
    expiresAt?: Date;
    bannedBy: string;
}

function getPrefixes(jid: string): string[] {
    const raw = jid.split('@')[0].split(':')[0];
    const result: string[] = [raw];
    try {
        const lidFile = path.join(AUTH_DIR, `lid-mapping-${raw}_reverse.json`);
        if (fs.existsSync(lidFile)) {
            const phone: string = JSON.parse(fs.readFileSync(lidFile, 'utf-8'));
            if (phone && result.indexOf(phone) === -1) result.push(phone);
        }
        const phoneFile = path.join(AUTH_DIR, `lid-mapping-${raw}.json`);
        if (fs.existsSync(phoneFile)) {
            const lid: string = JSON.parse(fs.readFileSync(phoneFile, 'utf-8'));
            if (lid && result.indexOf(lid) === -1) result.push(lid);
        }
    } catch {}
    return result;
}

async function findBan(
    userJid: string,
    groupJid?: string,
    extraWhere: any = {},
): Promise<any | null> {
    const userP = getPrefixes(userJid);
    const groupP = groupJid ? getPrefixes(groupJid) : [''];
    for (const up of userP) {
        for (const gp of groupP) {
            const where: any = { userJid: { startsWith: up }, ...extraWhere };
            if (groupJid) where.groupJid = { startsWith: gp };
            const ban = await prisma.bannedUser.findFirst({ where });
            if (ban) return ban;
        }
    }
    return null;
}

async function mutateBans(
    userJid: string,
    groupJid: string | undefined,
    operation: 'delete' | 'update',
    data?: any,
): Promise<number> {
    const userP = getPrefixes(userJid);
    const groupP = groupJid ? getPrefixes(groupJid) : [''];
    let total = 0;
    for (const up of userP) {
        for (const gp of groupP) {
            const where: any = { userJid: { startsWith: up } };
            if (groupJid) where.groupJid = { startsWith: gp };
            if (operation === 'delete') {
                total += (await prisma.bannedUser.deleteMany({ where })).count;
            } else if (operation === 'update' && data) {
                total += (await prisma.bannedUser.updateMany({ where, data })).count;
            }
        }
    }
    return total;
}

export class BanService {
    async ban(data: BanData): Promise<void> {
        const existing = await findBan(data.userJid, data.groupJid);
        if (existing) {
            await prisma.bannedUser.update({
                where: {
                    userJid_groupJid: { userJid: existing.userJid, groupJid: existing.groupJid },
                },
                data: {
                    banType: data.banType,
                    reason: data.reason,
                    expiresAt: data.expiresAt ?? null,
                    bannedBy: data.bannedBy,
                },
            });
        } else {
            await prisma.bannedUser.create({ data });
        }
    }

    async unban(userJid: string, groupJid?: string): Promise<number> {
        return mutateBans(userJid, groupJid, 'delete');
    }

    async getBans(): Promise<any[]> {
        return prisma.bannedUser.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async getUserBans(userJid: string): Promise<any[]> {
        const prefixes = getPrefixes(userJid);
        const results = await Promise.all(
            prefixes.map((p) => prisma.bannedUser.findMany({ where: { userJid: { startsWith: p } } })),
        );
        return results.flat();
    }

    async isBanned(userJid: string, groupJid: string): Promise<boolean> {
        const ban = await this.getActiveBan(userJid, groupJid);
        return ban !== null;
    }

    async getActiveBan(userJid: string, groupJid: string): Promise<any | null> {
        const comunidade = await findBan(userJid, undefined, {
            banType: 'COMUNIDADE',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        });
        if (comunidade) return comunidade;

        const permanente = await findBan(userJid, groupJid, {
            banType: { in: ['PERMANENTE'] },
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        });
        if (permanente) return permanente;

        const temp = await findBan(userJid, undefined, {
            banType: 'TEMPORARIO',
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        });
        if (temp) return temp;

        return null;
    }

    async updateBanType(userJid: string, groupJid: string, banType: BanType): Promise<boolean> {
        const count = await mutateBans(userJid, groupJid, 'update', { banType });
        return count > 0;
    }

    async updateExpiresAt(userJid: string, groupJid: string, expiresAt: Date | null): Promise<boolean> {
        const count = await mutateBans(userJid, groupJid, 'update', { expiresAt });
        return count > 0;
    }

    async cleanupExpired(): Promise<number> {
        const result = await prisma.bannedUser.deleteMany({
            where: { banType: 'TEMPORARIO', expiresAt: { lte: new Date() } },
        });
        return result.count;
    }
}
