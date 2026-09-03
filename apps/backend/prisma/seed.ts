import 'dotenv/config';
import { PrismaClient, Role, CategoryType, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed with authentic Bangladeshi categories and products...');

  // 1. Seed Admin User
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@marketplace.com').toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123456!';
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.SUPER_ADMIN,
      passwordHash,
    },
    create: {
      name: 'Super Admin',
      email: adminEmail,
      passwordHash,
      phone: '01700000001',
      role: Role.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
      cart: { create: {} },
      wishlist: { create: {} },
    },
  });
  console.log(`✅ Super Admin configured: ${admin.email}`);

  // 2. Seed Default Store Settings (Inside Dhaka ৳60, Outside Dhaka ৳120)
  const existingSetting = await prisma.setting.findFirst();
  if (!existingSetting) {
    await prisma.setting.create({
      data: {
        deliveryFeeInsideDhaka: 60.0,
        deliveryFeeOutsideDhaka: 120.0,
        storePhone: '+8801700000000',
        storeEmail: 'support@banglacart.com',
      },
    });
    console.log('✅ Default delivery rates seeded: Inside Dhaka ৳60, Outside Dhaka ৳120');
  }

  // 3. Seed Promotional Banners for Hero Carousel
  const bannerCount = await prisma.banner.count();
  if (bannerCount === 0) {
    await prisma.banner.createMany({
      data: [
        {
          title: 'Festive Season Grand Sale',
          subtitle: 'Up to 50% off on premium Panjabi, Sarees, and Kurtas',
          badgeText: 'Eid Special 2026',
          imageUrl:
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop',
          linkUrl: '/shop?category=fashion-apparel',
          sortOrder: 1,
          isActive: true,
        },
        {
          title: 'Premium Sneakers & Footwear',
          subtitle: 'Original footwear from Apex, Bata, and Lotto with Sizes 5–10',
          badgeText: 'Nationwide Delivery',
          imageUrl:
            'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop',
          linkUrl: '/shop?category=footwear-sneakers',
          sortOrder: 2,
          isActive: true,
        },
        {
          title: 'Genuine Smart Gadgets & Audio',
          subtitle: 'Authentic Smartwatches, Fast Chargers, Power Banks & TWS Earbuds',
          badgeText: 'Official Warranty',
          imageUrl:
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop',
          linkUrl: '/shop?category=electronics-gadgets',
          sortOrder: 3,
          isActive: true,
        },
      ],
    });
    console.log('✅ Promotional Hero Carousel banners seeded');
  }

  // 4. Seed the 3 Root Categories strictly matching business rules
  console.log('📁 Seeding Root Categories...');
  const fashionCategory = await prisma.category.upsert({
    where: { slug: 'fashion-apparel' },
    update: { type: CategoryType.FASHION },
    create: {
      name: 'Fashion & Apparel',
      slug: 'fashion-apparel',
      description: 'Authentic Bangladeshi traditional and modern clothing for Men, Women, and Kids',
      type: CategoryType.FASHION,
      imageUrl:
        'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop',
    },
  });

  const footwearCategory = await prisma.category.upsert({
    where: { slug: 'footwear-sneakers' },
    update: { type: CategoryType.FOOTWEAR },
    create: {
      name: 'Footwear & Sneakers',
      slug: 'footwear-sneakers',
      description: 'Comfortable sneakers, formal leather shoes, and daily footwear in sizes 5 to 10',
      type: CategoryType.FOOTWEAR,
      imageUrl:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
    },
  });

  const electronicsCategory = await prisma.category.upsert({
    where: { slug: 'electronics-gadgets' },
    update: { type: CategoryType.ELECTRONICS },
    create: {
      name: 'Electronics & Gadgets',
      slug: 'electronics-gadgets',
      description: 'Authentic Smartwatches, Fast Chargers, Power Banks, and Earbuds',
      type: CategoryType.ELECTRONICS,
      imageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    },
  });

  console.log('✅ Categories verified: Fashion & Apparel, Footwear & Sneakers, Electronics & Gadgets');

  // 5. Seed Products & Strictly Validated Variants
  console.log('🛍️ Seeding Products and Strict Variants...');

  // Helper function to seed product if not existing
  async function seedProduct(productData: {
    title: string;
    slug: string;
    description: string;
    shortDescription: string;
    basePrice: number;
    discountPrice?: number;
    brand: string;
    skuPrefix: string;
    categoryId: string;
    isFeatured?: boolean;
    tags: string[];
    images: Array<{ url: string; publicId: string; isPrimary?: boolean; sortOrder?: number }>;
    variants: Array<{
      sku: string;
      price: number;
      discountPrice?: number;
      stockQuantity: number;
      attributes: Prisma.InputJsonValue;
    }>;
  }) {
    const existing = await prisma.product.findUnique({
      where: { slug: productData.slug },
    });

    if (existing) {
      return existing;
    }

    return prisma.product.create({
      data: {
        title: productData.title,
        slug: productData.slug,
        description: productData.description,
        shortDescription: productData.shortDescription,
        basePrice: productData.basePrice,
        discountPrice: productData.discountPrice || null,
        brand: productData.brand,
        skuPrefix: productData.skuPrefix,
        categoryId: productData.categoryId,
        isFeatured: productData.isFeatured ?? false,
        isActive: true,
        tags: productData.tags,
        images: {
          create: productData.images.map((img, idx) => ({
            url: img.url,
            publicId: img.publicId,
            isPrimary: img.isPrimary ?? idx === 0,
            sortOrder: img.sortOrder ?? idx,
          })),
        },
        variants: {
          create: productData.variants.map((v) => ({
            sku: v.sku,
            price: v.price,
            discountPrice: v.discountPrice || null,
            stockQuantity: v.stockQuantity,
            attributes: v.attributes,
          })),
        },
      },
    });
  }

  // --- Category 1: Fashion & Apparel (gender: men/women/kids, size: s/m/l/xl/xxl) ---
  await seedProduct({
    title: 'Aarong Exclusive Jamdani Silk Saree',
    slug: 'aarong-exclusive-jamdani-silk-saree',
    description:
      'Handcrafted traditional Dhakai Jamdani saree woven by master artisans in Narayanganj. Features intricate geometric motifs on fine Mulberry silk. Ideal for Eid, weddings, and celebratory occasions.',
    shortDescription: 'Masterpiece Dhakai Jamdani handloom silk saree for women',
    basePrice: 8500,
    discountPrice: 7990,
    brand: 'Aarong',
    skuPrefix: 'ARG-JMD',
    categoryId: fashionCategory.id,
    isFeatured: true,
    tags: ['saree', 'jamdani', 'silk', 'eid', 'traditional', 'aarong'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop',
        publicId: 'aarong_saree_1',
        isPrimary: true,
      },
      {
        url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=800&auto=format&fit=crop',
        publicId: 'aarong_saree_2',
      },
    ],
    variants: [
      { sku: 'ARG-JMD-W-S', price: 7990, stockQuantity: 15, attributes: { gender: 'women', size: 's' } },
      { sku: 'ARG-JMD-W-M', price: 7990, stockQuantity: 25, attributes: { gender: 'women', size: 'm' } },
      { sku: 'ARG-JMD-W-L', price: 7990, stockQuantity: 18, attributes: { gender: 'women', size: 'l' } },
    ],
  });

  await seedProduct({
    title: 'Yellow Embroidered Cotton Panjabi',
    slug: 'yellow-embroidered-cotton-panjabi',
    description:
      'Contemporary tailored Panjabi crafted from 100% breathable organic cotton. Features subtle thread embroidery along the placket and mandarin collar. Cut in a modern regular fit for festive celebrations.',
    shortDescription: 'Festive embroidered 100% cotton Panjabi for men',
    basePrice: 3450,
    discountPrice: 3150,
    brand: 'Yellow',
    skuPrefix: 'YLW-PNJ',
    categoryId: fashionCategory.id,
    isFeatured: true,
    tags: ['panjabi', 'yellow', 'cotton', 'men', 'eid', 'festive'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?q=80&w=800&auto=format&fit=crop',
        publicId: 'yellow_panjabi_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'YLW-PNJ-M-M', price: 3150, stockQuantity: 30, attributes: { gender: 'men', size: 'm' } },
      { sku: 'YLW-PNJ-M-L', price: 3150, stockQuantity: 40, attributes: { gender: 'men', size: 'l' } },
      { sku: 'YLW-PNJ-M-XL', price: 3150, stockQuantity: 25, attributes: { gender: 'men', size: 'xl' } },
      { sku: 'YLW-PNJ-M-XXL', price: 3150, stockQuantity: 12, attributes: { gender: 'men', size: 'xxl' } },
    ],
  });

  await seedProduct({
    title: 'Sailor Slim-Fit Oxford Casual Shirt',
    slug: 'sailor-slim-fit-oxford-casual-shirt',
    description:
      'Classic button-down Oxford cotton shirt with durable construction, comfortable stretch, and breathable fabric suited for warm climates. Perfect for smart-casual wear and university days.',
    shortDescription: 'Slim-fit Oxford button-down cotton casual shirt',
    basePrice: 1950,
    discountPrice: 1750,
    brand: 'Sailor',
    skuPrefix: 'SLR-SHT',
    categoryId: fashionCategory.id,
    tags: ['shirt', 'sailor', 'oxford', 'casual', 'men'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop',
        publicId: 'sailor_shirt_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'SLR-SHT-M-S', price: 1750, stockQuantity: 20, attributes: { gender: 'men', size: 's' } },
      { sku: 'SLR-SHT-M-M', price: 1750, stockQuantity: 35, attributes: { gender: 'men', size: 'm' } },
      { sku: 'SLR-SHT-M-L', price: 1750, stockQuantity: 30, attributes: { gender: 'men', size: 'l' } },
      { sku: 'SLR-SHT-M-XL', price: 1750, stockQuantity: 15, attributes: { gender: 'men', size: 'xl' } },
    ],
  });

  await seedProduct({
    title: 'Richman Executive Formal Blazer',
    slug: 'richman-executive-formal-blazer',
    description:
      'Single-breasted notched lapel formal blazer constructed from fine tropical poly-wool blend. Features dual back vents, satin inner lining, and structured shoulders for meetings and corporate wear.',
    shortDescription: 'Tailored executive formal blazer for business & formal wear',
    basePrice: 6200,
    brand: 'Richman',
    skuPrefix: 'RCH-BLZ',
    categoryId: fashionCategory.id,
    tags: ['blazer', 'formal', 'richman', 'suit', 'men'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
        publicId: 'richman_blazer_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'RCH-BLZ-M-M', price: 6200, stockQuantity: 10, attributes: { gender: 'men', size: 'm' } },
      { sku: 'RCH-BLZ-M-L', price: 6200, stockQuantity: 14, attributes: { gender: 'men', size: 'l' } },
      { sku: 'RCH-BLZ-M-XL', price: 6200, stockQuantity: 8, attributes: { gender: 'men', size: 'xl' } },
      { sku: 'RCH-BLZ-M-XXL', price: 6200, stockQuantity: 5, attributes: { gender: 'men', size: 'xxl' } },
    ],
  });

  await seedProduct({
    title: 'Taaga Contemporary Ethnic Kurti',
    slug: 'taaga-contemporary-ethnic-kurti',
    description:
      'Chic everyday ethnic Kurti featuring hand block prints on pure khadi cotton with front tassel accents and asymmetric hemlines. Easy to pair with palazzo or denim.',
    shortDescription: 'Modern ethnic cotton Kurti for women by Taaga',
    basePrice: 2450,
    brand: 'Taaga',
    skuPrefix: 'TGA-KRT',
    categoryId: fashionCategory.id,
    tags: ['kurti', 'taaga', 'women', 'ethnic', 'cotton'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
        publicId: 'taaga_kurti_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'TGA-KRT-W-S', price: 2450, stockQuantity: 18, attributes: { gender: 'women', size: 's' } },
      { sku: 'TGA-KRT-W-M', price: 2450, stockQuantity: 28, attributes: { gender: 'women', size: 'm' } },
      { sku: 'TGA-KRT-W-L', price: 2450, stockQuantity: 22, attributes: { gender: 'women', size: 'l' } },
      { sku: 'TGA-KRT-W-XL', price: 2450, stockQuantity: 10, attributes: { gender: 'women', size: 'xl' } },
    ],
  });

  await seedProduct({
    title: 'Kids Festive Cotton Kurta Set',
    slug: 'kids-festive-cotton-kurta-set',
    description:
      'Festive cotton Kurta with soft cotton pajama for kids. Hypoallergenic soft fabric tailored for comfortable movement during festivals and family gatherings.',
    shortDescription: 'Vibrant and comfy 2-piece festive kurta set for kids',
    basePrice: 1450,
    brand: 'Yellow',
    skuPrefix: 'YLW-KDS',
    categoryId: fashionCategory.id,
    tags: ['kids', 'kurta', 'yellow', 'festive'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?q=80&w=800&auto=format&fit=crop',
        publicId: 'kids_kurta_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'YLW-KDS-K-S', price: 1450, stockQuantity: 15, attributes: { gender: 'kids', size: 's' } },
      { sku: 'YLW-KDS-K-M', price: 1450, stockQuantity: 20, attributes: { gender: 'kids', size: 'm' } },
      { sku: 'YLW-KDS-K-L', price: 1450, stockQuantity: 15, attributes: { gender: 'kids', size: 'l' } },
    ],
  });

  // --- Category 2: Footwear & Sneakers (gender: men/women/kids, size: 5 to 10) ---
  await seedProduct({
    title: 'Apex Maverick Genuine Leather Loafers',
    slug: 'apex-maverick-genuine-leather-loafers',
    description:
      'Hand-burnished Bangladeshi full-grain cow leather slip-on loafers. Features memory-foam cushioned insoles, flexible rubber outsole, and classic horsebit metal hardware.',
    shortDescription: 'Full-grain leather formal slip-on loafers for men',
    basePrice: 4290,
    brand: 'Apex',
    skuPrefix: 'APX-MVR',
    categoryId: footwearCategory.id,
    isFeatured: true,
    tags: ['apex', 'leather', 'loafers', 'formal', 'men', 'shoes'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?q=80&w=800&auto=format&fit=crop',
        publicId: 'apex_loafer_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'APX-MVR-M-6', price: 4290, stockQuantity: 12, attributes: { gender: 'men', size: '6' } },
      { sku: 'APX-MVR-M-7', price: 4290, stockQuantity: 20, attributes: { gender: 'men', size: '7' } },
      { sku: 'APX-MVR-M-8', price: 4290, stockQuantity: 25, attributes: { gender: 'men', size: '8' } },
      { sku: 'APX-MVR-M-9', price: 4290, stockQuantity: 18, attributes: { gender: 'men', size: '9' } },
      { sku: 'APX-MVR-M-10', price: 4290, stockQuantity: 10, attributes: { gender: 'men', size: '10' } },
    ],
  });

  await seedProduct({
    title: 'Bata Power Air Running Sneakers',
    slug: 'bata-power-air-running-sneakers',
    description:
      'Engineered mesh upper with responsive Air-Cushion midsole for high shock absorption and energy return. Breathable, lightweight, and built for daily morning runs or urban commuting.',
    shortDescription: 'Shock-absorbing breathable athletic running shoes',
    basePrice: 2799,
    discountPrice: 2499,
    brand: 'Bata',
    skuPrefix: 'BAT-PWR',
    categoryId: footwearCategory.id,
    isFeatured: true,
    tags: ['bata', 'sneakers', 'running', 'power', 'men'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
        publicId: 'bata_power_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'BAT-PWR-M-7', price: 2499, stockQuantity: 15, attributes: { gender: 'men', size: '7' } },
      { sku: 'BAT-PWR-M-8', price: 2499, stockQuantity: 25, attributes: { gender: 'men', size: '8' } },
      { sku: 'BAT-PWR-M-9', price: 2499, stockQuantity: 20, attributes: { gender: 'men', size: '9' } },
      { sku: 'BAT-PWR-M-10', price: 2499, stockQuantity: 10, attributes: { gender: 'men', size: '10' } },
    ],
  });

  await seedProduct({
    title: 'Lotto Speedster Lightweight Trainers',
    slug: 'lotto-speedster-lightweight-trainers',
    description:
      'Italian-designed lifestyle athletic sneakers with lightweight EVA phylon sole and seamless knitted upper. High grip herringbone tread pattern for city walking.',
    shortDescription: 'Flexible lightweight knitted lifestyle sneakers',
    basePrice: 2190,
    brand: 'Lotto',
    skuPrefix: 'LTT-SPD',
    categoryId: footwearCategory.id,
    tags: ['lotto', 'trainers', 'sneakers', 'casual', 'men'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?q=80&w=800&auto=format&fit=crop',
        publicId: 'lotto_speed_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'LTT-SPD-M-6', price: 2190, stockQuantity: 10, attributes: { gender: 'men', size: '6' } },
      { sku: 'LTT-SPD-M-7', price: 2190, stockQuantity: 18, attributes: { gender: 'men', size: '7' } },
      { sku: 'LTT-SPD-M-8', price: 2190, stockQuantity: 22, attributes: { gender: 'men', size: '8' } },
      { sku: 'LTT-SPD-M-9', price: 2190, stockQuantity: 14, attributes: { gender: 'men', size: '9' } },
    ],
  });

  await seedProduct({
    title: 'Apex Nina Comfort Block Heels',
    slug: 'apex-nina-comfort-block-heels',
    description:
      'Chic 2-inch block heels engineered with orthotic arch support, cushioned footbed, and slip-resistant rubber heel cap. Stylish yet comfortable for day-long office and event wear.',
    shortDescription: 'Cushioned 2-inch block heels for women by Apex',
    basePrice: 3150,
    brand: 'Apex',
    skuPrefix: 'APX-NNA',
    categoryId: footwearCategory.id,
    tags: ['apex', 'heels', 'women', 'formal', 'shoes'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800&auto=format&fit=crop',
        publicId: 'apex_nina_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'APX-NNA-W-5', price: 3150, stockQuantity: 10, attributes: { gender: 'women', size: '5' } },
      { sku: 'APX-NNA-W-6', price: 3150, stockQuantity: 18, attributes: { gender: 'women', size: '6' } },
      { sku: 'APX-NNA-W-7', price: 3150, stockQuantity: 20, attributes: { gender: 'women', size: '7' } },
      { sku: 'APX-NNA-W-8', price: 3150, stockQuantity: 12, attributes: { gender: 'women', size: '8' } },
    ],
  });

  await seedProduct({
    title: 'Bata Comfit Ergonomic Slip-Ons',
    slug: 'bata-comfit-ergonomic-slip-ons',
    description:
      'Ultra-soft everyday slip-on flats from Bata Comfit collection. Designed with high-density foam padding and breathable lining to prevent foot fatigue.',
    shortDescription: 'Everyday ergonomic comfort slip-on flats for women',
    basePrice: 1890,
    brand: 'Bata',
    skuPrefix: 'BAT-CMF',
    categoryId: footwearCategory.id,
    tags: ['bata', 'comfit', 'women', 'flats', 'casual'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?q=80&w=800&auto=format&fit=crop',
        publicId: 'bata_comfit_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'BAT-CMF-W-5', price: 1890, stockQuantity: 14, attributes: { gender: 'women', size: '5' } },
      { sku: 'BAT-CMF-W-6', price: 1890, stockQuantity: 24, attributes: { gender: 'women', size: '6' } },
      { sku: 'BAT-CMF-W-7', price: 1890, stockQuantity: 20, attributes: { gender: 'women', size: '7' } },
      { sku: 'BAT-CMF-W-8', price: 1890, stockQuantity: 10, attributes: { gender: 'women', size: '8' } },
    ],
  });

  await seedProduct({
    title: 'Lotto Junior Active Sneakers',
    slug: 'lotto-junior-active-sneakers',
    description:
      'Durable kids sneakers with dual hook-and-loop velcro straps for easy on and off. Reinforced toe cap and non-marking grippy rubber sole for playground activities.',
    shortDescription: 'Durable velcro strap athletic sneakers for kids',
    basePrice: 1650,
    brand: 'Lotto',
    skuPrefix: 'LTT-JNR',
    categoryId: footwearCategory.id,
    tags: ['lotto', 'kids', 'sneakers', 'velcro'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?q=80&w=800&auto=format&fit=crop',
        publicId: 'lotto_junior_1',
        isPrimary: true,
      },
    ],
    variants: [
      { sku: 'LTT-JNR-K-5', price: 1650, stockQuantity: 15, attributes: { gender: 'kids', size: '5' } },
      { sku: 'LTT-JNR-K-6', price: 1650, stockQuantity: 20, attributes: { gender: 'kids', size: '6' } },
      { sku: 'LTT-JNR-K-7', price: 1650, stockQuantity: 18, attributes: { gender: 'kids', size: '7' } },
    ],
  });

  // --- Category 3: Electronics & Gadgets (type: watch [men/women], charger, power bank, earbuds) ---
  await seedProduct({
    title: 'Amazfit GTR 4 AMOLED Smartwatch',
    slug: 'amazfit-gtr-4-amoled-smartwatch',
    description:
      'Flagship smartwatch featuring a 1.43" HD AMOLED display, dual-band circularly-polarized GPS antenna, 150+ sports modes, Bluetooth phone calls, and up to 14 days of battery life.',
    shortDescription: 'Premium AMOLED GPS smartwatch for men with Bluetooth calling',
    basePrice: 18500,
    discountPrice: 17200,
    brand: 'Amazfit',
    skuPrefix: 'AMZ-GTR4',
    categoryId: electronicsCategory.id,
    isFeatured: true,
    tags: ['amazfit', 'smartwatch', 'watch', 'gps', 'amoled', 'gadgets'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=800&auto=format&fit=crop',
        publicId: 'amazfit_gtr4_1',
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'AMZ-GTR4-M',
        price: 17200,
        stockQuantity: 25,
        attributes: { type: 'watch', gender: 'men' },
      },
    ],
  });

  await seedProduct({
    title: 'Haylou Solar Plus RT3 AMOLED Smartwatch',
    slug: 'haylou-solar-plus-rt3-smartwatch',
    description:
      'Sleek 1.43" AMOLED round display with 466x466 resolution. Bluetooth 5.3 phone calls, SpO2 monitor, continuous heart rate tracking, and female cycle management in an elegant rose casing.',
    shortDescription: 'Elegant AMOLED calling smartwatch for women',
    basePrice: 4850,
    brand: 'Haylou',
    skuPrefix: 'HYL-RT3',
    categoryId: electronicsCategory.id,
    isFeatured: true,
    tags: ['haylou', 'smartwatch', 'watch', 'women', 'bluetooth-calling'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&auto=format&fit=crop',
        publicId: 'haylou_rt3_1',
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'HYL-RT3-W',
        price: 4850,
        stockQuantity: 30,
        attributes: { type: 'watch', gender: 'women' },
      },
    ],
  });

  await seedProduct({
    title: 'Anker 735 GaNPrime 65W Fast Charger',
    slug: 'anker-735-ganprime-65w-fast-charger',
    description:
      'High-speed 3-port wall charger powered by GaNPrime technology. Features 2 USB-C ports and 1 USB-A port with PowerIQ 4.0 dynamic power distribution. Fast charges laptops, tablets, and phones simultaneously.',
    shortDescription: 'Compact 65W 3-port GaN fast wall charger by Anker',
    basePrice: 3650,
    brand: 'Anker',
    skuPrefix: 'ANK-735',
    categoryId: electronicsCategory.id,
    tags: ['anker', 'charger', 'gan', 'fast-charging', 'usb-c'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=800&auto=format&fit=crop',
        publicId: 'anker_charger_1',
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'ANK-735-STD',
        price: 3650,
        stockQuantity: 40,
        attributes: { type: 'charger' },
      },
    ],
  });

  await seedProduct({
    title: 'Baseus Blade 100W 20000mAh Ultra-Thin Power Bank',
    slug: 'baseus-blade-100w-20000mah-power-bank',
    description:
      'Remarkably slim 18mm laptop-grade power bank with dual USB-C 100W PD input/output and dual USB-A QC fast ports. Digital status screen displaying power, voltage, and remaining recharge time.',
    shortDescription: 'Slim 100W PD 20,000mAh laptop & phone power bank',
    basePrice: 4990,
    brand: 'Baseus',
    skuPrefix: 'BSS-BLD',
    categoryId: electronicsCategory.id,
    tags: ['baseus', 'power-bank', '100w', 'laptop-charging', 'fast-charge'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1609592807664-42b08fa16086?q=80&w=800&auto=format&fit=crop',
        publicId: 'baseus_blade_1',
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'BSS-BLD-100W',
        price: 4990,
        stockQuantity: 35,
        attributes: { type: 'power bank' },
      },
    ],
  });

  await seedProduct({
    title: 'Anker Soundcore Liberty 4 NC Earbuds',
    slug: 'anker-soundcore-liberty-4-nc-earbuds',
    description:
      'High-performance TWS earbuds reducing up to 98.5% of external noise with adaptive ANC 2.0. Hi-Res Wireless certified with LDAC, 11mm custom drivers, and 50 hours of total playtime.',
    shortDescription: 'Adaptive ANC wireless earbuds with Hi-Res wireless audio',
    basePrice: 7800,
    discountPrice: 7200,
    brand: 'Anker',
    skuPrefix: 'ANK-L4NC',
    categoryId: electronicsCategory.id,
    isFeatured: true,
    tags: ['anker', 'soundcore', 'earbuds', 'anc', 'wireless-audio', 'tws'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
        publicId: 'soundcore_l4nc_1',
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'ANK-L4NC-STD',
        price: 7200,
        stockQuantity: 30,
        attributes: { type: 'earbuds' },
      },
    ],
  });

  await seedProduct({
    title: 'Xiaomi Redmi Buds 5 Pro Wireless Earbuds',
    slug: 'xiaomi-redmi-buds-5-pro',
    description:
      'Coaxial dual-driver system producing clear treble and rich bass. 52dB deep active noise cancellation with 4kHz ultra-wide frequency coverage and IP54 dust and water resistance.',
    shortDescription: '52dB deep ANC dual-driver wireless earbuds by Xiaomi',
    basePrice: 4250,
    brand: 'Xiaomi',
    skuPrefix: 'XMI-RB5P',
    categoryId: electronicsCategory.id,
    tags: ['xiaomi', 'redmi', 'earbuds', 'tws', 'noise-cancelling'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?q=80&w=800&auto=format&fit=crop',
        publicId: 'xiaomi_buds5_1',
        isPrimary: true,
      },
    ],
    variants: [
      {
        sku: 'XMI-RB5P-STD',
        price: 4250,
        stockQuantity: 45,
        attributes: { type: 'earbuds' },
      },
    ],
  });

  const totalProducts = await prisma.product.count();
  const totalVariants = await prisma.productVariant.count();
  console.log(`🎉 Seed complete: ${totalProducts} products and ${totalVariants} variants active in database!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
