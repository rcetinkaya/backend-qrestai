/**
 * Public Routes Index
 * Routes that don't require authentication
 */

import { Router } from 'express';
import menuRoutes from './menu.routes.js';

const router = Router();

// Public routes
router.use('/menu', menuRoutes);

export default router;
