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

export const adminBranchListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(['active', 'archived', 'all']).optional(),
  search: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }),
  regionId: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return undefined;
      }
      if (trimmed.toLowerCase() === 'all') {
        return undefined;
      }
      return trimmed;
    }),
});

export const archiveBranchSchema = z
  .object({
    reason: z.string().max(500, 'Reason too long').optional(),
  })
  .transform(({ reason }) => ({
    reason: reason ? (reason.trim().length > 0 ? reason.trim() : null) : null,
  }));

export const updateBranchRegionSchema = z.object({
  regionId: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }),
});

const backupBaseSchema = z.object({
  label: z
    .string()
    .min(3, 'Label must be at least 3 characters')
    .max(60, 'Label must be at most 60 characters')
    .transform((value) => value.trim()),
  scope: z.enum(['FULL', 'REGION']),
  regionId: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }),
  includeMedia: z.boolean().optional().default(true),
  retentionDays: z.coerce.number().int().min(1).max(365).optional(),
  notifyEmails: z
    .array(z.string().email().transform((email) => email.trim().toLowerCase()))
    .optional()
    .transform((value) => (value && value.length ? value : undefined)),
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or less')
    .optional()
    .transform((value) => (value ? value.trim() : undefined)),
});

export const createBackupSchema = backupBaseSchema.superRefine((data, ctx) => {
  if (data.scope === 'REGION' && !data.regionId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Region is required for region-scoped backups',
      path: ['regionId'],
    });
  }
});

export type CreateRegionInput = z.infer<typeof createRegionSchema>;
export type AssignGuruInput = z.infer<typeof assignGuruSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type AdminBranchListQuery = z.infer<typeof adminBranchListQuerySchema>;
export type ArchiveBranchInput = z.infer<typeof archiveBranchSchema>;
export type UpdateBranchRegionInput = z.infer<typeof updateBranchRegionSchema>;
export type CreateBackupInput = z.infer<typeof createBackupSchema>;
