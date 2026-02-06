import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

// ============ RATE LIMIT CONFIGURATION ============
const RATE_LIMIT = {
    // IP-based rate limit
    IP_MAX_ATTEMPTS: 5,
    IP_WINDOW_MS: 60 * 1000, // 1 minute

    // Email-based rate limit
    EMAIL_MAX_ATTEMPTS: 10,
    EMAIL_WINDOW_MS: 60 * 60 * 1000, // 1 hour

    // Account lockout
    LOCKOUT_THRESHOLD: 10,
    LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
};

// In-memory store for IP rate limiting
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();

// ============ HELPER FUNCTIONS ============

/**
 * Get client IP from request
 */
export function getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0]?.trim() || 'unknown';
    }
    return req.socket?.remoteAddress || 'unknown';
}

/**
 * Clean up expired entries from loginAttempts map
 */
function cleanupLoginAttempts() {
    const now = Date.now();
    const maxWindow = Math.max(RATE_LIMIT.IP_WINDOW_MS, RATE_LIMIT.EMAIL_WINDOW_MS);
    for (const [key, data] of loginAttempts.entries()) {
        if (now - data.firstAttempt > maxWindow) {
            loginAttempts.delete(key);
        }
    }
}

// Clean up every 5 minutes
setInterval(cleanupLoginAttempts, 5 * 60 * 1000);

/**
 * Check IP-based rate limit
 */
export function checkIpRateLimit(ip: string): { allowed: boolean; remainingSeconds?: number } {
    const key = `ip:${ip}`;
    const now = Date.now();
    const data = loginAttempts.get(key);

    if (!data || now - data.firstAttempt > RATE_LIMIT.IP_WINDOW_MS) {
        return { allowed: true };
    }

    if (data.count >= RATE_LIMIT.IP_MAX_ATTEMPTS) {
        const remainingMs = RATE_LIMIT.IP_WINDOW_MS - (now - data.firstAttempt);
        return {
            allowed: false,
            remainingSeconds: Math.ceil(remainingMs / 1000),
        };
    }

    return { allowed: true };
}

/**
 * Record failed login attempt for IP
 */
export function recordIpAttempt(ip: string): void {
    const key = `ip:${ip}`;
    const now = Date.now();
    const data = loginAttempts.get(key);

    if (!data || now - data.firstAttempt > RATE_LIMIT.IP_WINDOW_MS) {
        loginAttempts.set(key, { count: 1, firstAttempt: now });
    } else {
        data.count++;
    }
}

/**
 * Clear IP attempts on successful login
 */
export function clearIpAttempts(ip: string): void {
    loginAttempts.delete(`ip:${ip}`);
}

/**
 * Check if account is locked
 */
export async function checkAccountLockout(
    email: string
): Promise<{ locked: boolean; remainingMinutes?: number; message?: string }> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { lockedUntil: true },
    });

    if (!user) return { locked: false };

    if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remainingMs = user.lockedUntil.getTime() - Date.now();
        const remainingMinutes = Math.ceil(remainingMs / 60000);
        return {
            locked: true,
            remainingMinutes,
            message: `Tài khoản tạm khóa. Vui lòng thử lại sau ${remainingMinutes} phút.`,
        };
    }

    return { locked: false };
}

/**
 * Check email-based rate limit from database
 */
export async function checkEmailRateLimit(
    email: string
): Promise<{ allowed: boolean; message?: string }> {
    const windowStart = new Date(Date.now() - RATE_LIMIT.EMAIL_WINDOW_MS);

    const recentAttempts = await prisma.loginAttempt.count({
        where: {
            email,
            success: false,
            createdAt: { gte: windowStart },
        },
    });

    if (recentAttempts >= RATE_LIMIT.EMAIL_MAX_ATTEMPTS) {
        return {
            allowed: false,
            message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 1 giờ.',
        };
    }

    return { allowed: true };
}

/**
 * Record login attempt in database
 */
export async function recordLoginAttempt(
    email: string,
    ip: string,
    userAgent: string | undefined,
    success: boolean,
    userId?: string
): Promise<{ accountLocked: boolean }> {
    // Insert login attempt
    await prisma.loginAttempt.create({
        data: {
            email,
            ip,
            userAgent: userAgent || null,
            success,
            userId: userId || null,
        },
    });

    // If failed, check if we need to lock the account
    if (!success) {
        const windowStart = new Date(Date.now() - RATE_LIMIT.EMAIL_WINDOW_MS);
        const failedCount = await prisma.loginAttempt.count({
            where: {
                email,
                success: false,
                createdAt: { gte: windowStart },
            },
        });

        if (failedCount >= RATE_LIMIT.LOCKOUT_THRESHOLD) {
            await prisma.user.updateMany({
                where: { email },
                data: {
                    lockedUntil: new Date(Date.now() + RATE_LIMIT.LOCKOUT_DURATION_MS),
                },
            });
            return { accountLocked: true };
        }
    } else {
        // Clear lockout on successful login
        await prisma.user.updateMany({
            where: { email, lockedUntil: { not: null } },
            data: { lockedUntil: null },
        });
    }

    return { accountLocked: false };
}

/**
 * Express middleware for IP rate limiting on login routes
 */
export function loginRateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const ip = getClientIp(req);
    const ipCheck = checkIpRateLimit(ip);

    if (!ipCheck.allowed) {
        return res.status(429).json({
            error: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${ipCheck.remainingSeconds} giây.`,
            code: 'IP_RATE_LIMIT',
            retryAfter: ipCheck.remainingSeconds,
        });
    }

    return next();
}

export { RATE_LIMIT };
