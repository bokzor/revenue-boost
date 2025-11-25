import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.staging.env' });

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
    console.error('❌ REDIS_URL not found in environment');
    process.exit(1);
}

async function main() {
    console.log(`🧹 Clearing Staging Redis...`);

    // Type guard ensures REDIS_URL is defined
    if (!REDIS_URL) {
        throw new Error('REDIS_URL is not defined');
    }

    console.log(`   URL: ${REDIS_URL.replace(/:[^:]+@/, ':***@')}`); // Hide password

    const redis = new Redis(REDIS_URL);

    try {
        // Clear all keys related to frequency capping
        const keys = await redis.keys('freq_cap:*');
        console.log(`   Found ${keys.length} frequency capping keys`);

        if (keys.length > 0) {
            await redis.del(...keys);
            console.log(`   ✅ Deleted ${keys.length} frequency capping keys`);
        }

        // Also clear session keys if needed
        const sessionKeys = await redis.keys('session:*');
        console.log(`   Found ${sessionKeys.length} session keys`);

        if (sessionKeys.length > 0) {
            await redis.del(...sessionKeys);
            console.log(`   ✅ Deleted ${sessionKeys.length} session keys`);
        }

        console.log(`\n✅ Staging Redis cleared successfully`);
    } catch (error) {
        console.error('❌ Error clearing Redis:', error);
        process.exit(1);
    } finally {
        await redis.quit();
    }
}

main();
