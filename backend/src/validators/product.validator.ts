import { z } from 'zod';

export const getProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(['name', 'cleanName', 'category', 'expiryDate', 'createdAt']).default('cleanName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  expired: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export type GetProductsQuery = z.infer<typeof getProductsQuerySchema>;

export const updateProductSchema = z
  .object({
    description: z.string().nullable().optional(),
    characteristics: z.record(z.string(), z.string()).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type UpdateProductBody = z.infer<typeof updateProductSchema>;

export const productIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ProductIdParams = z.infer<typeof productIdParamSchema>;
