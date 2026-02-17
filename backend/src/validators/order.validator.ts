import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1),
      }),
    )
    .min(1),
  comment: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const getOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;
