import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting Phase 2 database seed...');

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

  console.log(`✅ Super Admin configured: ${admin.email} (ID: ${admin.id})`);

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
          title: 'Premium Sneakers & Streetwear',
          subtitle: 'Explore original footwear from Apex, Bata, and top global brands',
          badgeText: 'Sizes 5–10 Available',
          imageUrl:
            'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop',
          linkUrl: '/shop?category=footwear-sneakers',
          sortOrder: 2,
          isActive: true,
        },
        {
          title: 'Smart Gadgets & Audio Gear',
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

  console.log('🎉 Phase 2 Database seed completed successfully!');
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
