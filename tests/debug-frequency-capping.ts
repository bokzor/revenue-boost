/**
 * Debug script to investigate .withFrequencyCapping() bug
 * 
 * Creates two campaigns:
 * 1. With default factory settings (works)
 * 2. With explicit .withMaxImpressionsPerSession() call (broken)
 * 
 * Then prints their IDs so we can examine them in the database
 */

import { PrismaClient } from '@prisma/client';
import { CampaignFactory } from './e2e/staging/factories/campaign-factory';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const STORE_DOMAIN = 'revenue-boost-staging.myshopify.com';

async function main() {
    const prisma = new PrismaClient();

    try {
        // Get store ID
        const store = await prisma.store.findUnique({
            where: { shopifyDomain: STORE_DOMAIN }
        });

        if (!store) {
            throw new Error(`Store not found: ${STORE_DOMAIN}`);
        }

        console.log(`✅ Store found: ${store.id}\n`);

        const factory = new CampaignFactory(prisma, store.id);

        // Campaign 1: Using default factory settings (should work)
        console.log('Creating Campaign 1: Default factory settings...');
        const campaign1 = await (await factory.newsletter().init())
            .withName('DEBUG-DEFAULT')
            .withPriority(10)
            .create();

        console.log(`✅ Campaign 1 created: ${campaign1.id}`);
        console.log(`   Name: ${campaign1.name}`);
        console.log(`   Frequency Capping: ${JSON.stringify(campaign1.targetRules?.enhancedTriggers?.frequency_capping || {}, null, 2)}\n`);

        // Campaign 2: Using explicit .withMaxImpressionsPerSession() (should be broken)
        console.log('Creating Campaign 2: Explicit .withMaxImpressionsPerSession(100)...');
        const campaign2 = await (await factory.newsletter().init())
            .withName('DEBUG-EXPLICIT-CAPPING')
            .withPriority(10)
            .withMaxImpressionsPerSession(100)
            .create();

        console.log(`✅ Campaign 2 created: ${campaign2.id}`);
        console.log(`   Name: ${campaign2.name}`);
        console.log(`   Frequency Capping: ${JSON.stringify(campaign2.targetRules?.enhancedTriggers?.frequency_capping || {}, null, 2)}\n`);

        // Print comparison instructions
        console.log('═══════════════════════════════════════════════════════════');
        console.log('COMPARISON INSTRUCTIONS:');
        console.log('═══════════════════════════════════════════════════════════\n');
        console.log('To compare these campaigns in the database, run:');
        console.log(`\ngcloud sql connect revenueboost-staging-db --user=postgres --database=revenue_boost_staging --project=revenueboost-staging\n`);
        console.log('Then execute:');
        console.log(`\nSELECT id, name, status, priority, "targetRules" FROM "Campaign" WHERE id IN ('${campaign1.id}', '${campaign2.id}');\n`);
        console.log('\nOr use this cleanup script to delete them:');
        console.log(`\nDELETE FROM "Campaign" WHERE id IN ('${campaign1.id}', '${campaign2.id}');\n`);

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
