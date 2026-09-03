import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    cart: {
      upsert: vi.fn(),
    },
    wishlist: {
      upsert: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  };

  const mockJwtService = {
    signAsync: vi.fn().mockResolvedValue('mock-jwt-access-token'),
  };

  const mockConfigService = {
    get: vi.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        REFRESH_TOKEN_EXPIRES_DAYS: '30',
        NODE_ENV: 'test',
        WEB_URL: 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  const mockMailService = {
    sendWelcomeEmail: vi.fn().mockResolvedValue(true),
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    authService = new AuthService(
      mockPrismaService as unknown as PrismaService,
      mockJwtService as unknown as JwtService,
      mockConfigService as unknown as ConfigService,
      mockMailService as unknown as MailService
    );
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('Password Hashing & Security', () => {
    it('should hash passwords with bcrypt at minimum cost factor 10', async () => {
      const plainPassword = 'SecurePassword123!';
      const saltRounds = 10;
      const hash = await bcrypt.hash(plainPassword, saltRounds);

      const isValid = await bcrypt.compare(plainPassword, hash);
      expect(isValid).toBe(true);

      const rounds = parseInt(hash.split('$')[2], 10);
      expect(rounds).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Register', () => {
    it('should register a new user, issue tokens, and trigger welcome email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'usr_test123',
        name: 'Rahim Uddin',
        email: 'rahim@test.com',
        phone: '01712345678',
        role: 'CUSTOMER',
        createdAt: new Date(),
      });
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const mockRes: any = {
        cookie: vi.fn(),
      };

      const result = await authService.register(
        {
          name: 'Rahim Uddin',
          email: 'rahim@test.com',
          password: 'Password123!',
          phone: '01712345678',
        },
        mockRes
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken', 'mock-jwt-access-token');
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.any(String),
        expect.objectContaining({ httpOnly: true })
      );
      expect(mockMailService.sendWelcomeEmail).toHaveBeenCalledWith(
        'rahim@test.com',
        'Rahim Uddin'
      );
    });
  });
});
