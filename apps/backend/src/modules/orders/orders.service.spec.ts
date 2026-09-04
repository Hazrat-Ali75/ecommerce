import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import { CouponsService } from '../coupons/coupons.service';
import { DeliveryZone, PaymentMethod, OrderStatus } from '@prisma/client';
import { CheckoutAddressSchema } from './dto/order.dto';

describe('OrdersService & Bangladeshi Market Logistics', () => {
  let ordersService: OrdersService;

  const mockPrismaService = {
    setting: {
      findFirst: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    orderStatusHistory: {
      create: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    productVariant: {
      update: vi.fn(),
    },
    cart: {
      findUnique: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => callback(mockPrismaService)),
  };

  const mockMailService = {
    sendOrderConfirmationEmail: vi.fn().mockResolvedValue(true),
    sendTrackingUpdateEmail: vi.fn().mockResolvedValue(true),
  };

  const mockCouponsService = {
    validateCoupon: vi.fn(),
    validateAndApplyInTx: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    ordersService = new OrdersService(
      mockPrismaService as unknown as PrismaService,
      mockMailService as unknown as MailService,
      mockCouponsService as unknown as CouponsService
    );
  });

  describe('Rule 7: Tiered Delivery Charges (Dhaka ৳60 vs Outside ৳120)', () => {
    it('should calculate Inside Dhaka delivery fee as ৳60', async () => {
      mockPrismaService.setting.findFirst.mockResolvedValue({
        deliveryFeeInsideDhaka: 60.0,
        deliveryFeeOutsideDhaka: 120.0,
      });

      const fee = await ordersService.getDeliveryFee(DeliveryZone.INSIDE_DHAKA);
      expect(fee).toBe(60.0);
    });

    it('should calculate Outside Dhaka delivery fee as ৳120 across 64 districts', async () => {
      mockPrismaService.setting.findFirst.mockResolvedValue({
        deliveryFeeInsideDhaka: 60.0,
        deliveryFeeOutsideDhaka: 120.0,
      });

      const fee = await ordersService.getDeliveryFee(DeliveryZone.OUTSIDE_DHAKA);
      expect(fee).toBe(120.0);
    });

    it('should fallback to defaults (60/120) if settings table is empty', async () => {
      mockPrismaService.setting.findFirst.mockResolvedValue(null);

      const feeDhaka = await ordersService.getDeliveryFee(DeliveryZone.INSIDE_DHAKA);
      const feeOutside = await ordersService.getDeliveryFee(DeliveryZone.OUTSIDE_DHAKA);

      expect(feeDhaka).toBe(60.0);
      expect(feeOutside).toBe(120.0);
    });
  });

  describe('Rule 8: Bangladeshi Phone Number Validation', () => {
    it('should accept valid 11-digit Bangladeshi phone numbers (013-019)', () => {
      const validNumbers = [
        '01712345678',
        '01812345678',
        '01912345678',
        '01612345678',
        '01512345678',
        '01312345678',
        '01412345678',
      ];

      for (const phone of validNumbers) {
        const address = {
          fullName: 'Tanvir Hossain',
          phone,
          email: 'tanvir@test.com',
          deliveryZone: DeliveryZone.INSIDE_DHAKA,
          division: 'Dhaka',
          district: 'Dhaka',
          streetAddress: 'House 42, Road 11, Banani',
        };
        const parsed = CheckoutAddressSchema.parse(address);
        expect(parsed.phone).toBe(phone);
      }
    });

    it('should REJECT invalid Bangladeshi phone numbers', () => {
      const invalidNumbers = [
        '01212345678', // 012 is invalid operator
        '0171234567', // 10 digits
        '017123456789', // 12 digits
        '+8801712345678', // with country code
        'abcdefghijk',
      ];

      for (const phone of invalidNumbers) {
        const address = {
          fullName: 'Tanvir Hossain',
          phone,
          email: 'tanvir@test.com',
          deliveryZone: DeliveryZone.INSIDE_DHAKA,
          division: 'Dhaka',
          district: 'Dhaka',
          streetAddress: 'House 42, Road 11, Banani',
        };
        expect(() => CheckoutAddressSchema.parse(address)).toThrow();
      }
    });
  });

  describe('Order Creation & Stock Protection', () => {
    it('should decrement variant stock atomically upon checkout', async () => {
      mockPrismaService.setting.findFirst.mockResolvedValue({
        deliveryFeeInsideDhaka: 60.0,
        deliveryFeeOutsideDhaka: 120.0,
      });

      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod_1',
        title: 'Yellow Panjabi',
        isActive: true,
        basePrice: 3450,
        variants: [
          {
            id: 'var_1',
            sku: 'YLW-PNJ-M',
            price: 3450,
            stockQuantity: 10,
            attributes: { gender: 'men', size: 'm' },
          },
        ],
      });

      mockPrismaService.order.create.mockImplementation(async (args) => ({
        id: 'order_1',
        orderNumber: args.data.orderNumber,
        ...args.data,
      }));

      const order = await ordersService.createOrder('user_1', {
        shippingAddress: {
          fullName: 'Rahim Uddin',
          phone: '01712345678',
          email: 'rahim@test.com',
          deliveryZone: DeliveryZone.INSIDE_DHAKA,
          division: 'Dhaka',
          district: 'Dhaka',
          streetAddress: 'Dhanmondi 27',
        },
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        items: [{ productId: 'prod_1', variantId: 'var_1', quantity: 2 }],
      });

      // Verify stock was decremented by 2
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var_1' },
        data: { stockQuantity: { decrement: 2 } },
      });

      expect(order).toHaveProperty('orderNumber');
      expect(mockMailService.sendOrderConfirmationEmail).toHaveBeenCalled();
    });

    it('should RESTORE variant stock if order is cancelled', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order_1',
        orderNumber: 'BD-260903-ABCD',
        orderStatus: OrderStatus.PENDING,
        customerEmail: 'customer@test.com',
        items: [{ variantId: 'var_1', quantity: 3 }],
      });

      await ordersService.updateOrderStatus(
        'order_1',
        { status: OrderStatus.CANCELLED, note: 'Customer cancelled' },
        'Admin'
      );

      // Verify stock was incremented back by 3
      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'var_1' },
        data: { stockQuantity: { increment: 3 } },
      });
    });

    it('should apply coupon discount during checkout', async () => {
      mockPrismaService.setting.findFirst.mockResolvedValue({
        deliveryFeeInsideDhaka: 60.0,
        deliveryFeeOutsideDhaka: 120.0,
      });

      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod_1',
        title: 'Panjabi',
        isActive: true,
        basePrice: 1000.0,
        discountPrice: null,
        variants: [
          { id: 'var_1', sku: 'FAS-PAN-L', price: 1000.0, discountPrice: null, stockQuantity: 5 },
        ],
      });

      mockCouponsService.validateAndApplyInTx.mockResolvedValue({
        couponId: 'coup_1',
        couponCode: 'SAVE10',
        discountAmount: 100.0,
      });

      mockPrismaService.order.create.mockImplementation(({ data }) => ({
        ...data,
        id: 'order_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const order = await ordersService.createOrder('user_1', {
        shippingAddress: {
          fullName: 'Rahim Khan',
          phone: '01712345678',
          email: 'rahim@test.com',
          deliveryZone: DeliveryZone.INSIDE_DHAKA,
          division: 'Dhaka',
          district: 'Dhaka',
          streetAddress: 'Gulshan 2',
        },
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        items: [{ productId: 'prod_1', variantId: 'var_1', quantity: 1 }],
        couponCode: 'SAVE10',
      });

      expect(mockCouponsService.validateAndApplyInTx).toHaveBeenCalledWith(
        expect.anything(),
        'SAVE10',
        1000,
        'user_1'
      );
      // Subtotal 1000 - Discount 100 + Inside Dhaka Delivery 60 = 960
      expect(order.subtotal).toBe(1000);
      expect(order.discount).toBe(100);
      expect(order.deliveryFee).toBe(60);
      expect(order.totalAmount).toBe(960);
      expect(order.couponCode).toBe('SAVE10');
      expect(order.couponId).toBe('coup_1');
    });
  });
});
