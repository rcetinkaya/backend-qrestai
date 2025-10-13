/**
 * Organization Controller
 */

import { Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service.js';
import { ResponseFormatter } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class OrganizationController {
  static get = asyncHandler(async (req: Request, res: Response) => {
    // Get orgId from params or user's session
    const orgId = req.params.orgId || req.user!.orgId!;

    // Validate user has access to this organization
    if (req.params.orgId && req.params.orgId !== req.user!.orgId) {
      return ResponseFormatter.error(
        res,
        'Forbidden',
        'You do not have access to this organization',
        403
      );
    }

    const org = await OrganizationService.getOrganization(orgId);

    return ResponseFormatter.success(res, org);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    // Get orgId from params or user's session
    const orgId = req.params.orgId || req.user!.orgId!;

    // Validate user has access to this organization
    if (req.params.orgId && req.params.orgId !== req.user!.orgId) {
      return ResponseFormatter.error(
        res,
        'Forbidden',
        'You do not have access to this organization',
        403
      );
    }

    const data = req.body;

    const org = await OrganizationService.updateOrganization(orgId, data);

    return ResponseFormatter.success(res, org, 'Organization updated successfully');
  });

  static getMembers = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.orgId!;

    const members = await OrganizationService.getMembers(orgId);

    return ResponseFormatter.success(res, members);
  });

  static updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.orgId!;
    const { userId } = req.params;
    const { role } = req.body;
    const requesterId = req.user!.userId;

    await OrganizationService.updateMemberRole(orgId, userId, requesterId, role);

    return ResponseFormatter.success(res, null, 'Member role updated');
  });

  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    const orgId = req.user!.orgId!;
    const { userId } = req.params;
    const requesterId = req.user!.userId;

    await OrganizationService.removeMember(orgId, userId, requesterId);

    return ResponseFormatter.noContent(res);
  });
}
