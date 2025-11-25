/**
 * Simulate API request to test frequency capping for both campaigns
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.staging.env'), override: true });

const CAMPAIGN_IDS = ['cmiexobf30001urh5x5xjse74', 'cmiexoblv0003urh5ta4pt4vw'];

async function main() {
    const prisma = new PrismaClient();

    try {
        // Get campaigns
        const campaigns = await prisma.campaign.findMany({
            where: { id: { in: CAMPAIGN_IDS } },
            select: {
                id: true,
                name: true,
                storeId: true,
                targetRules: true
            }
        });

        console.log('═══════════════════════════════════════════════════════════');
        console.log('TEST: Simulating API Request');
        console.log('═══════════════════════════════════════════════════════════\n');

        if (campaigns.length !== 2) {
            console.error(`❌ Expected 2 campaigns, found ${campaigns.length}`);
            return;
        }

        // Import the FrequencyCapService directly
        const { FrequencyCapService } = await import('../app/domains/targeting/services/frequency-cap.server');

        // Create a mock storefront context
        const context = {
            shopDomain: 'revenue-boost-staging.myshopify.com',
            sessionId: 'test-session-123',
            visitorId: 'test-visitor-456',
            pageUrl: '/',
            pageType: 'home',
            deviceType: 'desktop',
            visitCount: 1,
            isReturningVisitor: false
        } as any;

        console.log('📋 Context:', context);
        console.log('\n');

        // Test frequency capping for each campaign individually
        for (const campaign of campaigns) {
            console.log(`\n${'─'.repeat(60)}`);
            console.log(`Testing: ${campaign.name}`);
            console.log(`${'─'.repeat(60)}`);

            const rules = (campaign.targetRules as any)?.enhancedTriggers?.frequency_capping;
            console.log('Frequency Capping Rules:', JSON.stringify(rules, null, 2));

            // Import FrequencyCapService
            const { FrequencyCapService } = await import('../app/domains/targeting/services/frequency-cap.server');

            const result = await FrequencyCapService.checkFrequencyCapping(
                campaign as any,
                context as any,
                undefined
            );

            console.log('\nFrequency Cap Result:', {
                allowed: result.allowed,
                reason: result.reason || 'N/A',
                currentCounts: result.currentCounts
            });

            if (result.allowed) {
                console.log('✅ Campaign PASSED frequency capping');
            } else {
                console.log(`❌ Campaign BLOCKED: ${result.reason}`);
            }
        }

        console.log('\n\n═══════════════════════════════════════════════════════════');
        console.log('CONCLUSION:');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('If both campaigns pass, the bug is elsewhere.');
        console.log('If Campaign 2 fails, we found the frequency capping bug!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
