/**
 * Admin Controller
 */

import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service.js';
import { ResponseFormatter } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { PaginationParams } from '../types/api.js';

export class AdminController {
  static getAllOrganizations = asyncHandler(async (req: Request, res: Response) => {
    const params: PaginationParams = req.query;

    const result = await AdminService.getAllOrganizations(params);

    return ResponseFormatter.success(res, result);
  });

  static updateOrgStatus = asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.params;
    const { status } = req.body;

    const org = await AdminService.updateOrganizationStatus(orgId, status);

    return ResponseFormatter.success(res, org, 'Organization status updated');
  });

  static updateOrgPlan = asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.params;
    const { plan } = req.body;

    const org = await AdminService.updateOrganizationPlan(orgId, plan);

    return ResponseFormatter.success(res, org, 'Organization plan updated');
  });

  static getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await AdminService.getDashboardStats();

    return ResponseFormatter.success(res, stats);
  });
}
