/**
 * Rate limiting middleware using Redis
 */

import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';
import { RateLimitError } from '../types/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const rateLimiter = (options?: {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
}) => {
  const windowMs = options?.windowMs || env.RATE_LIMIT_WINDOW_MS;
  const maxRequests = options?.maxRequests || env.RATE_LIMIT_MAX_REQUESTS;
  const keyGenerator = options?.keyGenerator || ((req: Request) => {
    return req.user?.userId || req.ip || 'anonymous';
  });

  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const key = `rate_limit:${keyGenerator(req)}`;
    const windowSeconds = Math.floor(windowMs / 1000);

    // Increment request count
    const current = await redis.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    // Get TTL
    const ttl = await redis.ttl(key);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));
    res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000));

    // Check if limit exceeded
    if (current > maxRequests) {
      throw new RateLimitError(`Too many requests. Try again in ${ttl} seconds`);
    }

    next();
  });
};
