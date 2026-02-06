/**
 * Simple caching layer with in-memory fallback
 * Redis is optional - if REDIS_URL is not set, uses in-memory cache
 */

// In-memory cache storage
const memoryCache = new Map<string, { data: string; expiresAt: number }>();

// Clean up expired entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryCache.entries()) {
        if (value.expiresAt < now) {
            memoryCache.delete(key);
        }
    }
}, 30000);

// Redis client (lazy loaded)
let redisClient: import('ioredis').Redis | null = null;
let redisInitialized = false;

async function getRedis(): Promise<import('ioredis').Redis | null> {
    if (redisInitialized) return redisClient;
    redisInitialized = true;

    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
        console.log('ℹ️ REDIS_URL not set, using in-memory cache');
        return null;
    }

    try {
        const Redis = (await import('ioredis')).default;
        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            connectTimeout: 5000,
        });

        redisClient.on('error', (err) => {
            console.error('Redis error:', err.message);
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
        });

        return redisClient;
    } catch (err) {
        console.warn('⚠️ Failed to load Redis, using in-memory cache');
        return null;
    }
}

export async function cacheGet(key: string): Promise<string | null> {
    try {
        const redis = await getRedis();
        if (redis) {
            const value = await redis.get(key);
            if (value) return value;
        }
    } catch {
        // Ignore Redis errors
    }

    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }
    memoryCache.delete(key);
    return null;
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
    // Always set in memory cache
    memoryCache.set(key, {
        data: value,
        expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Also set in Redis if available
    try {
        const redis = await getRedis();
        if (redis) {
            await redis.setex(key, ttlSeconds, value);
        }
    } catch {
        // Ignore Redis errors
    }
}

export async function cacheDelete(pattern: string): Promise<void> {
    // Clear from memory cache
    const searchPattern = pattern.replace(/\*/g, '');
    for (const key of memoryCache.keys()) {
        if (key.includes(searchPattern)) {
            memoryCache.delete(key);
        }
    }

    // Also clear from Redis if available
    try {
        const redis = await getRedis();
        if (redis) {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        }
    } catch {
        // Ignore Redis errors
    }
}

// Cache key generators
export const CACHE_KEYS = {
    productsList: (category?: string, search?: string) =>
        `products:list:${category || 'all'}:${search || ''}`,
    productById: (id: string) => `products:id:${id}`,
    productsInvalidate: 'products:',
};

// Cache TTL in seconds
export const CACHE_TTL = {
    productsList: 60,      // 1 minute
    productById: 120,      // 2 minutes
};
