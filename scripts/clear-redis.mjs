import Redis from 'ioredis';

function sanitize(url) {
  if (!url) return '';
  return url.replace(/:\/\/[^@]+@/, '://***@');
}

async function main() {
  const url = process.env.REDIS_URL;
  const useUrl = Boolean(url);

  let client;
  try {
    if (useUrl) {
      console.log(`🧹 Clearing Redis (URL: ${sanitize(url)})...`);
      client = new Redis(url, {
        tls: url.startsWith('rediss://') ? {} : undefined,
        maxRetriesPerRequest: 1,
        connectTimeout: 1500,
        retryStrategy: (times) => (times > 2 ? null : Math.min(times * 100, 500)),
        enableReadyCheck: true,
      });
    } else {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      const db = parseInt(process.env.REDIS_DB || '0', 10);
      const password = process.env.REDIS_PASSWORD || undefined;
      console.log(`🧹 Clearing Redis (host: ${host}, port: ${port}, db: ${db})...`);
      client = new Redis({
        host,
        port,
        db,
        password,
        maxRetriesPerRequest: 1,
        connectTimeout: 1500,
        retryStrategy: (times) => (times > 2 ? null : Math.min(times * 100, 500)),
        enableReadyCheck: true,
      });
    }

    // Try a quick ping to verify connectivity
    await client.ping();

    // Flush current DB only
    await client.flushdb();

    console.log('✅ Redis FLUSHDB completed');
  } catch (err) {
    console.warn('⚠️  Skipping Redis flush (not configured or unavailable):', err?.message || err);
  } finally {
    try {
      if (client) await client.quit();
    } catch {}
  }
}

// Top-level await is supported in ESM (Node 20+)
await main();

