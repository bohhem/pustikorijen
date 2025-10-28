import { z } from 'zod';

/**
 * Create branch schema
 */
export const createBranchSchema = z.object({
  surname: z.string().min(2, 'Surname must be at least 2 characters').max(100),
  geoCityId: z.string().min(1, 'City selection is required'),
  description: z.string().max(5000).optional(),
  visibility: z.enum(['public', 'family_only', 'private']).optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

/**
 * Update branch schema
 */
export const updateBranchSchema = z
  .object({
    description: z.string().max(5000).optional().nullable(),
    visibility: z.enum(['public', 'family_only', 'private']).optional(),
    geoCityId: z.string().min(1, 'City selection is required').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
    path: [],
  });

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

/**
 * Get branches query schema
 */
export const getBranchesSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val), 100) : 20),
  surname: z.string().optional(),
  cityCode: z.string().optional(),
  search: z.string().optional(),
});

export type GetBranchesQuery = z.infer<typeof getBranchesSchema>;

/**
 * Join request schema
 */
export const joinRequestSchema = z.object({
  message: z.string().max(500).optional(),
});

export type JoinRequestInput = z.infer<typeof joinRequestSchema>;

/**
 * Approve/Reject request schema
 */
export const approveRejectSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export type ApproveRejectInput = z.infer<typeof approveRejectSchema>;

export const personLinkRequestSchema = z.object({
  personId: z.string().min(1, 'Person ID is required'),
  displayName: z.string().max(255).optional(),
  notes: z.string().max(2000).optional(),
});

export type PersonLinkRequestInput = z.infer<typeof personLinkRequestSchema>;

export const personLinkListQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
});

export type PersonLinkListQuery = z.infer<typeof personLinkListQuerySchema>;

export const personLinkDecisionSchema = z.object({
  notes: z.string().max(2000).optional(),
});

export type PersonLinkDecisionInput = z.infer<typeof personLinkDecisionSchema>;

export const personLinkSearchQuerySchema = z.object({
  q: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(parseInt(val, 10) || 0, 50) : 20)),
});

export type PersonLinkSearchQuery = z.infer<typeof personLinkSearchQuerySchema>;

export const movePersonSchema = z.object({
  targetBranchId: z.string().min(1, 'Target branch is required'),
  notes: z.string().max(1000).optional().nullable(),
});

export type MovePersonInput = z.infer<typeof movePersonSchema>;
