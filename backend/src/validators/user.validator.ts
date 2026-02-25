import { z } from 'zod';

export const updateUserSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(['CLIENT', 'MANAGER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
    managerId: z.string().uuid().nullable().optional(),
  })
  .strict();

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
