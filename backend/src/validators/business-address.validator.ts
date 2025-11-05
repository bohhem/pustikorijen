import { z } from 'zod';

const googleMapsRegex = /^https?:\/\/(www\.)?google\.[^/]+\/maps/i;

const optionalNumber = (min: number, max: number) =>
  z
    .preprocess((value) => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      if (typeof value === 'number' && Number.isNaN(value)) {
        return undefined;
      }

      const parsed = typeof value === 'string' ? Number(value) : value;
      if (typeof parsed !== 'number' || Number.isNaN(parsed)) {
        return value;
      }
      return parsed;
    }, z.number().min(min).max(max))
    .optional();

const optionalBoolean = z
  .preprocess((value) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'off'].includes(normalized)) {
        return false;
      }
    }

    return value;
  }, z.boolean())
  .optional();

const baseAddressSchema = z.object({
  geoCityId: z.string().min(1, 'City selection is required'),
  label: z.string().max(100).optional().nullable(),
  addressLine1: z.string().min(2, 'Address line must be at least 2 characters').max(255),
  addressLine2: z.string().max(255).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
  googleMapsPlaceId: z.string().max(255).optional().nullable(),
  googleMapsUrl: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .optional()
    .nullable()
    .refine(
      (val) => !val || (z.string().url().safeParse(val).success && googleMapsRegex.test(val)),
      { message: 'Must be a valid Google Maps URL' }
    ),
});

export const createGuruBusinessAddressSchema = baseAddressSchema.extend({
  isPublic: optionalBoolean,
  isPrimary: optionalBoolean,
});

export type CreateGuruBusinessAddressInput = z.infer<typeof createGuruBusinessAddressSchema>;

export const updateGuruBusinessAddressSchema = createGuruBusinessAddressSchema
  .partial()
  .refine((value) => Object.values(value).some((v) => v !== undefined), 'At least one field must be provided');

export type UpdateGuruBusinessAddressInput = z.infer<typeof updateGuruBusinessAddressSchema>;

export const createPersonBusinessAddressSchema = baseAddressSchema.extend({
  isPrimary: optionalBoolean,
  notes: z.string().max(1000).optional().nullable(),
});

export type CreatePersonBusinessAddressInput = z.infer<typeof createPersonBusinessAddressSchema>;

export const updatePersonBusinessAddressSchema = createPersonBusinessAddressSchema
  .partial()
  .refine(
    (value) => Object.values(value).some((v) => v !== undefined),
    'At least one field must be provided'
  );

export type UpdatePersonBusinessAddressInput = z.infer<typeof updatePersonBusinessAddressSchema>;
