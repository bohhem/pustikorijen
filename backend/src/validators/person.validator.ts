import { z } from 'zod';

export const createPersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  maidenName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']),
  birthDate: z.string().datetime().optional(),
  birthPlace: z.string().max(200).optional(),
  deathDate: z.string().datetime().optional(),
  deathPlace: z.string().max(200).optional(),
  biography: z.string().max(5000).optional(),
  fatherId: z.string().uuid().optional(),
  motherId: z.string().uuid().optional(),
  isAlive: z.boolean().default(true),
  privacyLevel: z.enum(['public', 'family_only', 'private']).default('family_only'),
});

export const updatePersonSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  maidenName: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthDate: z.string().datetime().optional(),
  birthPlace: z.string().max(200).optional(),
  deathDate: z.string().datetime().optional(),
  deathPlace: z.string().max(200).optional(),
  biography: z.string().max(5000).optional(),
  fatherId: z.string().uuid().optional(),
  motherId: z.string().uuid().optional(),
  isAlive: z.boolean().optional(),
  privacyLevel: z.enum(['public', 'family_only', 'private']).optional(),
});

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;
