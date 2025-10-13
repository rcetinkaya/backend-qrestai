/**
 * Main API Router
 * Separates admin and customer routes
 */

import { Router } from 'express';
import adminRoutes from './admin/index.js';
import customerRoutes from './customer/index.js';
import publicRoutes from './public/index.js';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     description: Check API server health and status
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 *                   example: 3600
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Route prefixes
router.use('/public', publicRoutes);   // Public routes (no auth) -> /api/public/*
router.use('/admin', adminRoutes);     // Admin panel routes -> /api/admin/*
router.use(customerRoutes);             // Customer panel routes -> /api/*

export default router;
