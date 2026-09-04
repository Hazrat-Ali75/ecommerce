import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import Stripe from 'stripe';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
      });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY is not defined. Stripe checkout is disabled.');
    }
  }

  async createCheckoutSession(orderId: string) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured on this server');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with id '${orderId}' not found`);
    }

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException('This order is already paid');
    }

    const webUrl =
      this.configService.get<string>('WEB_URL') ||
      this.configService.get<string>('FRONTEND_URL') ||
      'https://ecommerce-banglashop.netlify.app';

    // Stripe currency support: BDT or fallback
    // In Stripe, 1 BDT = 100 Poisha (cents equivalent)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(
      (item) => ({
        price_data: {
          currency: 'bdt',
          product_data: {
            name: item.productTitleSnapshot,
            description: `SKU: ${item.skuSnapshot}`,
          },
          unit_amount: Math.round(Number(item.unitPrice) * 100),
        },
        quantity: item.quantity,
      })
    );

    // Add Delivery Fee as line item
    lineItems.push({
      price_data: {
        currency: 'bdt',
        product_data: {
          name: `Delivery Charge (${
            order.deliveryZone === 'INSIDE_DHAKA'
              ? 'Inside Dhaka ৳60'
              : 'Outside Dhaka ৳120'
          })`,
        },
        unit_amount: Math.round(Number(order.deliveryFee) * 100),
      },
      quantity: 1,
    });

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: order.customerEmail,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
      success_url: `${webUrl}/order-success?orderNumber=${order.orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${webUrl}/checkout?orderNumber=${order.orderNumber}&cancelled=true`,
    });

    // Save session ID on order
    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      orderNumber: order.orderNumber,
    };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    if (!this.stripe) {
      throw new BadRequestException('Stripe is not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      if (webhookSecret) {
        event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } else {
        event = JSON.parse(payload.toString()) as Stripe.Event;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown signature error';
      this.logger.error(`Webhook signature verification failed: ${msg}`);
      throw new BadRequestException(`Webhook Error: ${msg}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: orderId },
            include: { items: true },
          });
          if (!order) return;

          await tx.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'PAID',
              orderStatus: OrderStatus.CONFIRMED,
              stripePaymentIntentId:
                typeof session.payment_intent === 'string'
                  ? session.payment_intent
                  : session.payment_intent?.id || null,
            },
          });

          await tx.orderStatusHistory.create({
            data: {
              orderId,
              status: OrderStatus.CONFIRMED,
              note: `Payment verified via Stripe Checkout (Session: ${session.id})`,
              updatedBy: 'Stripe Webhook',
            },
          });

          // Dispatch confirmation email
          this.mailService
            .sendOrderConfirmationEmail({
              to: order.customerEmail,
              orderNumber: order.orderNumber,
              totalAmount: Number(order.totalAmount),
              paymentMethod: 'Stripe Online Payment',
              customerName: order.customerName,
              customerPhone: order.customerPhone,
              deliveryZone: order.deliveryZone,
              deliveryFee: Number(order.deliveryFee),
              subtotal: Number(order.subtotal),
              shippingAddress: order.shippingAddress,
              items: order.items.map((it) => ({
                productTitleSnapshot: it.productTitleSnapshot,
                variantInfoSnapshot: it.variantInfoSnapshot as Record<string, any> | null,
                unitPrice: Number(it.unitPrice),
                quantity: it.quantity,
                totalPrice: Number(it.totalPrice),
              })),
            })
            .catch((e) => this.logger.error('Failed to send confirmation email', e));
        });

        this.logger.log(`Order ${session.metadata?.orderNumber} successfully marked PAID via Stripe webhook`);
      }
    }

    return { received: true };
  }
}
