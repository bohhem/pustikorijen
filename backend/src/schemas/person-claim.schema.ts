import { z } from 'zod';

export const createPersonClaimSchema = z.object({
  message: z.string().max(500).optional().nullable(),
});

export type CreatePersonClaimInput = z.infer<typeof createPersonClaimSchema>;

export const resolvePersonClaimSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().max(1000).optional().nullable(),
});

export type ResolvePersonClaimInput = z.infer<typeof resolvePersonClaimSchema>;
