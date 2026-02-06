import type { NextFunction, Request, Response } from 'express';

export function notFound(_req: Request, res: Response) {
    res.status(404).json({ error: 'Not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    const isProd = process.env.NODE_ENV === 'production';
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (!isProd) {
        // eslint-disable-next-line no-console
        console.error(err);
    }
    res.status(500).json({ error: isProd ? 'Internal server error' : message });
}
