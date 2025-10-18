import { z } from 'zod';

export const createPartnershipSchema = z.object({
  branchId: z.string().min(1, 'Branch ID is required'),
  person1Id: z.string().uuid('Invalid person 1 ID'),
  person2Id: z.string().uuid('Invalid person 2 ID'),
  partnershipType: z
    .enum(['marriage', 'domestic_partnership', 'common_law', 'other'])
    .default('marriage')
    .optional(),
  startDate: z.string().optional(),
  startPlace: z.string().max(255).optional(),
  endDate: z.string().optional(),
  endPlace: z.string().max(255).optional(),
  endReason: z.enum(['divorce', 'death', 'separation', 'annulment']).optional(),
  status: z.enum(['active', 'ended', 'annulled']).default('active').optional(),
  orderNumber: z.number().int().positive().default(1).optional(),
  notes: z.string().optional(),
  ceremonyType: z.string().max(100).optional(),
  visibility: z.enum(['public', 'family_only', 'private']).default('family_only').optional(),
});

export const updatePartnershipSchema = z.object({
  partnershipType: z
    .enum(['marriage', 'domestic_partnership', 'common_law', 'other'])
    .optional(),
  startDate: z.string().optional(),
  startPlace: z.string().max(255).optional(),
  endDate: z.string().optional(),
  endPlace: z.string().max(255).optional(),
  endReason: z.enum(['divorce', 'death', 'separation', 'annulment']).optional(),
  status: z.enum(['active', 'ended', 'annulled']).optional(),
  isCurrent: z.boolean().optional(),
  orderNumber: z.number().int().positive().optional(),
  notes: z.string().optional(),
  ceremonyType: z.string().max(100).optional(),
  visibility: z.enum(['public', 'family_only', 'private']).optional(),
});

export type CreatePartnershipInput = z.infer<typeof createPartnershipSchema>;
export type UpdatePartnershipInput = z.infer<typeof updatePartnershipSchema>;
