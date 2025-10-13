/**
 * QrCode Routes
 */

import { Router } from 'express';
import { QrCodeController } from '../../controllers/qrcode.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/:menuId/qr', QrCodeController.get);
router.get('/:menuId/qr/preview', QrCodeController.preview);
router.get('/:menuId/qr/download', QrCodeController.download);
router.post('/:menuId/qr', requireRole(Role.EDITOR), QrCodeController.generate);
router.patch('/:menuId/qr', requireRole(Role.EDITOR), QrCodeController.updateStyle);

export default router;
