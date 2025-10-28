import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const createPlaceholderSchema = z.object({
  displayName: z.string().min(2).max(150),
  relationHint: z.string().max(200).optional().nullable(),
  approxBirthYear: z
    .number()
    .int()
    .min(1800, 'Year too small')
    .max(currentYear, 'Year in the future')
    .optional()
    .nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isPublic: z.boolean().optional(),
});

export type CreatePlaceholderInput = z.infer<typeof createPlaceholderSchema>;

export const claimPlaceholderSchema = z.object({
  message: z.string().max(1000).optional().nullable(),
});

export type ClaimPlaceholderInput = z.infer<typeof claimPlaceholderSchema>;

export const resolvePlaceholderSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  message: z.string().max(1000).optional().nullable(),
});

export type ResolvePlaceholderInput = z.infer<typeof resolvePlaceholderSchema>;
