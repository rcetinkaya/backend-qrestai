/**
 * Organization Service
 */

import { prisma } from '../config/database.js';
import { NotFoundError, AuthorizationError } from '../types/errors.js';
import { Role } from '@prisma/client';

export class OrganizationService {
  static async getOrganization(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        theme: true,
        _count: {
          select: {
            users: true,
            menus: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundError('Organization');
    }

    return org;
  }

  static async updateOrganization(orgId: string, data: { name?: string; slug?: string }) {
    return prisma.organization.update({
      where: { id: orgId },
      data,
    });
  }

  static async getMembers(orgId: string) {
    const members = await prisma.userOrganization.findMany({
      where: { orgId },
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

    return members.map(m => ({
      ...m.user,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  static async updateMemberRole(orgId: string, userId: string, requesterId: string, role: Role) {
    // Check if requester is owner
    const requester = await prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId: requesterId,
          orgId,
        },
      },
    });

    if (!requester || requester.role !== Role.OWNER) {
      throw new AuthorizationError('Only owner can change roles');
    }

    return prisma.userOrganization.update({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
      data: { role },
    });
  }

  static async removeMember(orgId: string, userId: string, requesterId: string) {
    // Check if requester is owner or admin
    const requester = await prisma.userOrganization.findUnique({
      where: {
        userId_orgId: {
          userId: requesterId,
          orgId,
        },
      },
    });

    if (!requester || (requester.role !== Role.OWNER && requester.role !== Role.ADMIN)) {
      throw new AuthorizationError('Insufficient permissions');
    }

    await prisma.userOrganization.delete({
      where: {
        userId_orgId: {
          userId,
          orgId,
        },
      },
    });
  }
}
