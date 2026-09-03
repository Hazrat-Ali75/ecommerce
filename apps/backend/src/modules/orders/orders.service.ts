import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  CheckoutDto,
  UpdateOrderStatusDto,
  TrackOrderQueryDto,
} from './dto/order.dto';
import { DeliveryZone, PaymentMethod, OrderStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  /**
   * Fetches delivery fee for given Bangladeshi delivery zone
   * Default: Inside Dhaka ৳60, Outside Dhaka ৳120
   */
  async getDeliveryFee(deliveryZone: DeliveryZone): Promise<number> {
    const setting = await this.prisma.setting.findFirst();
    if (!setting) {
      return deliveryZone === DeliveryZone.INSIDE_DHAKA ? 60.0 : 120.0;
    }

    return deliveryZone === DeliveryZone.INSIDE_DHAKA
      ? Number(setting.deliveryFeeInsideDhaka)
      : Number(setting.deliveryFeeOutsideDhaka);
  }

  /**
   * Order Placement with Atomic Stock Protection (prisma.$transaction)
   */
  async createOrder(userId: string | undefined, dto: CheckoutDto) {
    const { shippingAddress, paymentMethod, notes } = dto;

    // 1. Resolve Items to checkout (either direct items payload or user cart)
    type ResolvedItem = {
      productId: string;
      variantId: string | null;
      quantity: number;
    };

    let itemsToCheckout: ResolvedItem[] = [];
    let isFromCart = false;

    if (dto.items && dto.items.length > 0) {
      itemsToCheckout = dto.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || null,
        quantity: i.quantity,
      }));
    } else if (userId) {
      const userCart = await this.prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });

      if (!userCart || userCart.items.length === 0) {
        throw new BadRequestException('Your shopping cart is empty');
      }

      itemsToCheckout = userCart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      }));
      isFromCart = true;
    } else {
      throw new BadRequestException('No items provided for checkout');
    }

    // 2. Fetch delivery fee
    const deliveryFee = await this.getDeliveryFee(shippingAddress.deliveryZone);

    // 3. Execute Order Creation in an Atomic Database Transaction
    const order = await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsData: Array<{
        productId: string;
        variantId: string | null;
        productTitleSnapshot: string;
        variantInfoSnapshot: Prisma.InputJsonValue | null;
        skuSnapshot: string;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
      }> = [];

      for (const item of itemsToCheckout) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });

        if (!product || !product.isActive) {
          throw new NotFoundException(`Product not found or is inactive`);
        }

        let variant: (typeof product.variants)[0] | undefined;
        let unitPrice: number;
        let skuSnapshot: string;
        let variantInfo: Prisma.InputJsonValue | null = null;

        if (item.variantId) {
          variant = product.variants.find((v) => v.id === item.variantId);
          if (!variant) {
            throw new NotFoundException(
              `Variant not found for product '${product.title}'`
            );
          }

          // Stock protection check
          if (variant.stockQuantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for '${product.title}' (SKU: ${variant.sku}). Requested ${item.quantity}, only ${variant.stockQuantity} available.`
            );
          }

          // Decrement stock quantity
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stockQuantity: { decrement: item.quantity } },
          });

          unitPrice = variant.discountPrice
            ? Number(variant.discountPrice)
            : Number(variant.price);
          skuSnapshot = variant.sku;
          variantInfo = variant.attributes as Prisma.InputJsonValue;
        } else {
          // Product without specific variant
          unitPrice = product.discountPrice
            ? Number(product.discountPrice)
            : Number(product.basePrice);
          skuSnapshot = `${product.skuPrefix}-STD`;
        }

        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        orderItemsData.push({
          productId: product.id,
          variantId: item.variantId || null,
          productTitleSnapshot: product.title,
          variantInfoSnapshot: variantInfo,
          skuSnapshot,
          unitPrice,
          quantity: item.quantity,
          totalPrice: itemTotal,
        });
      }

      const totalAmount = subtotal + deliveryFee;
      const orderNumber = this.generateOrderNumber();

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: userId || null,
          customerName: shippingAddress.fullName.trim(),
          customerPhone: shippingAddress.phone.trim(),
          customerEmail: shippingAddress.email.trim(),
          deliveryZone: shippingAddress.deliveryZone,
          shippingAddress: shippingAddress as unknown as Prisma.InputJsonValue,
          subtotal,
          deliveryFee,
          totalAmount,
          paymentMethod,
          paymentStatus: 'PENDING',
          orderStatus: OrderStatus.PENDING,
          notes: notes?.trim() || null,
          items: {
            create: orderItemsData.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productTitleSnapshot: item.productTitleSnapshot,
              variantInfoSnapshot: item.variantInfoSnapshot || Prisma.JsonNull,
              skuSnapshot: item.skuSnapshot,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              totalPrice: item.totalPrice,
            })),
          },
          statusHistory: {
            create: {
              status: OrderStatus.PENDING,
              note:
                paymentMethod === PaymentMethod.CASH_ON_DELIVERY
                  ? 'Order placed with Cash on Delivery (COD)'
                  : 'Order placed, awaiting Stripe payment verification',
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      // If checked out from DB cart, clear user cart items
      if (isFromCart && userId) {
        const userCart = await tx.cart.findUnique({ where: { userId } });
        if (userCart) {
          await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
        }
      }

      return newOrder;
    });

    // Send confirmation email for COD immediately
    if (order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY) {
      this.mailService
        .sendOrderConfirmationEmail({
          to: order.customerEmail,
          orderNumber: order.orderNumber,
          totalAmount: Number(order.totalAmount),
          paymentMethod: 'Cash on Delivery (COD)',
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          deliveryZone: order.deliveryZone,
          deliveryFee: Number(order.deliveryFee),
          subtotal: Number(order.subtotal),
          shippingAddress: order.shippingAddress,
          items: Array.isArray(order.items)
            ? order.items.map((it) => ({
                productTitleSnapshot: it.productTitleSnapshot,
                variantInfoSnapshot: it.variantInfoSnapshot as Record<string, any> | null,
                unitPrice: Number(it.unitPrice),
                quantity: it.quantity,
                totalPrice: Number(it.totalPrice),
              }))
            : Array.isArray((order.items as any)?.create)
              ? (order.items as any).create.map((it: any) => ({
                  productTitleSnapshot: it.productTitleSnapshot,
                  variantInfoSnapshot: it.variantInfoSnapshot as Record<string, any> | null,
                  unitPrice: Number(it.unitPrice),
                  quantity: it.quantity,
                  totalPrice: Number(it.totalPrice),
                }))
              : [],
        })
        .catch((err) => this.logger.error('Error dispatching confirmation email', err));
    }

    return order;
  }

  /**
   * Public Order Tracking Endpoint:
   * Returns order status history and realistic estimated delivery window:
   * Inside Dhaka: 24-48 hours
   * Outside Dhaka: 3-5 days across 64 districts
   */
  async trackOrder(dto: TrackOrderQueryDto) {
    const { orderNumber, phone } = dto;

    const order = await this.prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim() },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`No order found with number '${orderNumber}'`);
    }

    if (phone && order.customerPhone !== phone.trim()) {
      throw new BadRequestException('Phone number does not match the order records');
    }

    const estimatedDelivery =
      order.deliveryZone === DeliveryZone.INSIDE_DHAKA
        ? 'Estimated 24–48 Hours (Dhaka Capital Metro)'
        : 'Estimated 3–5 Days (Nationwide 64 Districts)';

    return {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryZone: order.deliveryZone,
      estimatedDelivery,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      totalAmount: Number(order.totalAmount),
      shippingAddress: order.shippingAddress,
      timeline: order.statusHistory.map((h) => ({
        status: h.status,
        note: h.note,
        date: h.createdAt,
      })),
      items: order.items.map((i) => ({
        id: i.id,
        title: i.productTitleSnapshot,
        sku: i.skuSnapshot,
        variantInfo: i.variantInfoSnapshot,
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        totalPrice: Number(i.totalPrice),
        image: i.product?.images[0]?.url || null,
      })),
    };
  }

  /**
   * Get Orders of logged in customer
   */
  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Get Order by ID
   */
  async getOrderById(orderId: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Customer can only view their own order
    if (userId && order.userId && order.userId !== userId) {
      throw new BadRequestException('Unauthorized access to this order');
    }

    return order;
  }

  /**
   * Admin: List all orders with pagination & status filter
   */
  async getAdminOrders(
    page: number = 1,
    limit: number = 20,
    status?: OrderStatus,
    search?: string
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      ...(status && { orderStatus: status }),
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { customerPhone: { contains: search, mode: 'insensitive' } },
          { customerEmail: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Update order status & stock restoration on cancellation
   */
  async updateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    adminName: string = 'Admin'
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.orderStatus;
    const newStatus = dto.status;

    return this.prisma.$transaction(async (tx) => {
      // If cancelled, restore variant stock quantity
      if (newStatus === OrderStatus.CANCELLED && previousStatus !== OrderStatus.CANCELLED) {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stockQuantity: { increment: item.quantity } },
            });
          }
        }
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          orderStatus: newStatus,
          ...(dto.trackingNumber && { trackingNumber: dto.trackingNumber.trim() }),
          ...(newStatus === OrderStatus.DELIVERED &&
            order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY && {
              paymentStatus: 'PAID',
            }),
        },
      });

      // Add status history record
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: newStatus,
          note: dto.note || `Status updated from ${previousStatus} to ${newStatus}`,
          updatedBy: adminName,
        },
      });

      // Send customer notification email for tracking updates
      this.mailService
        .sendTrackingUpdateEmail(
          order.customerEmail,
          order.orderNumber,
          newStatus,
          dto.trackingNumber || order.trackingNumber || undefined,
          order.customerName,
          dto.note
        )
        .catch((err) => this.logger.error('Failed to send status update email', err));

      return updated;
    });
  }

  /**
   * Generates order numbers: BD-YYMMDD-XXXX (e.g. BD-260903-7F2A)
   */
  private generateOrderNumber(): string {
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();

    return `BD-${yy}${mm}${dd}-${random}`;
  }
}
