import { z } from 'zod';

export const createAlertSchema = z.object({
  productId: z.string().min(1),
  minStock: z.number().int().min(0),
});

export const updateAlertSchema = z
  .object({
    minStock: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.minStock !== undefined || data.isActive !== undefined, {
    message: 'At least one of minStock or isActive must be provided',
  });

export const getAlertsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type GetAlertsQuery = z.infer<typeof getAlertsQuerySchema>;
