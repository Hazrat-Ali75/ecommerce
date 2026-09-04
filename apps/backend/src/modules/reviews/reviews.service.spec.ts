import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../../database/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('ReviewsService', () => {
  let reviewsService: ReviewsService;

  const mockPrismaService = {
    product: {
      findUnique: vi.fn(),
    },
    review: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    order: {
      findFirst: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    reviewsService = new ReviewsService(mockPrismaService as unknown as PrismaService);
  });

  describe('getProductReviews', () => {
    it('should return aggregated rating distribution and average rating', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod_1',
        title: 'Classic Panjabi',
        slug: 'classic-panjabi',
      });

      mockPrismaService.review.findMany
        .mockResolvedValueOnce([
          {
            id: 'rev_1',
            rating: 5,
            comment: 'Excellent fit and cloth quality!',
            createdAt: new Date(),
            user: { id: 'u_1', name: 'Rahim', avatarUrl: null },
          },
        ])
        .mockResolvedValueOnce([
          { rating: 5 },
          { rating: 5 },
          { rating: 4 },
          { rating: 4 },
          { rating: 2 },
        ]);

      mockPrismaService.review.count.mockResolvedValue(5);

      const res = await reviewsService.getProductReviews('prod_1', { page: 1, limit: 10 });

      expect(res.stats.totalReviews).toBe(5);
      // (5+5+4+4+2) / 5 = 20 / 5 = 4.0
      expect(res.stats.averageRating).toBe(4.0);
      expect(res.stats.ratingDistribution[5]).toBe(2);
      expect(res.stats.ratingDistribution[4]).toBe(2);
      expect(res.stats.ratingDistribution[2]).toBe(1);
      expect(res.stats.ratingDistribution[1]).toBe(0);
      expect(res.reviews).toHaveLength(1);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        reviewsService.getProductReviews('invalid_id', { page: 1, limit: 10 })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFeaturedReviews', () => {
    it('should fetch top-rated reviews for the landing page showcase', async () => {
      mockPrismaService.review.findMany.mockResolvedValue([
        {
          id: 'rev_1',
          rating: 5,
          comment: 'Outstanding quality and fast delivery in Dhaka!',
          isVerified: true,
          user: { id: 'u_1', name: 'Karim', avatarUrl: null },
          product: { id: 'p_1', title: 'Premium Polo', slug: 'premium-polo' },
        },
      ]);

      const res = await reviewsService.getFeaturedReviews(4);
      expect(res).toHaveLength(1);
      expect(res[0].rating).toBe(5);
      expect(res[0].isVerified).toBe(true);
    });
  });

  describe('createOrUpdateReview', () => {
    it('should automatically assign isVerified: true if customer bought the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod_1',
        isActive: true,
      });

      // User has purchase order
      mockPrismaService.order.findFirst.mockResolvedValue({
        id: 'order_1',
        orderNumber: 'BD-260904-1234',
      });

      mockPrismaService.review.findFirst.mockResolvedValue(null); // no previous review

      mockPrismaService.review.create.mockResolvedValue({
        id: 'rev_new',
        productId: 'prod_1',
        userId: 'user_1',
        rating: 5,
        comment: 'Super fast delivery in Chittagong!',
        isVerified: true,
      });

      const res = await reviewsService.createOrUpdateReview('user_1', {
        productId: 'prod_1',
        rating: 5,
        comment: 'Super fast delivery in Chittagong!',
      });

      expect(mockPrismaService.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerified: true,
          }),
        })
      );
      expect(res.isNew).toBe(true);
      expect(res.review.isVerified).toBe(true);
    });

    it('should assign isVerified: false if customer has not purchased the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod_1',
        isActive: true,
      });

      // User has NOT bought the product
      mockPrismaService.order.findFirst.mockResolvedValue(null);
      mockPrismaService.review.findFirst.mockResolvedValue(null);

      mockPrismaService.review.create.mockResolvedValue({
        id: 'rev_2',
        productId: 'prod_1',
        userId: 'user_2',
        rating: 4,
        isVerified: false,
      });

      const res = await reviewsService.createOrUpdateReview('user_2', {
        productId: 'prod_1',
        rating: 4,
      });

      expect(mockPrismaService.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerified: false,
          }),
        })
      );
      expect(res.review.isVerified).toBe(false);
    });

    it('should update existing review if user previously reviewed', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'prod_1',
        isActive: true,
      });

      mockPrismaService.order.findFirst.mockResolvedValue(null);

      mockPrismaService.review.findFirst.mockResolvedValue({
        id: 'rev_existing',
        productId: 'prod_1',
        userId: 'user_1',
        rating: 3,
        comment: 'Okay',
        isVerified: false,
      });

      mockPrismaService.review.update.mockResolvedValue({
        id: 'rev_existing',
        rating: 5,
        comment: 'Updated: Actually great!',
      });

      const res = await reviewsService.createOrUpdateReview('user_1', {
        productId: 'prod_1',
        rating: 5,
        comment: 'Updated: Actually great!',
      });

      expect(mockPrismaService.review.update).toHaveBeenCalled();
      expect(res.isNew).toBe(false);
    });
  });

  describe('deleteReview', () => {
    it('should reject non-owner deletion with ForbiddenException', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'rev_1',
        userId: 'owner_user',
      });

      await expect(
        reviewsService.deleteReview('attacker_user', 'rev_1', false)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow author to delete own review', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'rev_1',
        userId: 'owner_user',
      });
      mockPrismaService.review.delete.mockResolvedValue({});

      const res = await reviewsService.deleteReview('owner_user', 'rev_1', false);
      expect(res.success).toBe(true);
    });

    it('should allow admin to delete any review', async () => {
      mockPrismaService.review.findUnique.mockResolvedValue({
        id: 'rev_1',
        userId: 'owner_user',
      });
      mockPrismaService.review.delete.mockResolvedValue({});

      const res = await reviewsService.deleteReview('admin_user', 'rev_1', true);
      expect(res.success).toBe(true);
    });
  });
});
