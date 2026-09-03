import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  AddToCartSchema,
  UpdateCartItemDto,
  UpdateCartItemSchema,
  SyncCartDto,
  SyncCartSchema,
} from './dto/cart.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: CurrentUserPayload) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @HttpCode(HttpStatus.OK)
  async addItem(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(AddToCartSchema)) dto: AddToCartDto
  ) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:id')
  async updateItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') itemId: string,
    @Body(new ZodValidationPipe(UpdateCartItemSchema)) dto: UpdateCartItemDto
  ) {
    return this.cartService.updateItem(user.id, itemId, dto.quantity);
  }

  @Delete('items/:id')
  async removeItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') itemId: string
  ) {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Delete('clear')
  async clearCart(@CurrentUser() user: CurrentUserPayload) {
    return this.cartService.clearCart(user.id);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncCart(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(SyncCartSchema)) dto: SyncCartDto
  ) {
    return this.cartService.syncCart(user.id, dto.items);
  }
}
