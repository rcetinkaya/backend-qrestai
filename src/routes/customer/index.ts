/**
 * Customer Routes Index
 * All customer panel (restaurant owner) routes
 */

import { Router } from 'express';
import authRoutes from './auth.routes.js';
import menuRoutes from './menu.routes.js';
import categoryRoutes from './category.routes.js';
import menuItemRoutes from './menuItem.routes.js';
import qrCodeRoutes from './qrcode.routes.js';
import organizationRoutes from './organization.routes.js';
import themeRoutes from './theme.routes.js';
import activityLogRoutes from './activityLog.routes.js';
import verifyRoutes from './verify.routes.js';
import passwordRoutes from './password.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import teamRoutes from './team.routes.js';
import aiRoutes from './ai.routes.js';

const router = Router();

// Customer routes
router.use('/auth', authRoutes);
router.use('/menus', menuRoutes);
router.use('/menus', categoryRoutes);
router.use('/menus', menuItemRoutes);
router.use('/menus', qrCodeRoutes);
router.use('/organization', organizationRoutes);
router.use('/theme', themeRoutes);
router.use('/organization', activityLogRoutes);
router.use('/verify', verifyRoutes);
router.use('/password', passwordRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/team', teamRoutes);
router.use('/organization', aiRoutes);

export default router;
