import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  GetProductReviewsQueryDto,
  GetAdminReviewsQueryDto,
} from './dto/review.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public: Get paginated reviews and aggregated rating stats for a product.
   */
  async getProductReviews(productId: string, query: GetProductReviewsQueryDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true, slug: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${productId}' not found`);
    }

    const { page = 1, limit = 10, rating } = query;
    const skip = (page - 1) * limit;

    const whereClause: { productId: string; rating?: number } = { productId };
    if (rating) {
      whereClause.rating = rating;
    }

    const [reviews, totalCount, allRatings] = await Promise.all([
      this.prisma.review.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where: whereClause }),
      this.prisma.review.findMany({
        where: { productId },
        select: { rating: true },
      }),
    ]);

    // Calculate rating distribution (5, 4, 3, 2, 1 stars)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumRatings = 0;

    for (const r of allRatings) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      sumRatings += r.rating;
    }

    const totalAllReviews = allRatings.length;
    const averageRating =
      totalAllReviews > 0 ? Number((sumRatings / totalAllReviews).toFixed(1)) : 0;

    return {
      product,
      stats: {
        totalReviews: totalAllReviews,
        averageRating,
        ratingDistribution: {
          5: distribution[5] || 0,
          4: distribution[4] || 0,
          3: distribution[3] || 0,
          2: distribution[2] || 0,
          1: distribution[1] || 0,
        },
      },
      reviews,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Public: Get top-rated verified reviews for landing page testimonial showcase.
   */
  async getFeaturedReviews(limit = 6) {
    const reviews = await this.prisma.review.findMany({
      where: {
        rating: { gte: 4 },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            brand: true,
            basePrice: true,
            discountPrice: true,
            images: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, altText: true },
            },
          },
        },
      },
      orderBy: [{ isVerified: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    return reviews;
  }

  /**
   * Authenticated: Check if current user has already reviewed or purchased a product.
   */
  async checkUserReviewStatus(userId: string, productId: string) {
    const [existingReview, purchaseOrder] = await Promise.all([
      this.prisma.review.findFirst({
        where: { productId, userId },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.order.findFirst({
        where: {
          userId,
          orderStatus: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED],
          },
          items: {
            some: { productId },
          },
        },
        select: { id: true, orderNumber: true, createdAt: true },
      }),
    ]);

    return {
      hasPurchased: Boolean(purchaseOrder),
      hasReviewed: Boolean(existingReview),
      review: existingReview,
    };
  }

  /**
   * Authenticated: Create or update a customer review.
   * Automatically assigns verified purchase status if the customer purchased the product.
   */
  async createOrUpdateReview(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, isActive: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or is currently inactive');
    }

    // Check if the user purchased this item
    const purchaseOrder = await this.prisma.order.findFirst({
      where: {
        userId,
        orderStatus: {
          notIn: [OrderStatus.CANCELLED, OrderStatus.RETURNED],
        },
        items: {
          some: { productId: dto.productId },
        },
      },
    });

    const isVerified = Boolean(purchaseOrder);

    const existingReview = await this.prisma.review.findFirst({
      where: { productId: dto.productId, userId },
    });

    if (existingReview) {
      // Update existing review
      const updated = await this.prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: dto.rating,
          comment: dto.comment?.trim() || null,
          isVerified: existingReview.isVerified || isVerified,
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
          product: { select: { id: true, title: true, slug: true } },
        },
      });

      return { review: updated, isNew: false };
    }

    // Create new review
    const created = await this.prisma.review.create({
      data: {
        productId: dto.productId,
        userId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        isVerified,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        product: { select: { id: true, title: true, slug: true } },
      },
    });

    return { review: created, isNew: true };
  }

  /**
   * Authenticated: Update review by author or admin.
   */
  async updateReview(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
    isAdmin = false
  ) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID '${reviewId}' not found`);
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.rating ? { rating: dto.rating } : {}),
        ...(dto.comment !== undefined ? { comment: dto.comment?.trim() || null } : {}),
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        product: { select: { id: true, title: true, slug: true } },
      },
    });

    return updated;
  }

  /**
   * Authenticated: Delete review by author or admin.
   */
  async deleteReview(userId: string, reviewId: string, isAdmin = false) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID '${reviewId}' not found`);
    }

    if (!isAdmin && review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { success: true, message: 'Review deleted successfully' };
  }

  /**
   * Admin: List all customer reviews with pagination and filtering.
   */
  async getAdminReviews(query: GetAdminReviewsQueryDto) {
    const { page = 1, limit = 15, search, rating, isVerified } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (rating) {
      where.rating = rating;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    if (search?.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { comment: { contains: searchTerm, mode: 'insensitive' } },
        { product: { title: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { user: { email: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [reviews, totalCount] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          product: { select: { id: true, title: true, slug: true, brand: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Admin: Toggle verified status on a review.
   */
  async toggleReviewVerification(reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID '${reviewId}' not found`);
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { isVerified: !review.isVerified },
    });

    return updated;
  }
}
