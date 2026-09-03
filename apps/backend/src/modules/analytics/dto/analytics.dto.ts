import { OrderStatus, DeliveryZone, PaymentMethod, PaymentStatus } from '@prisma/client';

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  deliveryZone: DeliveryZone;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  itemsCount: number;
  createdAt: Date;
}

export interface DailyRevenueItem {
  date: string;
  revenue: number;
  ordersCount: number;
}

export interface TopProductItem {
  id: string;
  title: string;
  slug: string;
  brand: string;
  totalQuantitySold: number;
  totalRevenue: number;
  image: string | null;
}

export interface AnalyticsSummaryDto {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  lowStockCount: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByZone: {
    insideDhaka: number;
    outsideDhaka: number;
  };
  recentOrders: RecentOrderSummary[];
  dailyRevenue: DailyRevenueItem[];
  topProducts: TopProductItem[];
}
