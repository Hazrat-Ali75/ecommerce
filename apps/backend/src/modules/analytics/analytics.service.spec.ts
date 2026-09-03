import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../database/prisma.service';
import { OrderStatus, DeliveryZone, PaymentMethod, PaymentStatus } from '@prisma/client';

describe('AnalyticsService (Admin KPI Aggregations)', () => {
  let analyticsService: AnalyticsService;

  const mockPrismaService = {
    order: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    productVariant: {
      count: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    analyticsService = new AnalyticsService(mockPrismaService as unknown as PrismaService);
  });

  it('should correctly aggregate revenue, orders, and delivery zones', async () => {
    // 1. mock total orders
    mockPrismaService.order.count.mockImplementation((args) => {
      if (!args) return Promise.resolve(45); // totalOrders
      if (args.where?.orderStatus === OrderStatus.PENDING) return Promise.resolve(5); // pendingOrders
      if (args.where?.orderStatus === OrderStatus.DELIVERED) return Promise.resolve(30); // deliveredOrders
      if (args.where?.deliveryZone === DeliveryZone.INSIDE_DHAKA) return Promise.resolve(28); // insideDhaka
      if (args.where?.deliveryZone === DeliveryZone.OUTSIDE_DHAKA) return Promise.resolve(17); // outsideDhaka
      return Promise.resolve(0);
    });

    // 2. mock low stock count
    mockPrismaService.productVariant.count.mockResolvedValue(4);

    // 3. mock revenue aggregate
    mockPrismaService.order.aggregate.mockResolvedValue({
      _sum: { totalAmount: 145200 },
    });

    // 4. mock recent orders
    mockPrismaService.order.findMany.mockImplementation((args) => {
      if (args.take === 6) {
        return Promise.resolve([
          {
            id: 'ord-1',
            orderNumber: 'BD-2026-0001',
            customerName: 'Rahim Khan',
            customerPhone: '01712345678',
            totalAmount: 3400,
            deliveryZone: DeliveryZone.INSIDE_DHAKA,
            paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
            paymentStatus: PaymentStatus.PENDING,
            orderStatus: OrderStatus.PENDING,
            _count: { items: 2 },
            createdAt: new Date(),
          },
        ]);
      }
      // timeline orders
      return Promise.resolve([
        {
          createdAt: new Date(),
          totalAmount: 3400,
        },
      ]);
    });

    // 5. mock status group
    mockPrismaService.order.groupBy.mockResolvedValue([
      { orderStatus: OrderStatus.PENDING, _count: { id: 5 } },
      { orderStatus: OrderStatus.DELIVERED, _count: { id: 30 } },
    ]);

    // 6. mock order items
    mockPrismaService.orderItem.findMany.mockResolvedValue([
      {
        productId: 'prod-1',
        quantity: 8,
        totalPrice: 16000,
        product: {
          id: 'prod-1',
          title: 'Panjabi',
          slug: 'panjabi',
          brand: 'Sailor',
          images: [{ url: 'https://img.com/panjabi.jpg' }],
        },
      },
    ]);

    const summary = await analyticsService.getSummary();

    expect(summary.totalOrders).toBe(45);
    expect(summary.pendingOrders).toBe(5);
    expect(summary.deliveredOrders).toBe(30);
    expect(summary.lowStockCount).toBe(4);
    expect(summary.totalRevenue).toBe(145200);
    expect(summary.ordersByZone.insideDhaka).toBe(28);
    expect(summary.ordersByZone.outsideDhaka).toBe(17);
    expect(summary.recentOrders).toHaveLength(1);
    expect(summary.recentOrders[0].orderNumber).toBe('BD-2026-0001');
    expect(summary.topProducts).toHaveLength(1);
    expect(summary.topProducts[0].title).toBe('Panjabi');
    expect(summary.dailyRevenue).toHaveLength(14);
    const todayDhakaStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const todayRevenueItem = summary.dailyRevenue.find((d) => d.date === todayDhakaStr);
    expect(todayRevenueItem).toBeDefined();
    expect(todayRevenueItem?.revenue).toBe(3400);
    expect(todayRevenueItem?.ordersCount).toBe(1);
  });
});
