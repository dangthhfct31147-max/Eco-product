import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { getEnv } from './env';
import { authRouter } from './routes/auth';
import { productsRouter } from './routes/products';
import { healthRouter } from './routes/health';
import { cartRouter } from './routes/cart';
import { postsRouter } from './routes/posts';
import { eventsRouter } from './routes/events';
import { pollutionRouter } from './routes/pollution';
import { errorHandler, notFound } from './middleware/errors';

dotenv.config();

const env = getEnv();
const isProd = env.NODE_ENV === 'production';

const app = express();

app.disable('x-powered-by');

// Compression middleware - reduce response size by 20-70%
app.use(compression({
    level: 6, // balanced speed/compression
    threshold: 1024, // only compress responses > 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
}));

// Enhanced Helmet security headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: isProd ? {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:", "blob:"],
                connectSrc: ["'self'", env.FRONTEND_ORIGIN],
                frameSrc: ["'none'"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        } : false,
        hsts: isProd ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        } : false,
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xContentTypeOptions: true,
        xDnsPrefetchControl: { allow: false },
        xDownloadOptions: true,
        xFrameOptions: { action: 'deny' },
        xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
    }),
);

app.use(
    cors({
        origin: env.FRONTEND_ORIGIN,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

// Basic CSRF hardening for cookie-based auth:
// If a browser sends a cross-origin state-changing request, block it.
app.use((req, res, next) => {
    const method = req.method.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next();

    const origin = req.header('origin');
    // Allow non-browser clients (no Origin header)
    if (!origin) return next();

    if (origin !== env.FRONTEND_ORIGIN) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
});

app.use(express.json({ limit: '1mb' }));

if (env.NODE_ENV !== 'test') {
    app.use(morgan(isProd ? 'combined' : 'dev'));
}

// Baseline rate limit
app.use(
    rateLimit({
        windowMs: 60_000,
        limit: 300,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
    }),
);

// Stricter rate limit for auth
app.use(
    '/api/auth',
    rateLimit({
        windowMs: 60_000,
        limit: 30,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
    }),
);

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api', cartRouter);
app.use('/api', postsRouter);
app.use('/api', eventsRouter);
app.use('/api', pollutionRouter);

// Serve static frontend in production
if (isProd) {
    const distPath = new URL('../../dist', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    app.use(express.static(distPath, {
        maxAge: '1d',
        etag: true,
    }));

    // SPA fallback: serve index.html for all non-API routes
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile('index.html', { root: distPath });
    });
}

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${env.PORT}`);
    if (isProd) {
        console.log('Running in PRODUCTION mode with enhanced security');
    }
});
