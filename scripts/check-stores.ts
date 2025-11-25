import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.staging.env' });

const prisma = new PrismaClient();

async function main() {
    // Check stores in the database
    const stores = await prisma.store.findMany({
        select: {
            id: true,
            shopifyDomain: true,
            isActive: true,
            _count: {
                select: { campaigns: true }
            }
        }
    });

    console.log(`\nFound ${stores.length} stores:\n`);
    stores.forEach(store => {
        console.log(`- ${store.shopifyDomain} (${store.id})`);
        console.log(`  Active: ${store.isActive}`);
        console.log(`  Campaigns: ${store._count.campaigns}`);
    });

    // Check the test campaign
    const testCampaign = await prisma.campaign.findFirst({
        where: { name: { startsWith: 'E2E-Test-MINIMAL' } },
        select: {
            id: true,
            name: true,
            storeId: true,
            status: true,
            priority: true,
            store: {
                select: {
                    shopifyDomain: true
                }
            }
        }
    });

    if (testCampaign) {
        console.log(`\n✅ Test campaign found:`);
        console.log(`   ID: ${testCampaign.id}`);
        console.log(`   Name: ${testCampaign.name}`);
        console.log(`   Store ID: ${testCampaign.storeId}`);
        console.log(`   Store Domain: ${testCampaign.store.shopifyDomain}`);
        console.log(`   Status: ${testCampaign.status}`);
        console.log(`   Priority: ${testCampaign.priority}`);

        // Now check if this store ID matches what we expect
        const EXPECTED_DOMAIN = 'revenue-boost-staging.myshopify.com';
        if (testCampaign.store.shopifyDomain === EXPECTED_DOMAIN) {
            console.log(`\n✅ Store domain matches expected: ${EXPECTED_DOMAIN}`);
        } else {
            console.log(`\n❌ Store domain MISMATCH!`);
            console.log(`   Expected: ${EXPECTED_DOMAIN}`);
            console.log(`   Actual: ${testCampaign.store.shopifyDomain}`);
        }
    } else {
        console.log(`\n❌ No test campaign found`);
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
