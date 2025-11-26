import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.staging.env' });

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    console.error('❌ REDIS_URL not found in .env.staging.env');
    process.exit(1);
}

async function clearUpstashRedis() {
    console.log('🧹 Clearing Upstash Redis for E2E tests...');
    console.log(`   Connecting to: ${REDIS_URL!.replace(/:[^:]+@/, ':***@')}\n`);

    // Upstash requires TLS
    const redis = new Redis(REDIS_URL!, {
        tls: {
            rejectUnauthorized: false, // Upstash uses self-signed certs
        },
        maxRetriesPerRequest: 5,
        retryStrategy: (times) => {
            if (times > 5) {
                console.error(`   Failed after ${times} retries`);
                return null;
            }
            const delay = Math.min(times * 500, 2000);
            console.log(`   Retry ${times}/5 in ${delay}ms...`);
            return delay;
        },
        connectTimeout: 15000,
        commandTimeout: 10000,
        lazyConnect: true, // Don't auto-connect
    });

    // Helper function to scan keys (Upstash doesn't allow KEYS)
    async function scanKeys(pattern: string): Promise<string[]> {
        const keys: string[] = [];
        let cursor = '0';

        do {
            const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = result[0];
            keys.push(...result[1]);
        } while (cursor !== '0');

        return keys;
    }

    try {
        // Explicitly connect
        console.log('📡 Connecting...');
        await redis.connect();

        // Test connection
        console.log('🏓 Testing connection...');
        await redis.ping();
        console.log('✅ Connected to Upstash Redis\n');

        // Clear frequency capping keys
        console.log('🔍 Finding frequency capping keys...');
        const freqKeys = await scanKeys('freq_cap:*');
        console.log(`   Found ${freqKeys.length} freq_cap keys`);

        if (freqKeys.length > 0) {
            // Delete in batches to avoid command too long
            const batchSize = 100;
            let totalDeleted = 0;
            for (let i = 0; i < freqKeys.length; i += batchSize) {
                const batch = freqKeys.slice(i, i + batchSize);
                const deleted = await redis.del(...batch);
                totalDeleted += deleted;
            }
            console.log(`   ✅ Deleted ${totalDeleted} freq_cap keys\n`);
        }

        // Clear global frequency keys
        console.log('🔍 Finding global frequency keys...');
        const globalKeys = await scanKeys('global_freq:*');
        console.log(`   Found ${globalKeys.length} global_freq keys`);

        if (globalKeys.length > 0) {
            const batchSize = 100;
            let totalDeleted = 0;
            for (let i = 0; i < globalKeys.length; i += batchSize) {
                const batch = globalKeys.slice(i, i + batchSize);
                const deleted = await redis.del(...batch);
                totalDeleted += deleted;
            }
            console.log(`   ✅ Deleted ${totalDeleted} global_freq keys\n`);
        }

        // Clear cooldown keys
        console.log('🔍 Finding cooldown keys...');
        const cooldownKeys = await scanKeys('cooldown:*');
        console.log(`   Found ${cooldownKeys.length} cooldown keys`);

        if (cooldownKeys.length > 0) {
            const batchSize = 100;
            let totalDeleted = 0;
            for (let i = 0; i < cooldownKeys.length; i += batchSize) {
                const batch = cooldownKeys.slice(i, i + batchSize);
                const deleted = await redis.del(...batch);
                totalDeleted += deleted;
            }
            console.log(`   ✅ Deleted ${totalDeleted} cooldown keys\n`);
        }

        // Clear session keys (optional)
        console.log('🔍 Finding session keys...');
        const sessionKeys = await scanKeys('session:*');
        console.log(`   Found ${sessionKeys.length} session keys`);

        if (sessionKeys.length > 0) {
            console.log('   ⚠️  Skipping session keys (comment out this line to delete)\n');
            // Uncomment to delete session keys:
            // const batchSize = 100;
            // let totalDeleted = 0;
            // for (let i = 0; i < sessionKeys.length; i += batchSize) {
            //     const batch = sessionKeys.slice(i, i + batchSize);
            //     const deleted = await redis.del(...batch);
            //     totalDeleted += deleted;
            // }
            // console.log(`   ✅ Deleted ${totalDeleted} session keys\n`);
        }

        console.log('✅ Upstash Redis cleared successfully!\n');
        console.log('📝 Summary:');
        console.log(`   - freq_cap keys: ${freqKeys.length}`);
        console.log(`   - global_freq keys: ${globalKeys.length}`);
        console.log(`   - cooldown keys: ${cooldownKeys.length}`);
        console.log(`   - session keys: ${sessionKeys.length} (not deleted)`);

    } catch (error) {
        console.error('\n❌ Error clearing Upstash Redis:');
        console.error(error);
        process.exit(1);
    } finally {
        await redis.quit();
    }
}

clearUpstashRedis();
