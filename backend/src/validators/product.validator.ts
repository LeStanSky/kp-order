import { z } from 'zod';

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['name', 'cleanName', 'category', 'expiryDate', 'createdAt']).default('cleanName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;
