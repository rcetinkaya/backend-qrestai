/**
 * QrCode Controller
 */

import { Request, Response } from 'express';
import { QrCodeService } from '../services/qrcode.service.js';
import { ResponseFormatter } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import QRCode from 'qrcode';

export class QrCodeController {
  static get = asyncHandler(async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const orgId = req.user!.orgId!;

    const qr = await QrCodeService.getQrCode(menuId, orgId);

    return ResponseFormatter.success(res, qr);
  });

  static generate = asyncHandler(async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const orgId = req.user!.orgId!;
    const { style } = req.body;

    const qr = await QrCodeService.generateQrCode(menuId, orgId, style);

    return ResponseFormatter.created(res, qr, 'QR code generated successfully');
  });

  static updateStyle = asyncHandler(async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const orgId = req.user!.orgId!;
    const { style } = req.body;

    const qr = await QrCodeService.updateQrStyle(menuId, orgId, style);

    return ResponseFormatter.success(res, qr, 'QR code style updated');
  });

  static download = asyncHandler(async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const orgId = req.user!.orgId!;
    const format = (req.query.format as string) || 'png';

    const qrData = await QrCodeService.getQrCode(menuId, orgId);

    // Generate QR code URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrUrl = `${frontendUrl}/m/${qrData.shortId}`;

    // QR code options
    const options: any = {
      errorCorrectionLevel: 'M',
      type: format === 'svg' ? 'svg' : 'image/png',
      quality: 0.92,
      margin: 1,
      width: 512,
    };

    // Apply custom styles if available
    if (qrData.styleJson) {
      const style = qrData.styleJson as any;
      if (style.foreground) options.color = { dark: style.foreground };
      if (style.background) options.color = { ...options.color, light: style.background };
    }

    if (format === 'svg') {
      const svg = await QRCode.toString(qrUrl, { ...options, type: 'svg' });
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${qrData.shortId}.svg"`);
      res.send(svg);
    } else {
      const buffer = await QRCode.toBuffer(qrUrl, options);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${qrData.shortId}.png"`);
      res.send(buffer);
    }
  });

  static preview = asyncHandler(async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const orgId = req.user!.orgId!;

    const qrData = await QrCodeService.getQrCode(menuId, orgId);

    // Generate QR code URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrUrl = `${frontendUrl}/m/${qrData.shortId}`;

    // QR code options
    const options: any = {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300,
    };

    // Apply custom styles
    if (qrData.styleJson) {
      const style = qrData.styleJson as any;
      if (style.foreground) options.color = { dark: style.foreground };
      if (style.background) options.color = { ...options.color, light: style.background };
    }

    const dataUrl = await QRCode.toDataURL(qrUrl, options);

    return ResponseFormatter.success(res, {
      dataUrl,
      url: qrUrl,
      shortId: qrData.shortId,
    });
  });
}
