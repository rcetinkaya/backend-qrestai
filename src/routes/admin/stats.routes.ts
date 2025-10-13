/**
 * Admin Stats Routes
 * Dashboard statistics for admin panel
 */

import { Router } from 'express';
import { AdminController } from '../../controllers/admin.controller.js';

const router = Router();

/**
 * @swagger
 * /admin/stats/dashboard:
 *   get:
 *     tags: [Admin - Statistics]
 *     summary: Get dashboard statistics
 *     description: Get overview statistics for admin dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalOrganizations:
 *                       type: number
 *                       example: 150
 *                     totalUsers:
 *                       type: number
 *                       example: 450
 *                     totalMenus:
 *                       type: number
 *                       example: 300
 *                     newSignupsThisMonth:
 *                       type: number
 *                       example: 25
 */
router.get('/dashboard', AdminController.getDashboardStats);

export default router;
