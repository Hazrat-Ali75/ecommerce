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
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { CouponsService } from './coupons.service';
import {
  ValidateCouponDto,
  ValidateCouponSchema,
  CreateCouponDto,
  CreateCouponSchema,
  UpdateCouponDto,
  UpdateCouponSchema,
  GetCouponsQueryDto,
  GetCouponsQuerySchema,
} from './dto/coupon.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  /**
   * Public/Customer: Validate coupon code against cart subtotal.
   */
  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateCoupon(
    @Body(new ZodValidationPipe(ValidateCouponSchema)) dto: ValidateCouponDto,
    @Req() req: Request
  ) {
    const user = req.user as CurrentUserPayload | undefined;
    return this.couponsService.validateCoupon(dto.code, dto.subtotal, user?.id);
  }

  /**
   * Admin: List all coupons.
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAdminCoupons(
    @Query(new ZodValidationPipe(GetCouponsQuerySchema)) query: GetCouponsQueryDto
  ) {
    return this.couponsService.getAdminCoupons(query);
  }

  /**
   * Admin: Get single coupon details.
   */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getCouponById(@Param('id') id: string) {
    return this.couponsService.getCouponById(id);
  }

  /**
   * Admin: Create new coupon.
   */
  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createCoupon(
    @Body(new ZodValidationPipe(CreateCouponSchema)) dto: CreateCouponDto
  ) {
    return this.couponsService.createCoupon(dto);
  }

  /**
   * Admin: Update coupon.
   */
  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateCoupon(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCouponSchema)) dto: UpdateCouponDto
  ) {
    return this.couponsService.updateCoupon(id, dto);
  }

  /**
   * Admin: Delete coupon.
   */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteCoupon(@Param('id') id: string) {
    return this.couponsService.deleteCoupon(id);
  }
}
