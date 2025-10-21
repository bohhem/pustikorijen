import { z } from 'zod';

export const createRegionSchema = z.object({
  name: z.string().min(3, 'Region name must be at least 3 characters'),
  code: z
    .string()
    .min(2, 'Region code must have at least 2 characters')
    .max(10, 'Region code must have at most 10 characters')
    .transform((value) => value.trim().toUpperCase()),
  country: z.string().min(2).max(100).optional().transform((value) => (value ? value.trim() : value ?? null)),
  description: z
    .string()
    .max(1000, 'Description too long')
    .optional()
    .transform((value) => (value ? value.trim() : value ?? null)),
});

export const assignGuruSchema = z.object({
  email: z.string().email('Valid email required').transform((value) => value.trim().toLowerCase()),
  isPrimary: z.boolean().optional().default(false),
});

export const updateAssignmentSchema = z.object({
  isPrimary: z.boolean(),
});

export type CreateRegionInput = z.infer<typeof createRegionSchema>;
export type AssignGuruInput = z.infer<typeof assignGuruSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
