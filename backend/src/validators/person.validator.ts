import { z } from 'zod';

const dateStringSchema = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
    z.string().datetime({ offset: true }),
  ])
  .optional()
  .or(z.literal(null));

const estimatedBirthYearSchema = z
  .number()
  .int()
  .min(1600)
  .max(2200)
  .optional()
  .nullable();

export const createPersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  maidenName: z.string().max(100).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']),
  birthDate: dateStringSchema,
  birthPlace: z.string().max(200).optional().nullable(),
  deathDate: dateStringSchema,
  deathPlace: z.string().max(200).optional().nullable(),
  biography: z.string().max(5000).optional().nullable(),
  fatherId: z.string().uuid().optional().nullable(),
  motherId: z.string().uuid().optional().nullable(),
  isAlive: z.boolean().default(true),
  privacyLevel: z.enum(['public', 'family_only', 'private']).default('family_only'),
  shareInLedger: z.boolean().optional().default(false),
  estimatedBirthYear: estimatedBirthYearSchema,
});

export const updatePersonSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  maidenName: z.string().max(100).optional().nullable(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: dateStringSchema,
  birthPlace: z.string().max(200).optional().nullable(),
  deathDate: dateStringSchema,
  deathPlace: z.string().max(200).optional().nullable(),
  biography: z.string().max(5000).optional().nullable(),
  fatherId: z.string().uuid().optional().nullable(),
  motherId: z.string().uuid().optional().nullable(),
  isAlive: z.boolean().optional(),
  privacyLevel: z.enum(['public', 'family_only', 'private']).optional(),
  shareInLedger: z.boolean().optional(),
  estimatedBirthYear: estimatedBirthYearSchema,
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
