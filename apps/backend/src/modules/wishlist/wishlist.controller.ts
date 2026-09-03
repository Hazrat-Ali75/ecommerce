import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { SyncWishlistDto, SyncWishlistSchema } from './dto/wishlist.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@CurrentUser() user: CurrentUserPayload) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Post('toggle/:productId')
  @HttpCode(HttpStatus.OK)
  async toggleItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string
  ) {
    return this.wishlistService.toggleItem(user.id, productId);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncWishlist(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(SyncWishlistSchema)) dto: SyncWishlistDto
  ) {
    return this.wishlistService.syncWishlist(user.id, dto.productIds);
  }
}
