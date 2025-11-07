import { z } from 'zod';

/**
 * Schema for listing users with filters and pagination
 */
export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'email', 'role', 'lastLogin', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
  role: z.enum(['USER', 'REGIONAL_GURU', 'SUPER_GURU', 'ADMIN']).optional(),
  isActive: z.coerce.boolean().optional(),
  emailVerified: z.coerce.boolean().optional(),
});

export type ListUsersInput = z.infer<typeof listUsersSchema>;

/**
 * Schema for updating user role
 */
export const updateUserRoleSchema = z.object({
  globalRole: z.enum(['USER', 'REGIONAL_GURU', 'SUPER_GURU']),
  reason: z.string().max(500).optional(),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/**
 * Schema for deactivating a user
 */
export const deactivateUserSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>;

/**
 * Schema for sending a notification to a user
 */
export const sendNotificationSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(1, 'Message is required').max(2000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  actionUrl: z.string().url().optional().or(z.literal('')),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;

/**
 * Schema for getting user activity logs
 */
export const getUserActivitySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type GetUserActivityInput = z.infer<typeof getUserActivitySchema>;
