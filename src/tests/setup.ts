/**
 * Jest Test Setup
 * Runs before all tests
 */

import { prisma } from '../config/database.js';
import { redis } from '../config/redis.js';

// Setup function runs before all tests
beforeAll(async () => {
  // Ensure test database is clean
  console.log('🧪 Setting up test environment...');
});

// Cleanup after each test
afterEach(async () => {
  // Clear Redis cache between tests
  await redis.flushdb();
});

// Cleanup after all tests
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');

  // Disconnect from database
  await prisma.$disconnect();

  // Disconnect from Redis
  await redis.quit();
});
