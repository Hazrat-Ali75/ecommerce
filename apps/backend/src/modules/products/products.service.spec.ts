import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductsService } from './products.service';
import { PrismaService } from '../../database/prisma.service';
import {
  FashionVariantAttributesSchema,
  FootwearVariantAttributesSchema,
  ElectronicsVariantAttributesSchema,
  validateVariantAttributes,
  GetProductsQuerySchema,
} from './dto/product.dto';
import { CategoryType } from '@prisma/client';

describe('ProductsService & Variation Business Rules', () => {
  let productsService: ProductsService;

  const mockPrismaService = {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({
        _min: { basePrice: 1000 },
        _max: { basePrice: 18500 },
      }),
    },
    category: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => callback(mockPrismaService)),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    productsService = new ProductsService(mockPrismaService as unknown as PrismaService);
  });

  describe('Rule 1: Fashion & Apparel Variation Constraints', () => {
    it('should accept valid gender and size', () => {
      const valid = { gender: 'men', size: 'xl' };
      const parsed = FashionVariantAttributesSchema.parse(valid);
      expect(parsed).toEqual(valid);
    });

    it('should REJECT extra attributes like color or material', () => {
      const invalid = { gender: 'men', size: 'm', color: 'red' };
      expect(() => FashionVariantAttributesSchema.parse(invalid)).toThrow();
    });

    it('should REJECT invalid sizes not in (s, m, l, xl, xxl)', () => {
      const invalidSize = { gender: 'women', size: '38' };
      expect(() => FashionVariantAttributesSchema.parse(invalidSize)).toThrow();
    });
  });

  describe('Rule 2: Footwear & Sneakers Variation Constraints', () => {
    it('should accept valid footwear size between 5 and 10', () => {
      const valid = { gender: 'men', size: '8' };
      const parsed = FootwearVariantAttributesSchema.parse(valid);
      expect(parsed).toEqual(valid);
    });

    it('should REJECT extra attributes like material or width', () => {
      const invalid = { gender: 'men', size: '8', material: 'leather' };
      expect(() => FootwearVariantAttributesSchema.parse(invalid)).toThrow();
    });

    it('should REJECT letter sizes like "L" or "XL" for footwear', () => {
      const invalid = { gender: 'men', size: 'l' };
      expect(() => FootwearVariantAttributesSchema.parse(invalid)).toThrow();
    });
  });

  describe('Rule 3: Electronics & Gadgets Variation Constraints', () => {
    it('should accept watch with gender men or women', () => {
      const validWatch = { type: 'watch', gender: 'men' };
      const parsed = ElectronicsVariantAttributesSchema.parse(validWatch);
      expect(parsed).toEqual(validWatch);
    });

    it('should accept charger, power bank, and earbuds with zero extra fields', () => {
      expect(ElectronicsVariantAttributesSchema.parse({ type: 'charger' })).toEqual({
        type: 'charger',
      });
      expect(ElectronicsVariantAttributesSchema.parse({ type: 'power bank' })).toEqual({
        type: 'power bank',
      });
      expect(ElectronicsVariantAttributesSchema.parse({ type: 'earbuds' })).toEqual({
        type: 'earbuds',
      });
    });

    it('should REJECT watches without gender or with extra fields like storage/ram', () => {
      const invalidWatch = { type: 'watch', gender: 'men', ram: '8GB' };
      expect(() => ElectronicsVariantAttributesSchema.parse(invalidWatch)).toThrow();
    });

    it('should REJECT unauthorized electronics types (e.g. laptop, tv)', () => {
      const unauthorized = { type: 'laptop' };
      expect(() => ElectronicsVariantAttributesSchema.parse(unauthorized as any)).toThrow();
    });
  });

  describe('Rule 4: Catalog Filtering Invariants', () => {
    it('should validate query filters without size', () => {
      const query = {
        categorySlug: 'fashion-apparel',
        gender: 'men',
        brand: 'Yellow',
        minPrice: 1000,
        maxPrice: 5000,
        sort: 'price-asc',
      };
      const parsed = GetProductsQuerySchema.parse(query);
      expect(parsed.categorySlug).toBe('fashion-apparel');
      expect(parsed.gender).toBe('men');
      expect(parsed.brand).toBe('Yellow');
      // Verify size is not part of catalog query schema
      expect((parsed as any).size).toBeUndefined();
    });
  });
});
