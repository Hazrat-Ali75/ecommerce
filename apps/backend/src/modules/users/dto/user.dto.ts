import { z } from 'zod';
import { BD_PHONE_REGEX } from '../../auth/dto/auth.dto';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().regex(BD_PHONE_REGEX, 'Must be a valid 11-digit Bangladeshi phone number').optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

export const CreateAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().regex(BD_PHONE_REGEX, 'Must be a valid 11-digit Bangladeshi phone number (e.g. 01712345678)'),
  deliveryZone: z.enum(['INSIDE_DHAKA', 'OUTSIDE_DHAKA']),
  division: z.string().min(2, 'Division is required'),
  district: z.string().min(2, 'District is required'),
  thana: z.string().optional(),
  streetAddress: z.string().min(5, 'Street address is required'),
  postalCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type CreateAddressDto = z.infer<typeof CreateAddressSchema>;
