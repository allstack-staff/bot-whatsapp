import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export class AdminService {
    async registerGroup(groupJid: string): Promise<void> {
        await prisma.adminGroup.upsert({
            where: { id: groupJid },
            update: {},
            create: { id: groupJid },
        });
    }

    async isAdminGroup(groupJid: string): Promise<boolean> {
        const group = await prisma.adminGroup.findUnique({ where: { id: groupJid } });
        return group !== null;
    }

    async getAdminGroups(): Promise<string[]> {
        const groups = await prisma.adminGroup.findMany();
        return groups.map((g) => g.id);
    }

    async removeGroup(groupJid: string): Promise<boolean> {
        const result = await prisma.adminGroup.deleteMany({ where: { id: groupJid } });
        return result.count > 0;
    }
}
