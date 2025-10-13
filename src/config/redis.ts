/**
 * Redis Client Configuration
 * Used for rate limiting and caching
 */

import Redis from 'ioredis';
import { env } from './env.js';

// Create Redis client
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

redis.on('ready', () => {
  console.log('✅ Redis ready');
});

// Graceful shutdown
const disconnect = async () => {
  await redis.quit();
};

process.on('beforeExit', disconnect);
process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);

// Redis utilities
export const RedisKeys = {
  // Rate limiting
  rateLimit: (identifier: string) => `rate_limit:${identifier}`,

  // Session/Token
  refreshToken: (tokenId: string) => `refresh_token:${tokenId}`,

  // Cache
  menuCache: (menuId: string) => `cache:menu:${menuId}`,
  orgCache: (orgId: string) => `cache:org:${orgId}`,
} as const;
