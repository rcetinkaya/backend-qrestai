/**
 * Global error handler middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/errors.js';
import { ErrorResponse } from '../types/api.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log error
  logger.error(err.message, err.stack);

  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let error = err.message;

  // Handle operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    error = err.name;
  }

  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    switch (err.code) {
      case 'P2002':
        message = 'A record with this value already exists';
        error = 'ConflictError';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        error = 'NotFoundError';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        error = 'ValidationError';
        break;
      default:
        message = 'Database operation failed';
        error = 'DatabaseError';
    }
  }

  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    error = 'AuthenticationError';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    error = 'AuthenticationError';
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error,
    message,
    statusCode,
  };

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};
