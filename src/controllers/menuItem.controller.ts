/**
 * MenuItem Controller
 */

import { Request, Response } from 'express';
import { MenuItemService } from '../services/menuItem.service.js';
import { ResponseFormatter } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class MenuItemController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, categoryId } = req.params;
    const orgId = req.user!.orgId!;

    const items = await MenuItemService.getItems(menuId, categoryId, orgId);

    return ResponseFormatter.success(res, items);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, categoryId, itemId } = req.params;
    const orgId = req.user!.orgId!;

    const item = await MenuItemService.getItemById(menuId, categoryId, itemId, orgId);

    return ResponseFormatter.success(res, item);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, categoryId } = req.params;
    const orgId = req.user!.orgId!;
    const data = req.body;

    const item = await MenuItemService.createItem(menuId, categoryId, orgId, data);

    return ResponseFormatter.created(res, item, 'Menu item created successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, categoryId, itemId } = req.params;
    const orgId = req.user!.orgId!;
    const data = req.body;

    const item = await MenuItemService.updateItem(menuId, categoryId, itemId, orgId, data);

    return ResponseFormatter.success(res, item, 'Menu item updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, categoryId, itemId } = req.params;
    const orgId = req.user!.orgId!;

    await MenuItemService.deleteItem(menuId, categoryId, itemId, orgId);

    return ResponseFormatter.noContent(res);
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, categoryId } = req.params;
    const orgId = req.user!.orgId!;
    const { itemIds } = req.body;

    await MenuItemService.reorderItems(menuId, categoryId, orgId, itemIds);

    return ResponseFormatter.success(res, null, 'Items reordered successfully');
  });
}
