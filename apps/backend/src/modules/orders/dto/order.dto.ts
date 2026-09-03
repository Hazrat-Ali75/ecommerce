import { z } from 'zod';
import { DeliveryZone, PaymentMethod, OrderStatus } from '@prisma/client';
import { BD_PHONE_REGEX } from '../../auth/dto/auth.dto';

// Shipping Address for Checkout
export const CheckoutAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  phone: z
    .string()
    .regex(BD_PHONE_REGEX, 'Must be a valid 11-digit Bangladeshi phone number (e.g., 01712345678)'),
  email: z.string().email('Valid email address is required').toLowerCase(),
  deliveryZone: z.nativeEnum(DeliveryZone, {
    errorMap: () => ({ message: 'Delivery zone must be INSIDE_DHAKA or OUTSIDE_DHAKA' }),
  }),
  division: z.string().min(2, 'Division is required'),
  district: z.string().min(2, 'District is required'),
  thana: z.string().optional(),
  streetAddress: z.string().min(5, 'Street address is required'),
  postalCode: z.string().optional(),
});

export type CheckoutAddressDto = z.infer<typeof CheckoutAddressSchema>;

// Direct Buy-Now or Guest item checkout
export const CheckoutItemInputSchema = z.object({
  productId: z.string().cuid(),
  variantId: z.string().cuid().optional().nullable(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const CheckoutSchema = z.object({
  shippingAddress: CheckoutAddressSchema,
  paymentMethod: z.nativeEnum(PaymentMethod, {
    errorMap: () => ({ message: 'Payment method must be CASH_ON_DELIVERY or STRIPE' }),
  }),
  items: z.array(CheckoutItemInputSchema).optional(), // If omitted, checks out from user's DB cart
  notes: z.string().max(500).optional(),
});

export type CheckoutDto = z.infer<typeof CheckoutSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    errorMap: () => ({ message: 'Invalid order status' }),
  }),
  note: z.string().optional(),
  trackingNumber: z.string().optional(),
});

export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusSchema>;

export const TrackOrderQuerySchema = z.object({
  orderNumber: z.string().min(5, 'Order number is required'),
  phone: z
    .string()
    .regex(BD_PHONE_REGEX, 'Phone must be an 11-digit Bangladeshi number')
    .optional(),
});

export type TrackOrderQueryDto = z.infer<typeof TrackOrderQuerySchema>;
