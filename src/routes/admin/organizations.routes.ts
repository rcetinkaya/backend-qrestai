/**
 * Admin Organizations Routes
 * System administration for organizations
 */

import { Router } from 'express';
import { AdminController } from '../../controllers/admin.controller.js';
import { validate } from '../../middleware/validate.js';
import { paginationSchema } from '../../validators/common.validator.js';

const router = Router();

/**
 * @swagger
 * /admin/organizations:
 *   get:
 *     tags: [Admin - Organizations]
 *     summary: Get all organizations
 *     description: Get paginated list of all organizations (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Organizations retrieved successfully
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
 *                         $ref: '#/components/schemas/Organization'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', validate(paginationSchema, 'query'), AdminController.getAllOrganizations);

/**
 * @swagger
 * /admin/organizations/{orgId}:
 *   get:
 *     tags: [Admin - Organizations]
 *     summary: Get organization by ID
 *     description: Get single organization details (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organization retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 *   put:
 *     tags: [Admin - Organizations]
 *     summary: Update organization
 *     description: Update organization details (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               plan:
 *                 type: string
 *                 enum: [FREE, BASIC, PREMIUM, ENTERPRISE]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, SUSPENDED, INACTIVE]
 *               aiCredits:
 *                 type: number
 *     responses:
 *       200:
 *         description: Organization updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 */
router.get('/:orgId', AdminController.getOrganizationById);
router.put('/:orgId', AdminController.updateOrganization);

/**
 * @swagger
 * /admin/organizations/{orgId}/status:
 *   patch:
 *     tags: [Admin - Organizations]
 *     summary: Update organization status
 *     description: Update organization status (ACTIVE, SUSPENDED, DELETED)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, SUSPENDED, DELETED]
 *                 example: SUSPENDED
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 */
router.patch('/:orgId/status', AdminController.updateOrgStatus);

/**
 * @swagger
 * /admin/organizations/{orgId}/plan:
 *   patch:
 *     tags: [Admin - Organizations]
 *     summary: Update organization plan
 *     description: Update organization subscription plan (FREE, PRO, BUSINESS)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plan
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [FREE, PRO, BUSINESS]
 *                 example: PRO
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Organization'
 */
router.patch('/:orgId/plan', AdminController.updateOrgPlan);

export default router;
