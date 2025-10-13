/**
 * Standalone Routes for Direct Entity Access
 * These routes allow accessing categories and items directly by their ID
 * without needing the full menu hierarchy in the URL
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ResponseFormatter } from '../../utils/ApiResponse.js';
import { Role } from '@prisma/client';
import { prisma } from '../../config/database.js';

const router = Router();

router.use(authenticate);

/**
 * GET /api/categories/:id
 * Get a category by ID with its items
 */
router.get('/categories/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orgId = req.user!.orgId!;

  const category = await prisma.category.findFirst({
    where: {
      id,
      menu: { orgId },
    },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!category) {
    return ResponseFormatter.notFound(res, 'Category not found');
  }

  return ResponseFormatter.success(res, category);
}));

/**
 * PUT /api/categories/:id
 * Update a category by ID
 */
router.put('/categories/:id', requireRole(Role.EDITOR), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orgId = req.user!.orgId!;
  const { name, description, sortOrder } = req.body;

  // Check if category belongs to user's organization
  const category = await prisma.category.findFirst({
    where: {
      id,
      menu: { orgId },
    },
  });

  if (!category) {
    return ResponseFormatter.notFound(res, 'Category not found');
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name,
      description,
      sortOrder,
    },
  });

  return ResponseFormatter.success(res, updated, 'Category updated successfully');
}));

/**
 * DELETE /api/categories/:id
 * Delete a category by ID
 */
router.delete('/categories/:id', requireRole(Role.ADMIN), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orgId = req.user!.orgId!;

  // Check if category belongs to user's organization
  const category = await prisma.category.findFirst({
    where: {
      id,
      menu: { orgId },
    },
  });

  if (!category) {
    return ResponseFormatter.notFound(res, 'Category not found');
  }

  await prisma.category.delete({
    where: { id },
  });

  return ResponseFormatter.noContent(res);
}));

/**
 * POST /api/categories/:id/items
 * Create a new item in a category
 */
router.post('/categories/:id/items', requireRole(Role.EDITOR), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orgId = req.user!.orgId!;
  const { name, description, price, imageUrl, isAvailable, sortOrder } = req.body;

  // Check if category belongs to user's organization
  const category = await prisma.category.findFirst({
    where: {
      id,
      menu: { orgId },
    },
  });

  if (!category) {
    return ResponseFormatter.notFound(res, 'Category not found');
  }

  const item = await prisma.menuItem.create({
    data: {
      name,
      description,
      price,
      imageUrl,
      isAvailable: isAvailable ?? true,
      sortOrder: sortOrder ?? 0,
      categoryId: id,
    },
  });

  return ResponseFormatter.created(res, item, 'Item created successfully');
}));

/**
 * PUT /api/items/:id
 * Update an item by ID
 */
router.put('/items/:id', requireRole(Role.EDITOR), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orgId = req.user!.orgId!;

  // Check if item belongs to user's organization
  const item = await prisma.menuItem.findFirst({
    where: {
      id,
      category: {
        menu: { orgId },
      },
    },
  });

  if (!item) {
    return ResponseFormatter.notFound(res, 'Item not found');
  }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: req.body,
  });

  return ResponseFormatter.success(res, updated, 'Item updated successfully');
}));

/**
 * DELETE /api/items/:id
 * Delete an item by ID
 */
router.delete('/items/:id', requireRole(Role.EDITOR), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const orgId = req.user!.orgId!;

  // Check if item belongs to user's organization
  const item = await prisma.menuItem.findFirst({
    where: {
      id,
      category: {
        menu: { orgId },
      },
    },
  });

  if (!item) {
    return ResponseFormatter.notFound(res, 'Item not found');
  }

  await prisma.menuItem.delete({
    where: { id },
  });

  return ResponseFormatter.noContent(res);
}));

export default router;
