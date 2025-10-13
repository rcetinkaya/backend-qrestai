/**
 * Theme Routes
 */

import { Router } from 'express';
import { ThemeController } from '../../controllers/theme.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', ThemeController.get);
router.put('/', requireRole(Role.ADMIN), ThemeController.update);

export default router;
