<div align="center">

# 🇧🇩 BanglaShop

### Modern, High-Converting Bangladeshi E-Commerce Monorepo

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![NestJS](https://img.shields.io/badge/NestJS-12.0-red?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-8.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql)](https://neon.tech/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_5.7-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-ISC-green?style=flat-square)](LICENSE)

*An enterprise-grade, luxury full-stack e-commerce platform specifically engineered for the Bangladeshi consumer market, local logistics constraints, and multi-channel payment workflows.*

[Explore Features](#-key-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [Domain Rules](#-bangladeshi-business-rules) • [API Reference](#-api-endpoints)

---

</div>

## 🌟 Overview

**BanglaShop** is a high-performance e-commerce engine tailored to address the unique challenges of Bangladeshi digital retail. From 64-district tiered delivery calculations to Cash on Delivery (COD) nationwide handling and strict category variation limits, every component has been crafted with zero-compromise engineering and an editorial `ui-ux-pro-max` luxury aesthetic.

---

## ⚡ Key Features

### 🛍️ Storefront Experience
- **Editorial Brand Aesthetic**: Cormorant Garamond display serif typography paired with clean Montserrat sans-serif UI, tactile cards (`rounded-3xl`), and rich emerald accents.
- **Dynamic Catalog & Smart Filtering**: Search across Fashion, Footwear, and Electronics with quick price chips (`৳0–৳1,000`, `৳1,000–৳3,000`, `৳3,000+`), sort dropdowns, and responsive mobile filter drawers.
- **Interactive Product Details (PDP)**:
  - High-resolution hero image gallery with zoom-on-hover, sale percentage badges (`-X% OFF`), and thumbnail slider.
  - **Strict Size Selection Pills** with live inventory verification and add-to-cart gating.
  - **Interactive Size Guide Modal** with BD/UK/EU shoe sizes (foot length in cm) and apparel tailoring measurements (in inches).
  - Direct conversion options: **"Add to Cart"** and instant **"Buy Now"** routing directly to checkout.
- **Community Customer Reviews**: Star distribution bar charts with interactive rating filters (`5★`, `4★`, etc.), verified buyer badges, and full review management.
- **Saved Collections (Wishlist)**: Persistent wishlist with stock alerts and quick add-to-cart triggers.

### 🚚 Bangladeshi Logistics & Delivery Engine
- **Tiered Delivery Fees**:
  - **Inside Dhaka (Capital)**: Flat rate **৳60** (Estimated 24–48 hours).
  - **Outside Dhaka (Nationwide)**: Flat rate **৳120** (Estimated 3–5 days across all 64 districts).
- **Bangladeshi Mobile Validation**: Enforces valid 11-digit mobile operator numbers (`/^01[3-9]\d{8}$/`).
- **Real-Time Delivery Tracking**: Live milestone progress stepper (*Ordered* → *Confirmed* → *Processing* → *Shipped* → *Out for Delivery* → *Delivered*) with third-party courier consignment tracking ID assignment (Steadfast, Pathao, RedX, eCourier).

### 💳 Payments & Checkout
- **Nationwide Cash on Delivery (COD)**: First-class support with automatic parcel receipt verification.
- **Instant Online Payment**: Seamless Stripe Checkout integration for Visa, MasterCard, and American Express.
- **Coupon & Promo Engine**: Real-time coupon validator with minimum order amount and maximum discount limits.
- **Cart Synchronization**: Dual-layer Zustand store that maintains guest cart in `localStorage` and automatically syncs with the PostgreSQL database upon login.

### 🛡️ Administrative Operations Portal
- **Executive KPI Dashboard**: Total revenue (BDT `৳`), total orders, pending actions, and low-stock indicators.
- **14-Day Revenue Analytics**: Interactive revenue trend bar chart with daily order volume tooltips.
- **Logistics Distribution Bar**: Visual delivery zone breakdown comparing Inside Dhaka vs. Outside Dhaka orders.
- **Inventory Matrix**: Variant stock tracker with low-stock alerts (`≤ 5 units`) and category-constrained variations.
- **Order Fulfillment**: Dispatch workflow with courier consignment assignment and automated stock restoration on cancellation.

---

## 🛠️ Tech Stack

### Frontend Application (`apps/frontend`)
| Technology | Description |
| :--- | :--- |
| **Next.js 16 (App Router)** | React Server Components (RSC), Turbopack, and static route pre-rendering |
| **React 19** | Concurrent rendering and modern hooks (`useActionState`, `use`) |
| **Tailwind CSS + Radix UI** | Utility-first styling with accessible Headless UI / shadcn components |
| **TanStack React Query v5** | Server-state caching, automatic invalidation, and optimistic updates |
| **Zustand v5** | Persistent client-state management for guest cart, wishlist, and auth |
| **Axios** | Interceptor-enabled HTTP client with automated 401 token refresh |
| **Sonner** | Accessible, toast notification stack |

### Backend Service (`apps/backend`)
| Technology | Description |
| :--- | :--- |
| **NestJS 12** | Modular, domain-driven server architecture |
| **Prisma 8 ORM** | Type-safe database queries, schema migrations, and relational modeling |
| **PostgreSQL (Neon)** | Serverless Postgres database with SSL connection pooling |
| **Zod** | End-to-end payload schema validation via custom `ZodValidationPipe` |
| **Passport & JWT** | Dual-token auth: 15-minute access tokens + 7-day httpOnly refresh cookies |
| **Stripe SDK** | Secure payment intent and checkout session handling |
| **Cloudinary** | Cloud asset management with primary image preservation |
| **Resend** | Transactional email delivery for orders, tracking, and password reset |



## 📂 Repository Structure

```
ecommerce-bd/
├── apps/
│   ├── backend/                     # NestJS 12 API Service
│   │   ├── prisma/                  # Database schema, migrations, seed data
│   │   │   ├── schema.prisma        # Prisma data models & relations
│   │   │   └── seed.ts              # Authentic Bangladeshi seed catalog
│   │   ├── src/
│   │   │   ├── common/              # Global filters, guards, pipes, decorators
│   │   │   ├── database/            # PrismaService database abstraction
│   │   │   └── modules/             # Domain modules: auth, users, products, orders, etc.
│   │   └── test/                    # Unit, integration, and e2e test suites
│   │
│   └── frontend/                    # Next.js 16 App Router Frontend
│       ├── design-system/           # Generated tokens and typography specs
│       └── src/
│           ├── app/                 # Next.js routes: (auth), shop, product, cart, checkout, admin
│           ├── components/          # Reusable UI, layout, home, and product components
│           ├── lib/                 # API client, currency formatter (formatBDT), utilities
│           └── store/               # Zustand persistent state (cart, wishlist, auth)
│
├── .agents/                         # Domain rule validators & code quality guards
├── .env.example                     # Central environment variable template
├── AGENTS.md                        # Monorepo architecture & engineering rules
├── package.json                     # Monorepo root workspace configuration
└── README.md                        # Documentation & setup guide
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL**: Local database or a [Neon](https://neon.tech) serverless instance

### 2. Installation
Clone the repository and install all workspace dependencies:

```bash
git clone https://github.com/Hazrat-Ali75/ecommerce.git
cd ecommerce
npm install
```

### 3. Environment Setup
Copy `.env.example` into `.env` at the root and fill in your credentials:

```bash
cp .env.example .env
```

Key environment configurations:
```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"

# JWT Auth
JWT_ACCESS_SECRET="your-min-32-character-access-secret"
JWT_REFRESH_SECRET="your-min-32-character-refresh-secret"
JWT_RESET_SECRET="your-min-32-character-reset-secret"

# Cloudinary (Media Assets)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Stripe (Online Card Payments)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Resend (Emails)
RESEND_API_KEY="re_..."
EMAIL_FROM="BanglaShop <orders@yourdomain.com>"
```

### 4. Database Setup & Seeding
Generate the Prisma client, run migrations, and seed initial Bangladeshi catalog items:

```bash
# Generate Prisma Client
npm run prisma:generate --workspace=apps/backend

# Run Migrations
npm run prisma:migrate --workspace=apps/backend

# Seed Bangladeshi Catalog (Panjabis, Sarees, Sneakers, Smartwatches)
npm run prisma:seed --workspace=apps/backend
```

### 5. Running in Development
Start both the backend API and frontend storefront concurrently:

```bash
# Start Backend (http://localhost:5000)
npm run dev:backend

# Start Frontend (http://localhost:3000)
npm run dev:frontend
```

---

## 🧪 Testing & Verification

Run the test and verification suites across all workspaces:

```bash
# Strict TypeScript Typechecking (0 errors required)
npm run typecheck

# Code Linting
npm run lint

# Backend Unit & Integration Tests (Vitest)
npm run test

# Production Build Verification
npm run build
```

---

## 📡 API Endpoints

The NestJS backend exposes RESTful endpoints with Zod validation and JWT authentication:

| Endpoint | Method | Description | Auth |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Customer registration with phone validation | Public |
| `/api/auth/login` | `POST` | Authenticate and issue JWT + httpOnly cookie | Public |
| `/api/auth/refresh` | `POST` | Refresh expired access tokens | Cookie |
| `/api/products` | `GET` | Catalog query with category, brand, and price filters | Public |
| `/api/products/:slug` | `GET` | Product details with variant sizes and stock | Public |
| `/api/cart/sync` | `POST` | Merge guest localStorage cart with database cart | JWT |
| `/api/coupons/validate` | `POST` | Verify coupon code against cart subtotal | Public |
| `/api/orders/checkout` | `POST` | Place order (Cash on Delivery or Stripe session) | JWT |
| `/api/orders/track` | `GET` | Public order delivery timeline tracker | Public |
| `/api/reviews` | `POST` | Submit verified customer review & star rating | JWT |
| `/api/analytics/summary` | `GET` | Executive dashboard revenue and zone analytics | Admin |
| `/api/orders/admin/:id/status` | `PATCH` | Update delivery milestone and assign courier ID | Admin |

---

## 🔒 Security & Quality Standards

- **Strict Typing**: Zero `any` types permitted across all TypeScript configurations.
- **Race Condition Protection**: Prisma atomic transactions (`prisma.$transaction`) guard stock decrements on order placements.
- **Credential Storage**: Passwords hashed using `bcrypt` with cost factor 10.
- **Sanitized Errors**: Uniform JSON error responses via global `HttpExceptionFilter`.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
