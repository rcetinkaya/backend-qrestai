/**
 * Organization Routes
 */

import { Router } from 'express';
import { OrganizationController } from '../../controllers/organization.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { requireOwner } from '../../middleware/authorize.js';

const router = Router();

router.use(authenticate);

router.get('/', OrganizationController.get);
router.patch('/', requireOwner, OrganizationController.update);
router.get('/members', OrganizationController.getMembers);
router.patch('/members/:userId/role', requireOwner, OrganizationController.updateMemberRole);
router.delete('/members/:userId', OrganizationController.removeMember);

// Routes with orgId parameter (validates user has access to the org)
router.get('/:orgId', OrganizationController.get);
router.put('/:orgId', requireOwner, OrganizationController.update);

export default router;
