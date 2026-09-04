import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  GetCouponsQueryDto,
} from './dto/coupon.dto';
import { DiscountType, Prisma } from '@prisma/client';

export interface CouponValidationResult {
  valid: boolean;
  couponId: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  message: string;
}

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate coupon eligibility and calculate discount amount in BDT (৳).
   */
  async validateCoupon(
    code: string,
    subtotal: number,
    userId?: string
  ): Promise<CouponValidationResult> {
    const cleanCode = code.trim().toUpperCase();

    const coupon = await this.prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon code '${cleanCode}' does not exist`);
    }

    if (!coupon.isActive) {
      throw new BadRequestException(`Coupon '${cleanCode}' is no longer active`);
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      throw new BadRequestException(`Coupon '${cleanCode}' is not active yet`);
    }

    if (coupon.endDate && now > coupon.endDate) {
      throw new BadRequestException(`Coupon '${cleanCode}' has expired`);
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException(`Coupon '${cleanCode}' has reached its maximum usage limit`);
    }

    const minAmount = coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null;
    if (minAmount !== null && subtotal < minAmount) {
      throw new BadRequestException(
        `Minimum order subtotal of ৳${minAmount.toLocaleString('en-US')} is required for coupon '${cleanCode}'`
      );
    }

    // Check if user has already redeemed this single-use coupon
    if (userId) {
      const userUsage = await this.prisma.couponUsage.findFirst({
        where: { couponId: coupon.id, userId },
      });

      if (userUsage) {
        throw new BadRequestException(`You have already redeemed coupon '${cleanCode}'`);
      }
    }

    // Calculate discount amount
    let discount = 0;
    const discountVal = Number(coupon.discountValue);
    const maxDisc = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (subtotal * discountVal) / 100;
      if (maxDisc !== null) {
        discount = Math.min(discount, maxDisc);
      }
    } else {
      // FIXED_AMOUNT
      discount = Math.min(subtotal, discountVal);
    }

    discount = Math.min(discount, subtotal);
    const roundedDiscount = Number(discount.toFixed(2));

    return {
      valid: true,
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: discountVal,
      discountAmount: roundedDiscount,
      minOrderAmount: minAmount,
      maxDiscount: maxDisc,
      message: `Coupon '${coupon.code}' applied successfully! Saved ৳${roundedDiscount.toLocaleString('en-US')}.`,
    };
  }

  /**
   * Validate and apply coupon inside an existing Prisma transaction during checkout.
   * Increments usedCount and records CouponUsage.
   */
  async validateAndApplyInTx(
    tx: Prisma.TransactionClient,
    code: string,
    subtotal: number,
    userId?: string,
    orderId?: string
  ): Promise<{ couponId: string; couponCode: string; discountAmount: number }> {
    const cleanCode = code.trim().toUpperCase();

    const coupon = await tx.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException(`Coupon '${cleanCode}' is invalid or no longer active`);
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      throw new BadRequestException(`Coupon '${cleanCode}' is not yet active`);
    }

    if (coupon.endDate && now > coupon.endDate) {
      throw new BadRequestException(`Coupon '${cleanCode}' has expired`);
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException(`Coupon '${cleanCode}' usage limit has been exceeded`);
    }

    const minAmount = coupon.minOrderAmount ? Number(coupon.minOrderAmount) : null;
    if (minAmount !== null && subtotal < minAmount) {
      throw new BadRequestException(
        `Minimum order subtotal of ৳${minAmount.toLocaleString('en-US')} required for coupon '${cleanCode}'`
      );
    }

    if (userId) {
      const userUsage = await tx.couponUsage.findFirst({
        where: { couponId: coupon.id, userId },
      });

      if (userUsage) {
        throw new BadRequestException(`You have already redeemed coupon '${cleanCode}'`);
      }
    }

    // Calculate discount
    let discount = 0;
    const discountVal = Number(coupon.discountValue);
    const maxDisc = coupon.maxDiscount ? Number(coupon.maxDiscount) : null;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (subtotal * discountVal) / 100;
      if (maxDisc !== null) {
        discount = Math.min(discount, maxDisc);
      }
    } else {
      discount = Math.min(subtotal, discountVal);
    }

    discount = Math.min(discount, subtotal);
    const roundedDiscount = Number(discount.toFixed(2));

    // Increment coupon usage count
    await tx.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: { increment: 1 } },
    });

    // Create coupon usage record if user is registered
    if (userId) {
      await tx.couponUsage.create({
        data: {
          couponId: coupon.id,
          userId,
          orderId: orderId || null,
        },
      });
    }

    return {
      couponId: coupon.id,
      couponCode: coupon.code,
      discountAmount: roundedDiscount,
    };
  }

  /**
   * Admin: List all coupons with search, pagination, and status filters.
   */
  async getAdminCoupons(query: GetCouponsQueryDto) {
    const { page = 1, limit = 15, search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CouponWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { code: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const [coupons, totalCount] = await Promise.all([
      this.prisma.coupon.findMany({
        where,
        include: {
          _count: {
            select: { orders: true, usages: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.coupon.count({ where }),
    ]);

    return {
      coupons,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Admin: Get single coupon details.
   */
  async getCouponById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { usedAt: 'desc' },
          take: 20,
        },
        _count: { select: { orders: true, usages: true } },
      },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID '${id}' not found`);
    }

    return coupon;
  }

  /**
   * Admin: Create a new coupon.
   */
  async createCoupon(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Coupon code '${dto.code}' already exists`);
    }

    const created = await this.prisma.coupon.create({
      data: {
        code: dto.code,
        description: dto.description?.trim() || null,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount ?? null,
        maxDiscount: dto.maxDiscount ?? null,
        startDate: dto.startDate ?? new Date(),
        endDate: dto.endDate ?? null,
        usageLimit: dto.usageLimit ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    return created;
  }

  /**
   * Admin: Update coupon details.
   */
  async updateCoupon(id: string, dto: UpdateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID '${id}' not found`);
    }

    if (dto.code && dto.code !== coupon.code) {
      const codeConflict = await this.prisma.coupon.findUnique({
        where: { code: dto.code },
      });
      if (codeConflict) {
        throw new ConflictException(`Coupon code '${dto.code}' already exists`);
      }
    }

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...(dto.code ? { code: dto.code } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.discountType ? { discountType: dto.discountType } : {}),
        ...(dto.discountValue !== undefined ? { discountValue: dto.discountValue } : {}),
        ...(dto.minOrderAmount !== undefined ? { minOrderAmount: dto.minOrderAmount } : {}),
        ...(dto.maxDiscount !== undefined ? { maxDiscount: dto.maxDiscount } : {}),
        ...(dto.startDate ? { startDate: dto.startDate } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate } : {}),
        ...(dto.usageLimit !== undefined ? { usageLimit: dto.usageLimit } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return updated;
  }

  /**
   * Admin: Delete coupon.
   */
  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID '${id}' not found`);
    }

    await this.prisma.coupon.delete({
      where: { id },
    });

    return { success: true, message: `Coupon '${coupon.code}' deleted successfully` };
  }
}
