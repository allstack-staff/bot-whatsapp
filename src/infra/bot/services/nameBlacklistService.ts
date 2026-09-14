import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export type BlacklistMatchType = 'PREFIX' | 'SUFFIX';

export class NameBlacklistService {
    async add(matchType: BlacklistMatchType, pattern: string, addedBy: string): Promise<any> {
        return prisma.nameBlacklistPattern.create({ data: { matchType, pattern, addedBy } });
    }

    async remove(id: string): Promise<boolean> {
        const result = await prisma.nameBlacklistPattern.deleteMany({ where: { id } });
        return result.count > 0;
    }

    async list(): Promise<any[]> {
        return prisma.nameBlacklistPattern.findMany({ orderBy: { createdAt: 'desc' } });
    }

    /** Primeiro padrão que bate com esse nome (prefixo/sufixo, sem diferenciar maiúsculas), ou null. */
    async findMatch(name: string | undefined): Promise<any | null> {
        if (!name) return null;
        const normalized = name.toLowerCase();
        const patterns = await this.list();
        return (
            patterns.find((p) => {
                const needle = p.pattern.toLowerCase();
                return p.matchType === 'PREFIX' ? normalized.startsWith(needle) : normalized.endsWith(needle);
            }) ?? null
        );
    }
}
