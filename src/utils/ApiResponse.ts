/**
 * Standard API response formatter
 */

import { Response } from 'express';
import { ApiResponse } from '../types/api.js';

export class ResponseFormatter {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      ...(message && { message }),
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message: string = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response) {
    return res.status(204).send();
  }

  static notFound(res: Response, message: string = 'Resource not found') {
    const response: ApiResponse = {
      success: false,
      error: 'Not Found',
      message,
    };

    return res.status(404).json(response);
  }

  static error(res: Response, error: string, message: string, statusCode: number = 500) {
    const response: ApiResponse = {
      success: false,
      error,
      message,
    };

    return res.status(statusCode).json(response);
  }
}
