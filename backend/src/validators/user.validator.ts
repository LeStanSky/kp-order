import { z } from 'zod';

export const createUserSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['CLIENT', 'MANAGER', 'ADMIN']).default('CLIENT'),
    managerId: z.string().uuid().nullable().optional(),
    priceGroupId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['CLIENT', 'MANAGER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
    managerId: z.string().uuid().nullable().optional(),
    priceGroupId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
  })
  .strict();

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
