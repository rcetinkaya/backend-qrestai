/**
 * Auth Controller
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { ResponseFormatter } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { LoginCredentials, RegisterData } from '../types/auth.js';

export class AuthController {
  static register = asyncHandler(async (req: Request, res: Response) => {
    const data: RegisterData = req.body;
    const result = await AuthService.register(data);

    return ResponseFormatter.created(res, result, 'Registration successful');
  });

  static login = asyncHandler(async (req: Request, res: Response) => {
    const credentials: LoginCredentials = req.body;
    const result = await AuthService.login(credentials);

    return ResponseFormatter.success(res, result, 'Login successful');
  });

  static refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshAccessToken(refreshToken);

    return ResponseFormatter.success(res, result);
  });

  static logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    await AuthService.logout(refreshToken);

    return ResponseFormatter.success(res, null, 'Logout successful');
  });

  static me = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await AuthService.getCurrentUser(userId);

    return ResponseFormatter.success(res, user);
  });
}
