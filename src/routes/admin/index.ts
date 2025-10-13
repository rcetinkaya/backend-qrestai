/**
 * Admin Routes Index
 * All admin panel routes
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import organizationsRoutes from './organizations.routes.js';
import statsRoutes from './stats.routes.js';
import menusRoutes from './menus.routes.js';
import usersRoutes from './users.routes.js';
import subscriptionPlansRoutes from './subscriptionPlans.routes.js';
import creditPackagesRoutes from './creditPackages.routes.js';

const router = Router();

// All admin routes require authentication
// TODO: Add admin-specific authentication/authorization in production
router.use(authenticate);

// Admin routes
router.use('/organizations', organizationsRoutes);
router.use('/stats', statsRoutes);
router.use('/menus', menusRoutes);
router.use('/users', usersRoutes);
router.use('/subscription-plans', subscriptionPlansRoutes);
router.use('/credit-packages', creditPackagesRoutes);

export default router;
