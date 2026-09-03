# Workspace Rules & Guidelines: Bangladeshi E-Commerce Application

These rules apply across the entire repository (`apps/backend` and `apps/frontend`). Every agent and developer must strictly adhere to these guidelines.

---

## 1. Domain & Business Rules (STRICT)

### A. Category & Variation Constraints
Do NOT add extra variation fields (such as color, material, RAM, storage, etc.). Variations are strictly limited to:
1. **Fashion & Apparel**:
   - `gender`: `men`, `women`, `kids`
   - `size`: `s`, `m`, `l`, `xl`, `xxl` *(Selected on Product Details Page ONLY)*
   - `brand`: Brand name string
2. **Footwear & Sneakers**:
   - `gender`: `men`, `women`, `kids`
   - `size`: `5`, `6`, `7`, `8`, `9`, `10` *(Selected on Product Details Page ONLY)*
   - `brand`: Brand name string
3. **Electronics & Gadgets**:
   - `type`: `watch` (with target gender: `men`, `women`), `charger`, `power bank`, `earbuds`
   - `brand`: Brand name string

### B. Catalog Filtering vs. Product Page Rules
- **Catalog Sidebar Filter**:
  - **NEVER** include `size` in the sidebar filters for Fashion or Footwear.
  - Sidebar filters are strictly: Category, Gender, Brand, and Price slider.
- **Product Details Page**:
  - Size selection is handled strictly on the individual Product Details Page via interactive selector pills (`[ S ]`, `[ M ]`, etc. or `[ 5 ]`, `[ 6 ]`, etc.).
  - Selecting a size checks live stock before permitting "Add to Cart".

### C. Bangladeshi Market Logistics & Pricing
- **Currency**: Bangladeshi Taka (`BDT` - symbol `৳`). Always display prices formatted as `৳1,250`.
- **Delivery Fees**:
  - Inside Dhaka (Capital): Flat rate ৳60 (Default). Estimated 24–48 hours.
  - Outside Dhaka: Flat rate ৳120 (Default). Estimated 3–5 days across 64 districts.
- **Customer Phone Numbers**:
  - Must validate Bangladeshi 11-digit mobile numbers: `/^01[3-9]\d{8}$/`.
- **Payment Methods**:
  - **Cash on Delivery (COD)**: Always available nationwide.
  - **Instant Payment**: Stripe checkout.

---

## 2. Architecture & Tech Stack Rules

### A. Backend (NestJS 12, Prisma 8, PostgreSQL)
- **Module Separation**: Keep modules domain-focused (`auth`, `users`, `categories`, `products`, `cart`, `wishlist`, `orders`, `payments`, `inventory`, `analytics`, `upload`, `mail`, `settings`).
- **Validation**: Validate all inputs using **Zod** schemas and a global `ZodValidationPipe`.
- **Authentication**:
  - Short-lived JWT Access Tokens (15m).
  - Long-lived Refresh Tokens (7d) stored hashed in the database and issued via `httpOnly` secure cookies.
  - Password Reset Tokens must have 1-hour expiration and be invalidated upon use.
  - Passwords must be hashed using `bcrypt` with a minimum cost factor of 10.
- **Database (Prisma & Neon Postgres)**:
  - Never run raw, unparameterized SQL queries.
  - Always use transactions (`prisma.$transaction`) when creating orders, decrementing variant stock, or syncing cart items.
  - Add database indexes on foreign keys and lookup columns (`cartId`, `wishlistId`, `slug`, `orderNumber`).
- **External Services**:
  - Image uploads: Exclusively through Cloudinary with proper publicId retention for deletions.
  - Transactional emails: Exclusively through Resend (welcome, order confirmation, tracking update, password reset).

### B. Frontend (Next.js 16/15, Tailwind, shadcn/ui)
- **App Router Conventions**:
  - Group routes logically: `(auth)`, `(storefront)`, `(dashboard)`, `admin`.
  - Prefer React Server Components (RSC) for initial page renders and SEO where appropriate; use `"use client"` for interactive stateful components.
- **State Management**:
  - **Client & Cart State**: **Zustand** with `persist` middleware for guest cart and wishlist.
  - **Server State**: **TanStack Query** (`@tanstack/react-query`) for cached queries and optimistic updates.
  - **HTTP Client**: Centralized **Axios** instance with interceptors to automatically refresh access tokens on 401 responses.
- **UI Components**:
  - Use **shadcn/ui** and Radix primitives.
  - Embla Carousel for hero banner slider.
  - Toast notifications via **Sonner**.
  - Accessible forms with `react-hook-form` + `@hookform/resolvers/zod`.

---

## 3. Code Quality & Engineering Standards

### A. TypeScript Strictness
- `strict: true` must be enabled in `tsconfig.json`.
- **No `any` types**: Explicitly define interfaces or Zod-inferred types for all requests, responses, models, and props.
- Use discriminating unions for variant attributes.

### B. Error Handling & Resilience
- NestJS: All unhandled exceptions must be caught by a global `HttpExceptionFilter` returning consistent JSON error responses:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "errors": [...],
    "timestamp": "2026-09-03T09:55:00.000Z",
    "path": "/api/products"
  }
  ```
- Next.js: Wrap client mutations in try/catch or use TanStack Query `onError` hooks with descriptive user toast messages.

### C. Testing & Verification
- Unit test services for:
  - Cart sync logic (merging guest cart with DB cart).
  - Delivery charge calculations (Inside Dhaka vs. Outside Dhaka).
  - Inventory decrement & stock protection against race conditions.
  - Strict variant validation (preventing unauthorized sizes or extra attributes).
- Always verify builds compile with zero TypeScript errors: `npm run build`.

---

## 4. Mandatory Phased Delivery Workflow

Every phase and major milestone must strictly follow this exact 4-step sequence:
1. **Implement Feature / Phase**: Build only the components, endpoints, or models planned for the current phase.
2. **Review Code Quality**: Run TypeScript check (`tsc --noEmit`), linting (`eslint`), and review code against `code-quality-guard` and `ecommerce-business-rules`.
3. **Test Feature**: Execute automated tests (`npm test`), build verification (`npm run build`), and feature verification steps.
4. **STOP & Await User Command (MANDATORY)**:
   - Provide a clear summary of accomplishments, code quality results, and test outcomes.
   - **DO NOT proceed to the next phase automatically.**
   - Explicitly halt and wait for the user's review and explicit command to proceed to the next phase.
