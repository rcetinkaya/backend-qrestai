/**
 * Menu Controller
 */

import { Request, Response } from 'express';
import { MenuService } from '../services/menu.service.js';
import { ResponseFormatter } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PaginationParams } from '../types/api.js';

export class MenuController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.orgId!;
    const params: PaginationParams = req.query;

    const result = await MenuService.getMenus(orgId, params);

    return ResponseFormatter.success(res, result);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const orgId = req.user!.orgId!;

    const menu = await MenuService.getMenuById(id, orgId);

    return ResponseFormatter.success(res, menu);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.orgId!;
    const data = req.body;

    const menu = await MenuService.createMenu(orgId, data);

    return ResponseFormatter.created(res, menu, 'Menu created successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const orgId = req.user!.orgId!;
    const data = req.body;

    const menu = await MenuService.updateMenu(id, orgId, data);

    return ResponseFormatter.success(res, menu, 'Menu updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const orgId = req.user!.orgId!;

    await MenuService.deleteMenu(id, orgId);

    return ResponseFormatter.noContent(res);
  });

  static duplicate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const orgId = req.user!.orgId!;

    const menu = await MenuService.duplicateMenu(id, orgId);

    return ResponseFormatter.created(res, menu, 'Menu duplicated successfully');
  });
}
