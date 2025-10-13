/**
 * QrCode Service
 */

import { prisma } from '../config/database.js';
import { NotFoundError } from '../types/errors.js';
import { QRCodeGenerator } from '../utils/qrGenerator.js';

export class QrCodeService {
  static async getQrCode(menuId: string, orgId: string) {
    const menu = await prisma.menu.findFirst({
      where: { id: menuId, orgId },
      include: { qr: true },
    });

    if (!menu) {
      throw new NotFoundError('Menu');
    }

    return menu.qr;
  }

  static async generateQrCode(menuId: string, orgId: string, style?: Record<string, unknown>) {
    const menu = await prisma.menu.findFirst({
      where: { id: menuId, orgId },
    });

    if (!menu) {
      throw new NotFoundError('Menu');
    }

    // Check if QR already exists
    const existing = await prisma.qrCode.findUnique({
      where: { menuId },
    });

    if (existing) {
      return existing;
    }

    // Generate short ID
    const shortId = QRCodeGenerator.generateShortId();

    return prisma.qrCode.create({
      data: {
        menuId,
        shortId,
        styleJson: (style || {}) as any,
      },
    });
  }

  static async updateQrStyle(menuId: string, orgId: string, style: Record<string, unknown>) {
    const qr = await prisma.qrCode.findFirst({
      where: {
        menuId,
        menu: { orgId },
      },
    });

    if (!qr) {
      throw new NotFoundError('QR Code');
    }

    return prisma.qrCode.update({
      where: { id: qr.id },
      data: { styleJson: style as any },
    });
  }
}
