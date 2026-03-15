# Story 1.1: Initialize Next.js + Convex Project

Status: review

## Story

As a **developer**,
I want a properly configured Next.js project with Convex backend, Clerk auth, and Tailwind CSS,
So that all subsequent features have a solid, type-safe foundation to build upon.

## Acceptance Criteria

1. **Given** a fresh GitHub repository, **When** the project is initialized, **Then** a Next.js 15+ app exists with TypeScript strict mode, App Router, and Tailwind CSS configured.

2. **Given** the Next.js app, **When** Convex is initialized, **Then** `convex/schema.ts` defines all database tables (users, products, categories, orders, cart, reviews, disputes, notifications, auditLog, paymentIntents) with appropriate indexes and search indexes. **And** `npx convex dev` starts successfully and generates TypeScript types.

3. **Given** Convex is configured, **When** Clerk is integrated, **Then** `ClerkProvider` and `ConvexProviderWithClerk` wrap the app in the root layout. **And** `clerkMiddleware()` is configured in `middleware.ts`.

4. **Given** all providers configured, **When** `npm run dev` is executed, **Then** Next.js dev server and Convex dev server start simultaneously. **And** the app loads without errors at `localhost:3000`.

5. **Given** the project is deployed, **When** code is pushed to `main` on GitHub, **Then** Vercel auto-deploys the web app. **And** `.env.example` documents all required environment variables (CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY).

## Tasks / Subtasks

