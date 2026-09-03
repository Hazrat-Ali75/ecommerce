import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CheckoutDto,
  CheckoutSchema,
  UpdateOrderStatusDto,
  UpdateOrderStatusSchema,
  TrackOrderQueryDto,
  TrackOrderQuerySchema,
} from './dto/order.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, OrderStatus, DeliveryZone } from '@prisma/client';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Public Delivery Fee Rates:
   * Inside Dhaka: ৳60 | Outside Dhaka: ৳120
   */
  @Public()
  @Get('delivery-fees')
  async getDeliveryFees() {
    const [insideDhaka, outsideDhaka] = await Promise.all([
      this.ordersService.getDeliveryFee(DeliveryZone.INSIDE_DHAKA),
      this.ordersService.getDeliveryFee(DeliveryZone.OUTSIDE_DHAKA),
    ]);

    return {
      insideDhaka: {
        amount: insideDhaka,
        zone: DeliveryZone.INSIDE_DHAKA,
        estimatedDays: '24–48 Hours',
      },
      outsideDhaka: {
        amount: outsideDhaka,
        zone: DeliveryZone.OUTSIDE_DHAKA,
        estimatedDays: '3–5 Days across 64 districts',
      },
    };
  }

  /**
   * Order Placement (Checkout):
   * Supports authenticated users and guest checkout with phone number.
   * Atomically decrements stock.
   */
  @Public()
  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(
    @CurrentUser() user: CurrentUserPayload | null,
    @Body(new ZodValidationPipe(CheckoutSchema)) dto: CheckoutDto
  ) {
    return this.ordersService.createOrder(user?.id, dto);
  }

  /**
   * Public Order Tracking by Param:
   * GET /api/v1/orders/track/:orderNumber
   */
  @Public()
  @Get('track/:orderNumber')
  async trackByParam(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.trackOrder({ orderNumber });
  }

  /**
   * Public Order Tracking by Query:
   * GET /api/v1/orders/track?orderNumber=...&phone=...
   */
  @Public()
  @Get('track')
  async trackByQuery(
    @Query(new ZodValidationPipe(TrackOrderQuerySchema)) query: TrackOrderQueryDto
  ) {
    return this.ordersService.trackOrder(query);
  }

  /**
   * Customer Order History:
   * GET /api/v1/orders/my-orders
   */
  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: CurrentUserPayload) {
    return this.ordersService.getMyOrders(user.id);
  }

  /**
   * Order Details:
   * GET /api/v1/orders/:id
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderById(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.ordersService.getOrderById(id, user.id);
  }

  /**
   * Admin: List all orders
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAdminOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.ordersService.getAdminOrders(pageNum, limitNum, status, search);
  }

  /**
   * Admin: Update order status (with stock restoration on cancellation)
   */
  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateOrderStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema)) dto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateOrderStatus(id, dto, user.name);
  }
}
