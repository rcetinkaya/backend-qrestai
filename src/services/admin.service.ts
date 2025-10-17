/**
 * Admin Service
 * System administration functions
 */

import { prisma } from '../config/database.js';
import { PaginationUtils } from '../utils/pagination.js';
import { PaginationParams } from '../types/api.js';
import { OrgStatus, Plan } from '@prisma/client';

export class AdminService {
  /**
   * Get all organizations (admin only)
   */
  static async getAllOrganizations(params?: PaginationParams) {
    const { skip, take } = PaginationUtils.getPaginationParams(params || {});

    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        skip,
        take,
        include: {
          _count: {
            select: {
              users: true,
              menus: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.organization.count(),
    ]);

    return PaginationUtils.formatResponse(orgs, total, params || {});
  }

  /**
   * Get single organization by ID (admin only)
   */
  static async getOrganizationById(orgId: string) {
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            users: true,
            menus: true,
          },
        },
      },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    return org;
  }

  /**
   * Update organization (admin only)
   */
  static async updateOrganization(orgId: string, data: {
    name?: string;
    slug?: string;
    plan?: Plan;
    status?: OrgStatus;
    aiCredits?: number;
  }) {
    const org = await prisma.organization.update({
      where: { id: orgId },
      data,
    });

    return org;
  }

  /**
   * Update organization status
   */
  static async updateOrganizationStatus(orgId: string, status: OrgStatus) {
    return prisma.organization.update({
      where: { id: orgId },
      data: { status },
    });
  }

  /**
   * Update organization plan
   */
  static async updateOrganizationPlan(orgId: string, plan: Plan) {
    return prisma.organization.update({
      where: { id: orgId },
      data: { plan },
    });
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats() {
    const [
      totalOrgs,
      activeOrgs,
      totalUsers,
      totalMenus,
      recentSignups,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: OrgStatus.ACTIVE } }),
      prisma.user.count(),
      prisma.menu.count(),
      prisma.organization.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalOrganizations: totalOrgs,
      activeOrganizations: activeOrgs,
      totalUsers,
      totalMenus,
      recentSignups,
    };
  }
}
