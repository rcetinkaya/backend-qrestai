/**
 * Test Database Helpers
 */

import { prisma } from '../../config/database.js';
import { PasswordUtils } from '../../utils/password.js';
import { Plan, Role, OrgStatus } from '@prisma/client';

export class TestDb {
  /**
   * Clean all tables
   */
  static async cleanup() {
    await prisma.$transaction([
      prisma.activityLog.deleteMany(),
      prisma.passwordResetToken.deleteMany(),
      prisma.verificationToken.deleteMany(),
      prisma.session.deleteMany(),
      prisma.refreshToken.deleteMany(),
      prisma.menuItem.deleteMany(),
      prisma.category.deleteMany(),
      prisma.qrCode.deleteMany(),
      prisma.menu.deleteMany(),
      prisma.themeSetting.deleteMany(),
      prisma.userOrganization.deleteMany(),
      prisma.user.deleteMany(),
      prisma.organization.deleteMany(),
    ]);
  }

  /**
   * Create test user
   */
  static async createUser(data?: {
    email?: string;
    password?: string;
    name?: string;
  }) {
    const hashedPassword = await PasswordUtils.hash(data?.password || 'password123');

    return prisma.user.create({
      data: {
        email: data?.email || `test-${Date.now()}@example.com`,
        password: hashedPassword,
        name: data?.name || 'Test User',
        emailVerified: true,
      },
    });
  }

  /**
   * Create test organization
   */
  static async createOrganization(data?: {
    name?: string;
    slug?: string;
    plan?: Plan;
    status?: OrgStatus;
  }) {
    return prisma.organization.create({
      data: {
        name: data?.name || `Test Org ${Date.now()}`,
        slug: data?.slug || `test-org-${Date.now()}`,
        plan: data?.plan || Plan.FREE,
        status: data?.status || OrgStatus.ACTIVE,
        aiCredits: 100,
      },
    });
  }

  /**
   * Link user to organization
   */
  static async linkUserToOrg(userId: string, orgId: string, role: Role = Role.OWNER) {
    return prisma.userOrganization.create({
      data: {
        userId,
        orgId,
        role,
      },
    });
  }

  /**
   * Create test menu
   */
  static async createMenu(orgId: string, data?: {
    name?: string;
    locale?: string;
    isActive?: boolean;
  }) {
    return prisma.menu.create({
      data: {
        orgId,
        name: data?.name || 'Test Menu',
        locale: data?.locale || 'tr',
        isActive: data?.isActive ?? true,
      },
    });
  }

  /**
   * Create test category
   */
  static async createCategory(menuId: string, data?: {
    name?: string;
    description?: string;
    sortOrder?: number;
  }) {
    return prisma.category.create({
      data: {
        menuId,
        name: data?.name || 'Test Category',
        description: data?.description,
        sortOrder: data?.sortOrder ?? 0,
      },
    });
  }

  /**
   * Create test menu item
   */
  static async createMenuItem(categoryId: string, data?: {
    name?: string;
    price?: number;
    isAvailable?: boolean;
  }) {
    return prisma.menuItem.create({
      data: {
        categoryId,
        name: data?.name || 'Test Item',
        price: data?.price ?? 10.0,
        isAvailable: data?.isAvailable ?? true,
        sortOrder: 0,
      },
    });
  }

  /**
   * Create QR code for menu
   */
  static async createQrCode(menuId: string, data?: {
    shortId?: string;
    styleJson?: any;
  }) {
    return prisma.qrCode.create({
      data: {
        menuId,
        shortId: data?.shortId || `qr-${Date.now()}`,
        styleJson: data?.styleJson || {
          foreground: '#000000',
          background: '#FFFFFF',
          errorCorrection: 'M',
        },
      },
    });
  }

  /**
   * Create theme settings
   */
  static async createTheme(orgId: string, data?: {
    themeKey?: string;
    primary?: string;
    accent?: string;
  }) {
    return prisma.themeSetting.create({
      data: {
        orgId,
        themeKey: data?.themeKey || 'default',
        primary: data?.primary || '#3B82F6',
        accent: data?.accent || '#10B981',
      },
    });
  }

  /**
   * Generate test JWT token
   */
  static async generateToken(userId: string) {
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    return token;
  }

  /**
   * Create complete test setup (org + user + menu + qr + theme + token)
   */
  static async createTestSetup() {
    const org = await this.createOrganization();
    const user = await this.createUser();
    const userOrg = await this.linkUserToOrg(user.id, org.id, Role.OWNER);
    const menu = await this.createMenu(org.id);
    const category = await this.createCategory(menu.id);
    const item = await this.createMenuItem(category.id);
    const qrCode = await this.createQrCode(menu.id);
    const theme = await this.createTheme(org.id);
    const token = await this.generateToken(user.id);

    return { org, user, userOrg, menu, category, item, qrCode, theme, token };
  }
}
