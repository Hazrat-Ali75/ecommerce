import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, DeliveryZone, PaymentStatus } from '@prisma/client';
import {
  AnalyticsSummaryDto,
  RecentOrderSummary,
  DailyRevenueItem,
  TopProductItem,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(): Promise<AnalyticsSummaryDto> {
    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      lowStockCount,
      revenueAggregate,
      recentOrdersRaw,
      ordersByStatusRaw,
      insideDhakaCount,
      outsideDhakaCount,
      completedOrders,
      orderItemsWithProducts,
    ] = await Promise.all([
      // 1. Total order count
      this.prisma.order.count(),

      // 2. Pending orders count
      this.prisma.order.count({
        where: { orderStatus: OrderStatus.PENDING },
      }),

      // 3. Delivered orders count
      this.prisma.order.count({
        where: { orderStatus: OrderStatus.DELIVERED },
      }),

      // 4. Low stock variants (<= 5 units remaining)
      this.prisma.productVariant.count({
        where: { stockQuantity: { lte: 5 } },
      }),

      // 5. Total revenue aggregate (paid or delivered orders)
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          OR: [
            { paymentStatus: PaymentStatus.PAID },
            { orderStatus: OrderStatus.DELIVERED },
          ],
        },
      }),

      // 6. Recent 6 orders
      this.prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { items: true } },
        },
      }),

      // 7. Orders grouped by status
      this.prisma.order.groupBy({
        by: ['orderStatus'],
        _count: { id: true },
      }),

      // 8. Inside Dhaka orders
      this.prisma.order.count({
        where: { deliveryZone: DeliveryZone.INSIDE_DHAKA },
      }),

      // 9. Outside Dhaka orders
      this.prisma.order.count({
        where: { deliveryZone: DeliveryZone.OUTSIDE_DHAKA },
      }),

      // 10. Orders in the last 14 days for timeline chart (using 15-day window for timezone safety)
      this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          },
          orderStatus: { not: OrderStatus.CANCELLED },
        },
        select: {
          createdAt: true,
          totalAmount: true,
        },
        orderBy: { createdAt: 'asc' },
      }),

      // 11. Top selling order items
      this.prisma.orderItem.findMany({
        take: 50,
        select: {
          productId: true,
          quantity: true,
          totalPrice: true,
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              brand: true,
              images: { where: { isPrimary: true }, take: 1, select: { url: true } },
            },
          },
        },
      }),
    ]);

    // Format total revenue in BDT
    const totalRevenue = Number(revenueAggregate._sum.totalAmount || 0);

    // Format recent orders
    const recentOrders: RecentOrderSummary[] = recentOrdersRaw.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      totalAmount: Number(order.totalAmount),
      deliveryZone: order.deliveryZone,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      itemsCount: order._count.items,
      createdAt: order.createdAt,
    }));

    // Format orders by status map
    const ordersByStatus: Record<OrderStatus, number> = {
      [OrderStatus.PENDING]: 0,
      [OrderStatus.CONFIRMED]: 0,
      [OrderStatus.PROCESSING]: 0,
      [OrderStatus.SHIPPED]: 0,
      [OrderStatus.OUT_FOR_DELIVERY]: 0,
      [OrderStatus.DELIVERED]: 0,
      [OrderStatus.CANCELLED]: 0,
      [OrderStatus.RETURNED]: 0,
    };

    ordersByStatusRaw.forEach((item) => {
      ordersByStatus[item.orderStatus] = item._count.id;
    });

    // Format 14-day daily revenue map in Asia/Dhaka timezone
    const formatDhakaDate = (d: Date): string => {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    };

    const dailyMap = new Map<string, { revenue: number; count: number }>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = formatDhakaDate(d);
      dailyMap.set(dateStr, { revenue: 0, count: 0 });
    }

    completedOrders.forEach((ord) => {
      const dateStr = formatDhakaDate(ord.createdAt);
      if (dailyMap.has(dateStr)) {
        const entry = dailyMap.get(dateStr)!;
        entry.revenue += Number(ord.totalAmount);
        entry.count += 1;
      }
    });

    const dailyRevenue: DailyRevenueItem[] = Array.from(dailyMap.entries()).map(
      ([date, data]) => ({
        date,
        revenue: Math.round(data.revenue),
        ordersCount: data.count,
      })
    );

    // Format top selling products
    const productMap = new Map<
      string,
      { title: string; slug: string; brand: string; totalSold: number; revenue: number; image: string | null }
    >();

    orderItemsWithProducts.forEach((item) => {
      if (!item.product) return;
      const prev = productMap.get(item.productId) || {
        title: item.product.title,
        slug: item.product.slug,
        brand: item.product.brand,
        totalSold: 0,
        revenue: 0,
        image: item.product.images[0]?.url || null,
      };

      prev.totalSold += item.quantity;
      prev.revenue += Number(item.totalPrice);
      productMap.set(item.productId, prev);
    });

    const topProducts: TopProductItem[] = Array.from(productMap.entries())
      .map(([id, info]) => ({
        id,
        title: info.title,
        slug: info.slug,
        brand: info.brand,
        totalQuantitySold: info.totalSold,
        totalRevenue: Math.round(info.revenue),
        image: info.image,
      }))
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, 5);

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      lowStockCount,
      ordersByStatus,
      ordersByZone: {
        insideDhaka: insideDhakaCount,
        outsideDhaka: outsideDhakaCount,
      },
      recentOrders,
      dailyRevenue,
      topProducts,
    };
  }
}
