import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AddToCartDto, SyncCartItemSchema } from './dto/cart.dto';
import { z } from 'zod';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                category: {
                  select: { id: true, name: true, slug: true, type: true },
                },
              },
            },
            variant: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Compute subtotal and check live stock
    let subtotal = 0;
    let totalItems = 0;

    const formattedItems = cart.items.map((item) => {
      const activePrice = item.variant?.discountPrice
        ? Number(item.variant.discountPrice)
        : item.variant?.price
        ? Number(item.variant.price)
        : item.product.discountPrice
        ? Number(item.product.discountPrice)
        : Number(item.product.basePrice);

      const availableStock = item.variant ? item.variant.stockQuantity : 999;
      const isOutOfStock = availableStock <= 0;
      const isQuantityExceeded = item.quantity > availableStock;

      const itemTotal = activePrice * item.quantity;
      subtotal += itemTotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: activePrice,
        totalPrice: itemTotal,
        availableStock,
        isOutOfStock,
        isQuantityExceeded,
        product: {
          id: item.product.id,
          title: item.product.title,
          slug: item.product.slug,
          brand: item.product.brand,
          category: item.product.category,
          primaryImage: item.product.images[0]?.url || null,
        },
        variant: item.variant
          ? {
              id: item.variant.id,
              sku: item.variant.sku,
              attributes: item.variant.attributes,
              stockQuantity: item.variant.stockQuantity,
            }
          : null,
      };
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items: formattedItems,
      subtotal,
      totalItems,
    };
  }

  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { variants: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found or is currently inactive');
    }

    // If product has variants, a variantId is mandatory
    if (product.variants.length > 0 && !dto.variantId) {
      throw new BadRequestException('Please select a variant (e.g. size/type) before adding to cart');
    }

    let availableStock = 999;
    if (dto.variantId) {
      const variant = product.variants.find((v) => v.id === dto.variantId);
      if (!variant) {
        throw new NotFoundException('Selected product variant not found');
      }
      availableStock = variant.stockQuantity;
    }

    if (availableStock <= 0) {
      throw new BadRequestException('This product/variant is currently out of stock');
    }

    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    // Check existing item in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId_variantId: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || null as unknown as string,
        },
      },
    });

    const currentQty = existingItem ? existingItem.quantity : 0;
    const requestedQty = currentQty + dto.quantity;

    if (requestedQty > availableStock) {
      throw new BadRequestException(
        `Cannot add ${dto.quantity} more. Only ${availableStock - currentQty} available in stock.`
      );
    }

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: requestedQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          variantId: dto.variantId || null,
          quantity: dto.quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { variant: true },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    const availableStock = item.variant ? item.variant.stockQuantity : 999;
    if (quantity > availableStock) {
      throw new BadRequestException(`Maximum available stock is ${availableStock}`);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
    return { success: true, message: 'Cart cleared successfully' };
  }

  /**
   * Syncs guest cart items into user's DB cart upon login
   */
  async syncCart(userId: string, guestItems: Array<z.infer<typeof SyncCartItemSchema>>) {
    if (!guestItems || guestItems.length === 0) {
      return this.getCart(userId);
    }

    for (const item of guestItems) {
      try {
        await this.addItem(userId, {
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
        });
      } catch {
        // Continue syncing remaining items even if one item has insufficient stock
      }
    }

    return this.getCart(userId);
  }
}
