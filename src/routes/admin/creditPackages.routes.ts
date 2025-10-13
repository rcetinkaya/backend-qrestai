/**
 * Admin Credit Packages Routes
 * Manage AI credit add-on packages
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/authorize.js';
import { ResponseFormatter } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { prisma } from '../../config/database.js';
import { z } from 'zod';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Validation schema
const packageSchema = z.object({
  name: z.string().min(1).max(100),
  credits: z.number().int().min(1),
  price: z.number().min(0),
  discount: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

/**
 * GET /admin/credit-packages
 * List all credit packages
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { active } = req.query;

    const where: any = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const packages = await prisma.creditPackage.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { credits: 'asc' }],
    });

    return ResponseFormatter.success(res, packages);
  })
);

/**
 * GET /admin/credit-packages/:id
 * Get single credit package
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const pkg = await prisma.creditPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      return ResponseFormatter.notFound(res, 'Credit package not found');
    }

    return ResponseFormatter.success(res, pkg);
  })
);

/**
 * POST /admin/credit-packages
 * Create new credit package
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const validatedData = packageSchema.parse(req.body);

    const pkg = await prisma.creditPackage.create({
      data: validatedData,
    });

    return ResponseFormatter.created(res, pkg, 'Credit package created successfully');
  })
);

/**
 * PUT /admin/credit-packages/:id
 * Update credit package
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validatedData = packageSchema.partial().parse(req.body);

    // Check if package exists
    const existingPackage = await prisma.creditPackage.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return ResponseFormatter.notFound(res, 'Credit package not found');
    }

    const pkg = await prisma.creditPackage.update({
      where: { id },
      data: validatedData,
    });

    return ResponseFormatter.success(res, pkg, 'Credit package updated successfully');
  })
);

/**
 * DELETE /admin/credit-packages/:id
 * Delete credit package
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if package exists
    const pkg = await prisma.creditPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      return ResponseFormatter.notFound(res, 'Credit package not found');
    }

    await prisma.creditPackage.delete({
      where: { id },
    });

    return ResponseFormatter.success(res, null, 'Credit package deleted successfully');
  })
);

/**
 * PATCH /admin/credit-packages/:id/toggle-active
 * Toggle package active status
 */
router.patch(
  '/:id/toggle-active',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const pkg = await prisma.creditPackage.findUnique({
      where: { id },
    });

    if (!pkg) {
      return ResponseFormatter.notFound(res, 'Credit package not found');
    }

    const updated = await prisma.creditPackage.update({
      where: { id },
      data: { isActive: !pkg.isActive },
    });

    return ResponseFormatter.success(res, updated, 'Package status toggled successfully');
  })
);

export default router;
