import { z } from 'zod';

/**
 * Create branch schema
 */
export const createBranchSchema = z.object({
  surname: z.string().min(2, 'Surname must be at least 2 characters').max(100),
  cityCode: z.string().min(2, 'City code must be at least 2 characters').max(10),
  cityName: z.string().min(2, 'City name must be at least 2 characters').max(100),
  region: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  description: z.string().max(5000).optional(),
  visibility: z.enum(['public', 'family_only', 'private']).optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

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
