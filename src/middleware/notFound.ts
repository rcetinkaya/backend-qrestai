/**
 * 404 Not Found handler
 */

import { Request, Response } from 'express';
import { NotFoundError } from '../types/errors.js';

export const notFound = (_req: Request, _res: Response) => {
  throw new NotFoundError('Route');
};
