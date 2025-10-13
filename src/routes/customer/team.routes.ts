/**
 * Team Management Routes
 * Manage team members and their roles
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { prisma } from '../../config/database.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../types/errors.js';
import { Role } from '@prisma/client';

const router = Router();

// Get team members
router.get('/:orgId/members', authenticate, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user!.userId;

    // Check if user belongs to organization
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!userOrg) {
      throw new AuthorizationError('You do not have access to this organization');
    }

    const members = await prisma.userOrganization.findMany({
      where: { orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.createdAt,
        user: m.user,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// Invite team member (creates pending invitation)
router.post('/:orgId/invite', authenticate, async (req, res, next) => {
  try {
    const { orgId } = req.params;
    const userId = req.user!.userId;
    const { email, role } = req.body;

    if (!email || !role) {
      throw new ValidationError('Email and role are required');
    }

    // Only valid roles
    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      throw new ValidationError('Invalid role. Must be ADMIN, EDITOR, or VIEWER');
    }

    // Check if requester has permission (OWNER or ADMIN)
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!userOrg || !['OWNER', 'ADMIN'].includes(userOrg.role)) {
      throw new AuthorizationError('Only owners and admins can invite members');
    }

    // Check if user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      throw new NotFoundError('User with this email does not exist');
    }

    // Check if already a member
    const existingMember = await prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId: invitedUser.id,
          orgId,
        },
      },
    });

    if (existingMember) {
      throw new ValidationError('User is already a member of this organization');
    }

    // Add user to organization
    const newMember = await prisma.userOrganization.create({
      data: {
        userId: invitedUser.id,
        orgId,
        role: role as Role,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        orgId,
        userId,
        action: 'TEAM_MEMBER_ADDED',
        details: {
          invitedEmail: email,
          role,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: newMember.id,
        role: newMember.role,
        joinedAt: newMember.createdAt,
        user: newMember.user,
      },
      message: 'Team member added successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Update team member role
router.put('/:orgId/members/:memberId', authenticate, async (req, res, next) => {
  try {
    const { orgId, memberId } = req.params;
    const userId = req.user!.userId;
    const { role } = req.body;

    if (!role) {
      throw new ValidationError('Role is required');
    }

    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(role)) {
      throw new ValidationError('Invalid role');
    }

    // Check if requester has permission
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!userOrg || !['OWNER', 'ADMIN'].includes(userOrg.role)) {
      throw new AuthorizationError('Only owners and admins can update member roles');
    }

    // Get member to update
    const member = await prisma.userOrganization.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.orgId !== orgId) {
      throw new NotFoundError('Team member not found');
    }

    // Cannot change owner role
    if (member.role === 'OWNER') {
      throw new ValidationError('Cannot change owner role');
    }

    // Update role
    const updated = await prisma.userOrganization.update({
      where: { id: memberId },
      data: { role: role as Role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        orgId,
        userId,
        action: 'TEAM_MEMBER_ROLE_UPDATED',
        details: {
          memberEmail: member.user.email,
          oldRole: member.role,
          newRole: role,
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: updated.id,
        role: updated.role,
        user: updated.user,
      },
      message: 'Member role updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Remove team member
router.delete('/:orgId/members/:memberId', authenticate, async (req, res, next) => {
  try {
    const { orgId, memberId } = req.params;
    const userId = req.user!.userId;

    // Check if requester has permission
    const userOrg = await prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });

    if (!userOrg || !['OWNER', 'ADMIN'].includes(userOrg.role)) {
      throw new AuthorizationError('Only owners and admins can remove members');
    }

    // Get member to remove
    const member = await prisma.userOrganization.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member || member.orgId !== orgId) {
      throw new NotFoundError('Team member not found');
    }

    // Cannot remove owner
    if (member.role === 'OWNER') {
      throw new ValidationError('Cannot remove organization owner');
    }

    // Cannot remove yourself
    if (member.userId === userId) {
      throw new ValidationError('Cannot remove yourself. Transfer ownership first');
    }

    // Remove member
    await prisma.userOrganization.delete({
      where: { id: memberId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        orgId,
        userId,
        action: 'TEAM_MEMBER_REMOVED',
        details: {
          memberEmail: member.user.email,
          role: member.role,
        },
      },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
