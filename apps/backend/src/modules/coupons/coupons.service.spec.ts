import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../../database/prisma.service';
import { DiscountType, Prisma } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CouponsService', () => {
  let couponsService: CouponsService;

  const mockPrismaService = {
    coupon: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    couponUsage: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    couponsService = new CouponsService(mockPrismaService as unknown as PrismaService);
  });

  describe('validateCoupon', () => {
    it('should calculate PERCENTAGE discount correctly', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coup_1',
        code: 'EID20',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        minOrderAmount: null,
        maxDiscount: null,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        usageLimit: 100,
        usedCount: 5,
        isActive: true,
      });

      const res = await couponsService.validateCoupon('eid20', 1000);
      expect(res.valid).toBe(true);
      expect(res.discountAmount).toBe(200); // 20% of 1000 = 200
    });

    it('should cap PERCENTAGE discount at maxDiscount if defined', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coup_2',
        code: 'BIGSALE',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 50,
        minOrderAmount: null,
        maxDiscount: 150, // Capped at 150 BDT
        startDate: null,
        endDate: null,
        usageLimit: null,
        usedCount: 0,
        isActive: true,
      });

      const res = await couponsService.validateCoupon('BIGSALE', 1000);
      expect(res.discountAmount).toBe(150); // Instead of 500, capped at 150
    });

    it('should calculate FIXED_AMOUNT discount correctly', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coup_3',
        code: 'FLAT100',
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 100,
        minOrderAmount: null,
        maxDiscount: null,
        startDate: null,
        endDate: null,
        usageLimit: null,
        usedCount: 0,
        isActive: true,
      });

      const res = await couponsService.validateCoupon('FLAT100', 500);
      expect(res.discountAmount).toBe(100);
    });

    it('should throw NotFoundException if coupon code does not exist', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      await expect(couponsService.validateCoupon('NONEXISTENT', 500)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if coupon is inactive', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coup_4',
        code: 'INACTIVE',
        isActive: false,
      });

      await expect(couponsService.validateCoupon('INACTIVE', 500)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if coupon is expired', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coup_5',
        code: 'OLD',
        isActive: true,
        startDate: null,
        endDate: new Date('2020-01-01'), // In past
      });

      await expect(couponsService.validateCoupon('OLD', 500)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if usage limit is reached', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coup_6',
        code: 'LIMITED',
        isActive: true,
        startDate: null,
        endDate: null,
        usageLimit: 10,
        usedCount: 10,
      });

      await expect(couponsService.validateCoupon('LIMITED', 500)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if subtotal is less than minOrderAmount', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coup_7',
        code: 'MIN500',
        isActive: true,
        startDate: null,
        endDate: null,
        usageLimit: null,
        usedCount: 0,
        minOrderAmount: 500,
      });

      await expect(couponsService.validateCoupon('MIN500', 300)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if user already redeemed the coupon', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coup_8',
        code: 'ONCE',
        isActive: true,
        startDate: null,
        endDate: null,
        usageLimit: null,
        usedCount: 0,
        minOrderAmount: null,
      });

      mockPrismaService.couponUsage.findFirst.mockResolvedValue({
        id: 'usage_1',
        couponId: 'coup_8',
        userId: 'user_1',
      });

      await expect(
        couponsService.validateCoupon('ONCE', 500, 'user_1')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateAndApplyInTx', () => {
    it('should increment usedCount and record usage in transaction', async () => {
      const mockTx = {
        coupon: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'coup_tx',
            code: 'TX10',
            isActive: true,
            discountType: DiscountType.PERCENTAGE,
            discountValue: 10,
            minOrderAmount: null,
            maxDiscount: null,
            startDate: null,
            endDate: null,
            usageLimit: 50,
            usedCount: 2,
          }),
          update: vi.fn().mockResolvedValue({}),
        },
        couponUsage: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({}),
        },
      };

      const res = await couponsService.validateAndApplyInTx(
        mockTx as unknown as Prisma.TransactionClient,
        'TX10',
        1000,
        'user_123',
        'order_123'
      );

      expect(res.couponId).toBe('coup_tx');
      expect(res.discountAmount).toBe(100);
      expect(mockTx.coupon.update).toHaveBeenCalledWith({
        where: { id: 'coup_tx' },
        data: { usedCount: { increment: 1 } },
      });
      expect(mockTx.couponUsage.create).toHaveBeenCalledWith({
        data: {
          couponId: 'coup_tx',
          userId: 'user_123',
          orderId: 'order_123',
        },
      });
    });
  });
});
