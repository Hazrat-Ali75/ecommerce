---
name: code-quality-guard
description: >-
  Audits, enforces, and validates code quality, TypeScript strict typing, linting, formatting,
  security standards, and test suites across the NestJS backend and Next.js frontend.
  Use when reviewing code, refactoring, adding new features, or running pre-commit and build verifications.
---

# Code Quality Guard: Standards & Verification Procedures

This skill provides comprehensive instructions, checklists, and commands to maintain pristine code quality across both the NestJS API and Next.js frontend applications.

---

## 1. Quality Checklist by Layer

### A. TypeScript Strictness
- [ ] No explicit or implicit `any` types. All variables, parameters, and return types must be strongly typed.
- [ ] Strict null checks enabled (`strictNullChecks: true`).
- [ ] Explicit interfaces and DTOs for all network contracts (request bodies, query params, responses).
- [ ] Zod schemas used to infer TypeScript types: `type ProductDto = z.infer<typeof ProductSchema>`.

### B. NestJS Backend Quality Standards
- [ ] **Dependency Injection**: Follow NestJS DI container patterns; never instantiate services manually with `new Service()`.
- [ ] **Data Transfer Objects (DTOs)**: All request payloads validated at runtime via `ZodValidationPipe`.
- [ ] **Exception Handling**: Use built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`, `ForbiddenException`). All unexpected errors caught by a global `HttpExceptionFilter`.
- [ ] **Prisma Best Practices**:
  - Always select only necessary fields in large queries (`select: { id: true, title: true }`).
  - Use database transactions (`prisma.$transaction`) for compound state changes (e.g. order placement + stock reduction).
  - Explicit relations and cascades defined in `schema.prisma`.
- [ ] **Security**:
  - Passwords hashed with `bcrypt` (minimum 10 salt rounds).
  - JWT access tokens short-lived (15 min); refresh tokens stored securely in `httpOnly` cookies and hashed in the database.
  - CORS strictly configured to allow only the frontend origin.

### C. Next.js Frontend Quality Standards
- [ ] **App Router Architecture**:
  - Distinct route groups: `(auth)`, `(storefront)`, `(dashboard)`, `admin`.
  - Proper boundary between Server Components (RSC) and Client Components (`"use client"`).
- [ ] **State Management Separation**:
  - **Server State**: Managed via TanStack Query (`useQuery`, `useMutation`) with query keys factory (`queryKeys.products.all`, `queryKeys.cart.details`).
  - **Client State**: Minimal and focused Zustand stores (`cartStore`, `wishlistStore`, `authStore`) with selective re-renders (`useCartStore(state => state.items)`).
- [ ] **Component Cleanliness**:
  - Single Responsibility: Keep UI presentation and business logic decoupled.
  - Reusable components built on top of `shadcn/ui` primitives.
  - Icons sourced exclusively from `lucide-react`.
  - Accessible forms built with `react-hook-form` and `@hookform/resolvers/zod`.
- [ ] **Styling**:
  - Tailwind CSS classes grouped logically using `cn()` (`clsx` + `tailwind-merge`).
  - Responsive design: Mobile-first styling (`sm:`, `md:`, `lg:`, `xl:`).

---

## 2. Step-by-Step Verification Runbook

Follow these steps before completing any feature or pull request:

### Step 1: Type Checking
Run TypeScript compiler check across both workspaces:
```bash
# In backend
cd apps/backend && npx tsc --noEmit

# In frontend
cd apps/frontend && npx tsc --noEmit
```
**Pass Criteria**: Exit code `0` with zero diagnostic errors.

### Step 2: Linting & Formatting
```bash
# In backend
cd apps/backend && npm run lint

# In frontend
cd apps/frontend && npm run lint
```
**Pass Criteria**: No ESLint errors or warnings.

### Step 3: Prisma Schema Validation & Migration Check
```bash
cd apps/backend && npx prisma validate
```
**Pass Criteria**: "The schema is valid."

### Step 4: Unit & Integration Tests
```bash
# In backend
cd apps/backend && npm test

# In frontend
cd apps/frontend && npm test
```

### Step 5: Full Monorepo Build Check
Verify that production builds succeed without tree-shaking issues or missing imports:
```bash
npm run build
```
