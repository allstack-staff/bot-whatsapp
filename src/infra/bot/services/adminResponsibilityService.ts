import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || './prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

export class AdminResponsibilityService {
    async assign(adminJid: string, groupJid: string): Promise<void> {
        await prisma.adminResponsibility.upsert({
            where: { adminJid_groupJid: { adminJid, groupJid } },
            update: {},
            create: { adminJid, groupJid },
        });
    }

    async unassign(adminJid: string, groupJid: string): Promise<void> {
        await prisma.adminResponsibility.deleteMany({ where: { adminJid, groupJid } });
    }

    async getResponsibleAdmins(groupJid: string): Promise<string[]> {
        const rows = await prisma.adminResponsibility.findMany({ where: { groupJid } });
        return rows.map((r) => r.adminJid);
    }

    async getGroupsFor(adminJid: string): Promise<string[]> {
        const rows = await prisma.adminResponsibility.findMany({ where: { adminJid } });
        return rows.map((r) => r.groupJid);
    }
}
