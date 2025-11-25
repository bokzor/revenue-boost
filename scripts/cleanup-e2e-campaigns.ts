import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const prisma = new PrismaClient();

async function cleanup() {
    const result = await prisma.campaign.deleteMany({
        where: {}
    });
    console.log(`Deleted ${result.count} E2E test campaigns`);
    await prisma.$disconnect();
}

cleanup().catch(console.error);
