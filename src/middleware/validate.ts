/**
 * Request validation middleware using Zod
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { ValidationError } from '../types/errors.js';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (schema: z.ZodSchema, target: ValidationTarget = 'body') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const validated = await schema.parseAsync(data);

      // Replace request data with validated data
      req[target] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new ValidationError(messages.join(', '));
      }
      next(error);
    }
  };
};
