/**
 * Theme Service
 */

import { prisma } from '../config/database.js';

export class ThemeService {
  static async getTheme(orgId: string) {
    let theme = await prisma.themeSetting.findUnique({
      where: { orgId },
    });

    // Create default theme if doesn't exist
    if (!theme) {
      theme = await prisma.themeSetting.create({
        data: {
          orgId,
          themeKey: 'default',
        },
      });
    }

    return theme;
  }

  static async updateTheme(
    orgId: string,
    data: { themeKey?: string; primary?: string; accent?: string; customCss?: string }
  ) {
    const existing = await prisma.themeSetting.findUnique({
      where: { orgId },
    });

    if (existing) {
      return prisma.themeSetting.update({
        where: { orgId },
        data,
      });
    }

    return prisma.themeSetting.create({
      data: {
        orgId,
        ...data,
      },
    });
  }
}
