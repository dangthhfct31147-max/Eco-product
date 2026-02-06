import { cache } from '../lib/cache';

healthRouter.get('/health', async (_req, res) => {
    // Check Redis health (non-blocking for overall health unless critical)
    const redisHealthy = await cache.checkRedisHealth(1000); // 1s timeout for health check

    const status = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            redis: redisHealthy ? 'healthy' : 'disconnected_or_not_configured',
        },
    };

    res.json(status);
});