- [x] Task 1: Initialize Next.js project (AC: #1)
  - [x] Next.js 16.1.6 already initialized with TypeScript, Tailwind CSS v4, ESLint, App Router
  - [x] Verify TypeScript strict mode in `tsconfig.json` — confirmed strict: true
  - [x] Verify Tailwind CSS working with default config — confirmed
  - [x] Set up `.gitignore` properly — added Convex `.convex` entry

- [x] Task 2: Initialize Convex backend (AC: #2)
  - [x] Run `npm install convex` — installed convex + convex-helpers
  - [ ] Create `convex/schema.ts` with complete database schema:
    - `users` table: clerkId (string), email, name, role (buyer/seller/admin), avatar, phone, addresses (array), shopProfile (optional), sellerStatus, createdAt
    - `products` table: sellerId, name, description, categoryId, price, originalPrice, variants (array), images (array of storage IDs), stock, soldCount, rating, reviewCount, status, createdAt
    - `categories` table: name, parentId (optional), icon, order
    - `orders` table: buyerId, sellerId, items (array), totalAmount, shippingAddress, paymentMethod, paymentStatus, orderStatus (pending/confirmed/packed/shipped/delivered), trackingNumber, createdAt
    - `cart` table: userId, productId, variantIndex, quantity
    - `reviews` table: buyerId, productId, orderId, rating, text, photos (array), isVerified, createdAt
    - `disputes` table: orderId, buyerId, sellerId, issueType, description, evidence (array), status, resolution, escalatedAt, resolvedAt
    - `notifications` table: userId, type, title, body, data, isRead, createdAt
    - `auditLog` table: adminId, action, targetType, targetId, details, createdAt
    - `paymentIntents` table: orderId, provider (stripe/paymongo), externalId, amount, status, createdAt
  - [x] Add indexes: all indexes created (by_clerkId, by_sellerId, by_categoryId, by_orderStatus, by_userId, by_productId, by_orderId, etc.)
  - [x] Add search index: `search_products` on products (searchField: "name", filterFields: ["categoryId", "status"])
  - [ ] Verify `npx convex dev` generates types in `convex/_generated/` — **REQUIRES: Convex account login**

- [x] Task 3: Integrate Clerk authentication (AC: #3)
  - [x] Run `npm install @clerk/nextjs` — installed
  - [ ] Create Clerk application at clerk.com — **REQUIRES: Clerk account**
  - [ ] Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local` — **REQUIRES: Clerk keys**
  - [x] Configure `ConvexClientProvider` in `components/providers.tsx` — created with graceful fallback for missing env vars
  - [x] Wrap app in `Providers` in `app/layout.tsx` — done
  - [x] Add `clerkMiddleware()` in `proxy.ts` (Next.js 16 uses proxy.ts instead of middleware.ts)
  - [ ] Configure Convex to use Clerk as auth provider via Convex dashboard — **REQUIRES: Convex + Clerk accounts**

- [x] Task 4: Set up environment and deployment (AC: #4, #5)
  - [x] Create `.env.example` with all required variables (no values)
  - [ ] Create `.env.local` with actual development values — **REQUIRES: Convex + Clerk keys**
  - [ ] Verify `npm run dev` starts both Next.js and Convex — **REQUIRES: Convex connected**
  - [ ] Connect GitHub repo to Vercel for auto-deployment — **REQUIRES: Vercel account**
  - [x] Verify build succeeds: `npm run build` — confirmed, builds successfully

- [x] Task 5: Create basic page shell (AC: #4)
  - [x] Create minimal `app/page.tsx` with "Somago" heading — done with green branding
  - [x] Create `app/layout.tsx` with Providers, metadata (title: "Somago"), and Plus Jakarta Sans font — done
  - [ ] Verify the page loads at `localhost:3000` with Clerk + Convex active — **REQUIRES: env vars set**

## Dev Notes

### Architecture Compliance

**Stack (from Architecture Decision Document):**
- **Framework:** Next.js 15+ with App Router (NOT Pages Router)
- **Backend:** Convex (reactive database + server functions) — NOT REST APIs
- **Auth:** Clerk Core 3 — NOT NextAuth or custom auth
- **Styling:** Tailwind CSS v4 — configured but design tokens come in Story 1.4
- **Deployment:** Vercel (web) + Convex Cloud (backend)
- **Repository:** GitHub

**Convex Conventions (from Implementation Patterns):**
- Table names: `camelCase` plural (`users`, `products`, `orders`)
- Field names: `camelCase` (`userId`, `productName`, `createdAt`)
- Index names: `by_` prefix (`by_sellerId`, `by_category`)
- Search index names: `search_` prefix (`search_products`)
- Dates stored as `number` via `Date.now()`
- Use `v.id("tableName")` for document references between tables

**Project Structure (simplified — no Turborepo):**
```
somago/
├── app/
│   ├── layout.tsx          # Root layout with Providers
│   ├── page.tsx            # Home page (placeholder)
│   └── middleware.ts       # Clerk middleware
├── components/
│   └── providers.tsx       # ClerkProvider + ConvexProviderWithClerk
├── convex/
│   ├── schema.ts           # Complete database schema
│   ├── _generated/         # Auto-generated by Convex (gitignored)
│   └── tsconfig.json       # Convex TypeScript config
├── lib/
│   └── utils.ts            # cn() helper
├── public/
├── .env.local              # Local environment variables (gitignored)
├── .env.example            # Template for required env vars
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── .gitignore
```

### Critical Do-Nots

- **DO NOT** use Pages Router — App Router only
- **DO NOT** install Express, NestJS, or any REST framework — Convex replaces all of this
- **DO NOT** install Prisma, Drizzle, or any ORM — Convex has its own schema system
- **DO NOT** install Redis — Convex handles caching automatically
- **DO NOT** install Socket.io — Convex provides real-time subscriptions built-in
- **DO NOT** create REST API routes (except for webhooks in later stories)
- **DO NOT** use `mongoose`, `pg`, `mysql2`, or any database driver
- **DO NOT** set up a separate backend server

### Environment Variables Required

```
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

### References

- [Source: architecture.md#Starter Template Evaluation] — Next.js + Convex + Clerk stack decision
- [Source: architecture.md#Core Architectural Decisions] — Convex as database/API/caching/real-time layer
- [Source: architecture.md#Implementation Patterns] — Naming conventions, anti-patterns
- [Source: architecture.md#Project Structure] — Simplified directory structure
- [Source: epics.md#Story 1.1] — Original story definition and acceptance criteria
- [Source: ux-design-specification.md#Design System Foundation] — Plus Jakarta Sans font, Tailwind + shadcn/ui decision

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Next.js 16 renamed `middleware.ts` to `proxy.ts` — updated accordingly
- Convex client creation wrapped in null check to prevent build failure when NEXT_PUBLIC_CONVEX_URL is not set
- convex-helpers installed alongside convex for utility functions

### Completion Notes List

- All code files created and build passes (`npm run build` succeeds)
- Convex schema designed with 10 tables, 20+ indexes, and 1 search index
- Clerk + Convex providers created with graceful fallback for missing env vars
- Plus Jakarta Sans + JetBrains Mono fonts configured per UX spec
- Remaining items require external account setup (Convex, Clerk, Vercel) — marked in tasks

### File List

- `convex/schema.ts` — NEW: Complete database schema (10 tables)
- `components/providers.tsx` — NEW: ClerkProvider + ConvexProviderWithClerk
- `app/layout.tsx` — MODIFIED: Somago branding, fonts, Providers wrapper
- `app/page.tsx` — MODIFIED: Somago placeholder page
- `proxy.ts` — NEW: Clerk middleware (Next.js 16 proxy convention)
- `lib/utils.ts` — NEW: cn() helper utility
- `.env.example` — NEW: Environment variable template
- `.gitignore` — MODIFIED: Added .convex entry
- `package.json` — MODIFIED: Added convex, @clerk/nextjs, clsx, tailwind-merge, convex-helpers
