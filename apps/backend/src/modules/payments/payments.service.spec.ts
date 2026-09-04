import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';

describe('PaymentsService - Stripe Redirect & Domain Resolution', () => {
  let service: PaymentsService;
  let originalEnv: string | undefined;

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockPrismaService = {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockMailService = {
    sendOrderConfirmationEmail: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env.NODE_ENV;

    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'STRIPE_SECRET_KEY') return 'sk_test_mock_12345';
      if (key === 'WEB_URL') return 'https://ecommerce-banglashop.netlify.app';
      if (key === 'FRONTEND_URL') return 'https://ecommerce-banglashop.netlify.app';
      return null;
    });

    service = new PaymentsService(
      mockConfigService as unknown as ConfigService,
      mockPrismaService as unknown as PrismaService,
      mockMailService as unknown as MailService
    );
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  describe('resolveWebUrl', () => {
    it('should prioritize client origin from live Netlify domain', () => {
      const result = service.resolveWebUrl('https://ecommerce-banglashop.netlify.app');
      expect(result).toBe('https://ecommerce-banglashop.netlify.app');
    });

    it('should support Netlify deploy preview origins', () => {
      const result = service.resolveWebUrl('https://deploy-preview-42--ecommerce-banglashop.netlify.app');
      expect(result).toBe('https://deploy-preview-42--ecommerce-banglashop.netlify.app');
    });

    it('should support localhost for local development when not in production', () => {
      process.env.NODE_ENV = 'development';
      const result = service.resolveWebUrl('http://localhost:3000');
      expect(result).toBe('http://localhost:3000');
    });

    it('should ignore localhost in environment variables when NODE_ENV is production and fall back to live site', () => {
      process.env.NODE_ENV = 'production';
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'WEB_URL') return 'http://localhost:3000';
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        return null;
      });

      // No client origin provided (or direct server call)
      const result = service.resolveWebUrl();
      expect(result).toBe('https://ecommerce-banglashop.netlify.app');
    });

    it('should use STRIPE_SUCCESS_URL origin when configured and not localhost in production', () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'STRIPE_SUCCESS_URL') return 'https://ecommerce-banglashop.netlify.app/order-success';
        return null;
      });

      const result = service.resolveWebUrl();
      expect(result).toBe('https://ecommerce-banglashop.netlify.app');
    });

    it('should fall back to live Netlify URL if client origin is malformed or invalid', () => {
      const result = service.resolveWebUrl('not-a-valid-url');
      expect(result).toBe('https://ecommerce-banglashop.netlify.app');
    });
  });

  describe('createCheckoutSession redirect URL construction', () => {
    it('creates a stripe checkout session with live site redirect URL', async () => {
      const mockOrder = {
        id: 'ord_123',
        orderNumber: 'BD-260904-861B',
        customerEmail: 'customer@example.com',
        deliveryZone: 'INSIDE_DHAKA',
        deliveryFee: 60,
        paymentStatus: 'PENDING',
        items: [
          {
            productTitleSnapshot: 'Classic Panjabi',
            skuSnapshot: 'PANJ-M-01',
            unitPrice: 1500,
            quantity: 1,
          },
        ],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue(mockOrder);

      // Mock stripe sessions.create
      const mockSession = {
        id: 'cs_test_session_123',
        url: 'https://checkout.stripe.com/c/pay/cs_test_session_123',
      };
      // @ts-expect-error accessing private stripe for testing
      service.stripe = {
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue(mockSession),
          } as unknown,
        },
      } as unknown;

      const res = await service.createCheckoutSession(
        'ord_123',
        'https://ecommerce-banglashop.netlify.app'
      );

      expect(res.orderNumber).toBe('BD-260904-861B');
      expect(res.checkoutUrl).toBe('https://checkout.stripe.com/c/pay/cs_test_session_123');

      // @ts-expect-error accessing private stripe for testing
      const createCallArgs = service.stripe.checkout.sessions.create.mock.calls[0][0];
      expect(createCallArgs.success_url).toBe(
        'https://ecommerce-banglashop.netlify.app/order-success?orderNumber=BD-260904-861B&session_id={CHECKOUT_SESSION_ID}'
      );
      expect(createCallArgs.cancel_url).toBe(
        'https://ecommerce-banglashop.netlify.app/checkout?orderNumber=BD-260904-861B&cancelled=true'
      );
    });
  });
});
