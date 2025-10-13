/**
 * Category Controller
 */

import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service.js';
import { ResponseFormatter } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class CategoryController {
  static getAll = asyncHandler(async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const orgId = req.user!.orgId!;

    const categories = await CategoryService.getCategories(menuId, orgId);

    return ResponseFormatter.success(res, categories);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, categoryId } = req.params;
    const orgId = req.user!.orgId!;

    const category = await CategoryService.getCategoryById(menuId, categoryId, orgId);

    return ResponseFormatter.success(res, category);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const orgId = req.user!.orgId!;
    const data = req.body;

    const category = await CategoryService.createCategory(menuId, orgId, data);

    return ResponseFormatter.created(res, category, 'Category created successfully');
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, categoryId } = req.params;
    const orgId = req.user!.orgId!;
    const data = req.body;

    const category = await CategoryService.updateCategory(menuId, categoryId, orgId, data);

    return ResponseFormatter.success(res, category, 'Category updated successfully');
  });

  static delete = asyncHandler(async (req: Request, res: Response) => {
    const { menuId, categoryId } = req.params;
    const orgId = req.user!.orgId!;

    await CategoryService.deleteCategory(menuId, categoryId, orgId);

    return ResponseFormatter.noContent(res);
  });

  static reorder = asyncHandler(async (req: Request, res: Response) => {
    const { menuId } = req.params;
    const orgId = req.user!.orgId!;
    const { categoryIds } = req.body;

    await CategoryService.reorderCategories(menuId, orgId, categoryIds);

    return ResponseFormatter.success(res, null, 'Categories reordered successfully');
  });
}
