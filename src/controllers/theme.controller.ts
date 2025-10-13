/**
 * Theme Controller
 */

import { Request, Response } from 'express';
import { ThemeService } from '../services/theme.service.js';
import { ResponseFormatter } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class ThemeController {
  static get = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.orgId!;

    const theme = await ThemeService.getTheme(orgId);

    return ResponseFormatter.success(res, theme);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.orgId!;
    const data = req.body;

    const theme = await ThemeService.updateTheme(orgId, data);

    return ResponseFormatter.success(res, theme, 'Theme updated successfully');
  });
}
