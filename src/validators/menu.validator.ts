/**
 * Menu validation schemas
 */

import { z } from 'zod';

export const createMenuSchema = z.object({
  name: z.string().min(1, 'Menu name is required'),
  locale: z.string().length(2, 'Locale must be 2 characters').default('tr'),
});

export const updateMenuSchema = z.object({
  name: z.string().min(1).optional(),
  locale: z.string().length(2).optional(),
  isActive: z.boolean().optional(),
});

export const menuIdSchema = z.object({
  id: z.string().cuid('Invalid menu ID'),
});
