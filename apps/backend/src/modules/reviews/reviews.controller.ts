import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  CreateReviewSchema,
  UpdateReviewDto,
  UpdateReviewSchema,
  GetProductReviewsQueryDto,
  GetProductReviewsQuerySchema,
  GetAdminReviewsQueryDto,
  GetAdminReviewsQuerySchema,
} from './dto/review.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Public: Get top-rated featured reviews for the landing page showcase.
   */
  @Public()
  @Get('featured')
  async getFeaturedReviews(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 6;
    return this.reviewsService.getFeaturedReviews(limitNum);
  }

  /**
   * Public: Get paginated reviews and aggregated rating stats for a product.
   */
  @Public()
  @Get('product/:productId')
  async getProductReviews(
    @Param('productId') productId: string,
    @Query(new ZodValidationPipe(GetProductReviewsQuerySchema)) query: GetProductReviewsQueryDto
  ) {
    return this.reviewsService.getProductReviews(productId, query);
  }

  /**
   * Authenticated: Check if current customer has purchased or reviewed the product.
   */
  @Get('user/check/:productId')
  @UseGuards(JwtAuthGuard)
  async checkUserStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string
  ) {
    return this.reviewsService.checkUserReviewStatus(user.id, productId);
  }

  /**
   * Authenticated: Customer submits or updates a review.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(CreateReviewSchema)) dto: CreateReviewDto
  ) {
    return this.reviewsService.createOrUpdateReview(user.id, dto);
  }

  /**
   * Authenticated: Update author's own review.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateReviewSchema)) dto: UpdateReviewDto
  ) {
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    return this.reviewsService.updateReview(user.id, id, dto, isAdmin);
  }

  /**
   * Authenticated: Delete author's own review.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string
  ) {
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    return this.reviewsService.deleteReview(user.id, id, isAdmin);
  }

  /**
   * Admin: List all customer reviews with moderation details.
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAdminReviews(
    @Query(new ZodValidationPipe(GetAdminReviewsQuerySchema)) query: GetAdminReviewsQueryDto
  ) {
    return this.reviewsService.getAdminReviews(query);
  }

  /**
   * Admin: Toggle verified purchase badge.
   */
  @Patch('admin/:id/toggle-verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async toggleVerification(@Param('id') id: string) {
    return this.reviewsService.toggleReviewVerification(id);
  }

  /**
   * Admin: Force delete any review.
   */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async adminDeleteReview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string
  ) {
    return this.reviewsService.deleteReview(user.id, id, true);
  }
}
