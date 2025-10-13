/**
 * Admin Subscription Plans Routes
 * Manage subscription plans with features and pricing
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
const planSchema = z.object({
  name: z.string().min(1).max(50),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().min(0),
  currency: z.string().default('USD'),
  maxMenus: z.number().int().default(-1),
  maxItems: z.number().int().default(-1),
  maxTeamMembers: z.number().int().default(-1),
  aiCreditsMonthly: z.number().int().min(0).default(0),
  hasQrCustomization: z.boolean().default(false),
  hasAdvancedAnalytics: z.boolean().default(false),
  hasApiAccess: z.boolean().default(false),
  hasWhiteLabel: z.boolean().default(false),
  hasPrioritySupport: z.boolean().default(false),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  features: z.any().optional(),
  metadata: z.any().optional(),
});

/**
 * GET /admin/subscription-plans
 * List all subscription plans
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { active, public: isPublic } = req.query;

    const where: any = {};
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    if (isPublic !== undefined) {
      where.isPublic = isPublic === 'true';
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
    });

    return ResponseFormatter.success(res, plans);
  })
);

/**
 * GET /admin/subscription-plans/:id
 * Get single subscription plan
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return ResponseFormatter.notFound(res, 'Subscription plan not found');
    }

    return ResponseFormatter.success(res, plan);
  })
);

/**
 * POST /admin/subscription-plans
 * Create new subscription plan
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const validatedData = planSchema.parse(req.body);

    // Check if name already exists
    const existing = await prisma.subscriptionPlan.findUnique({
      where: { name: validatedData.name },
    });

    if (existing) {
      return ResponseFormatter.error(res, 'Duplicate Name', 'Plan name already exists', 400);
    }

    const plan = await prisma.subscriptionPlan.create({
      data: validatedData,
    });

    return ResponseFormatter.created(res, plan, 'Subscription plan created successfully');
  })
);

/**
 * PUT /admin/subscription-plans/:id
 * Update subscription plan
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validatedData = planSchema.partial().parse(req.body);

    // Check if plan exists
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return ResponseFormatter.notFound(res, 'Subscription plan not found');
    }

    // If changing name, check uniqueness
    if (validatedData.name && validatedData.name !== existingPlan.name) {
      const nameExists = await prisma.subscriptionPlan.findUnique({
        where: { name: validatedData.name },
      });

      if (nameExists) {
        return ResponseFormatter.error(res, 'Duplicate Name', 'Plan name already exists', 400);
      }
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: validatedData,
    });

    return ResponseFormatter.success(res, plan, 'Subscription plan updated successfully');
  })
);

/**
 * DELETE /admin/subscription-plans/:id
 * Delete subscription plan
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if plan exists
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return ResponseFormatter.notFound(res, 'Subscription plan not found');
    }

    // Check if any organizations are using this plan
    const orgsUsingPlan = await prisma.organization.count({
      where: { plan: plan.name as any },
    });

    if (orgsUsingPlan > 0) {
      return ResponseFormatter.error(
        res,
        `Cannot delete plan. ${orgsUsingPlan} organization(s) are currently using this plan.`,
        400
      );
    }

    await prisma.subscriptionPlan.delete({
      where: { id },
    });

    return ResponseFormatter.success(res, null, 'Subscription plan deleted successfully');
  })
);

/**
 * PATCH /admin/subscription-plans/:id/toggle-active
 * Toggle plan active status
 */
router.patch(
  '/:id/toggle-active',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return ResponseFormatter.notFound(res, 'Subscription plan not found');
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });

    return ResponseFormatter.success(res, updated, 'Plan status toggled successfully');
  })
);

/**
 * PATCH /admin/subscription-plans/:id/toggle-public
 * Toggle plan public visibility
 */
router.patch(
  '/:id/toggle-public',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      return ResponseFormatter.notFound(res, 'Subscription plan not found');
    }

    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data: { isPublic: !plan.isPublic },
    });

    return ResponseFormatter.success(res, updated, 'Plan visibility toggled successfully');
  })
);

export default router;
