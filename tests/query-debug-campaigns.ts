/**
 * Query script to examine targetRules for debug campaigns
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

async function main() {
    const prisma = new PrismaClient();

    try {
        const campaignIds = ['cmiexobf30001urh5x5xjse74', 'cmiexoblv0003urh5ta4pt4vw'];

        const campaigns = await prisma.campaign.findMany({
            where: { id: { in: campaignIds } },
            select: {
                id: true,
                name: true,
                status: true,
                priority: true,
                targetRules: true
            }
        });

        console.log('═══════════════════════════════════════════════════════════');
        console.log('CAMPAIGN COMPARISON:');
        console.log('═══════════════════════════════════════════════════════════\n');

        campaigns.forEach((campaign, index) => {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`Campaign ${index + 1}: ${campaign.name}`);
            console.log(`${'='.repeat(60)}`);
            console.log(`ID: ${campaign.id}`);
            console.log(`Status: ${campaign.status}`);
            console.log(`Priority: ${campaign.priority}\n`);

            console.log('TARGET RULES:');
            console.log(JSON.stringify(campaign.targetRules, null, 2));
        });

        // Now let's query what the API would return for these campaigns
        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('API SIMULATION: Checking what campaigns would be returned');
        console.log('═══════════════════════════════════════════════════════════\n');

        const activeCampaigns = await prisma.campaign.findMany({
            where: {
                id: { in: campaignIds },
                status: 'ACTIVE'
            },
            select: {
                id: true,
                name: true
            }
        });

        console.log(`Active campaigns that would be returned by API: ${activeCampaigns.length}`);
        activeCampaigns.forEach(c => {
            console.log(`  - ${c.name} (${c.id})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
