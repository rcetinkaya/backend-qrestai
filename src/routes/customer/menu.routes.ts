/**
 * Menu Routes
 */

import { Router } from 'express';
import { MenuController } from '../../controllers/menu.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import { createMenuSchema, updateMenuSchema, menuIdSchema } from '../../validators/menu.validator.js';
import { paginationSchema } from '../../validators/common.validator.js';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /menus:
 *   get:
 *     tags: [Menus]
 *     summary: Get all menus
 *     description: Get paginated list of menus for the organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for menu name
 *     responses:
 *       200:
 *         description: Menus retrieved successfully
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
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Menu'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', validate(paginationSchema, 'query'), MenuController.getAll);

/**
 * @swagger
 * /menus/{id}:
 *   get:
 *     tags: [Menus]
 *     summary: Get menu by ID
 *     description: Get menu details with categories and items
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu ID
 *     responses:
 *       200:
 *         description: Menu retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validate(menuIdSchema, 'params'), MenuController.getById);

/**
 * @swagger
 * /menus:
 *   post:
 *     tags: [Menus]
 *     summary: Create new menu
 *     description: Create a new menu (requires EDITOR role)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMenuRequest'
 *     responses:
 *       201:
 *         description: Menu created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', requireRole(Role.EDITOR), validate(createMenuSchema), MenuController.create);

/**
 * @swagger
 * /menus/{id}:
 *   put:
 *     tags: [Menus]
 *     summary: Update menu
 *     description: Update menu details (requires EDITOR role)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMenuRequest'
 *     responses:
 *       200:
 *         description: Menu updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', requireRole(Role.EDITOR), validate(menuIdSchema, 'params'), validate(updateMenuSchema), MenuController.update);

/**
 * @swagger
 * /menus/{id}:
 *   delete:
 *     tags: [Menus]
 *     summary: Delete menu
 *     description: Delete a menu (requires ADMIN role)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu ID
 *     responses:
 *       204:
 *         description: Menu deleted successfully
 *       403:
 *         description: Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Menu not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', requireRole(Role.ADMIN), validate(menuIdSchema, 'params'), MenuController.delete);

/**
 * @swagger
 * /menus/{id}/duplicate:
 *   post:
 *     tags: [Menus]
 *     summary: Duplicate menu
 *     description: Duplicate menu with all categories and items (requires EDITOR role)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu ID
 *     responses:
 *       201:
 *         description: Menu duplicated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *       404:
 *         description: Menu not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/duplicate', requireRole(Role.EDITOR), validate(menuIdSchema, 'params'), MenuController.duplicate);

/**
 * @swagger
 * /menus/{id}/preview-token:
 *   post:
 *     tags: [Menus]
 *     summary: Generate preview token
 *     description: Generate a temporary token for menu preview (24h validity)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Menu ID
 *     responses:
 *       200:
 *         description: Preview token generated successfully
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
 *                     token:
 *                       type: string
 *                       description: JWT token for preview
 *                     expiresIn:
 *                       type: string
 *                       example: "24h"
 *                     previewUrl:
 *                       type: string
 *                       example: "/preview/menu123?token=xxx"
 *       404:
 *         description: Menu not found
 */
router.post('/:id/preview-token', validate(menuIdSchema, 'params'), MenuController.generatePreviewToken);

export default router;
