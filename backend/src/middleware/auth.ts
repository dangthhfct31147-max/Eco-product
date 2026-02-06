import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getEnv } from '../env';

export interface AuthenticatedRequest extends Request {
    user?: { id: string };
}

function getCookieValue(cookieHeader: string | undefined, name: string): string | undefined {
    if (!cookieHeader) return undefined;
    // Basic cookie parsing: "a=1; b=2" -> find name
    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const [k, ...rest] = part.trim().split('=');
        if (k === name) {
            const v = rest.join('=');
            try {
                return decodeURIComponent(v);
            } catch {
                return v;
            }
        }
    }
    return undefined;
}

function getTokenFromRequest(req: Request): string | undefined {
    const header = req.header('authorization');
    if (header?.startsWith('Bearer ')) {
        return header.slice('Bearer '.length);
    }
    // Prefer HttpOnly cookie for browser sessions
    return getCookieValue(req.header('cookie'), 'eco_token');
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
    const token = getTokenFromRequest(req);
    if (!token) return next();
    try {
        const env = getEnv();
        const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string };
        if (payload.sub) {
            req.user = { id: payload.sub };
        }
    } catch {
        // ignore invalid token for optional auth
    }
    return next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const env = getEnv();
        const payload = jwt.verify(token, env.JWT_SECRET) as { sub?: string };
        if (!payload.sub) return res.status(401).json({ error: 'Unauthorized' });
        req.user = { id: payload.sub };
        return next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}
