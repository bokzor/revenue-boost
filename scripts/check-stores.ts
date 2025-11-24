import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const prisma = new PrismaClient();

async function check() {
    const stores = await prisma.store.findMany();
    console.log(`Found ${stores.length} stores:`);
    stores.forEach(s => console.log(`- ID: ${s.id}, Shop: ${s.shopifyDomain}`));
    await prisma.$disconnect();
}

check().catch(console.error);
