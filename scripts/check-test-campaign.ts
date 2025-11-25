import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.staging.env' });

const prisma = new PrismaClient();

async function main() {
    const campaigns = await prisma.campaign.findMany({
        where: {
            name: { startsWith: 'E2E-Test-Discount' }
        },
        select: {
            id: true,
            name: true,
            priority: true,
            status: true,
            discountConfig: true,
            targetRules: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log(`Found ${campaigns.length} discount test campaigns:`);
    campaigns.forEach(c => {
        console.log(`\n- ${c.name} (${c.id})`);
        console.log(`  Priority: ${c.priority}`);
        console.log(`  Status: ${c.status}`);
        console.log(`  Discount: ${JSON.stringify(c.discountConfig, null, 2)}`);
    });
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
