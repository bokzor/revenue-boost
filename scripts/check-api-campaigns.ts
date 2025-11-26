import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.staging.env' });

const STORE_DOMAIN = process.env.SHOPIFY_STORE_URL?.replace('https://', '') || '';

async function main() {
    const url = `https://${STORE_DOMAIN}/apps/splitpop/api/campaigns`;
    console.log(`Calling: ${url}`);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
    });

    const data = await response.json() as {
        campaigns?: Array<{
            id?: string;
            name?: string;
            priority?: number;
            templateType?: string;
            discountConfig?: { enabled?: boolean };
        }>;
    };
    console.log(`\nResponse status: ${response.status}`);
    console.log(`\nCampaigns returned: ${data.campaigns?.length || 0}`);

    if (data.campaigns && data.campaigns.length > 0) {
        console.log('\nCampaigns:');
        data.campaigns.forEach((c, i: number) => {
            console.log(`\n${i + 1}. ${c.name} (${c.id})`);
            console.log(`   Priority: ${c.priority}`);
            console.log(`   Template: ${c.templateType}`);
            console.log(`   Discount enabled: ${c.discountConfig?.enabled}`);
        });
    }
}

main().catch(console.error);
