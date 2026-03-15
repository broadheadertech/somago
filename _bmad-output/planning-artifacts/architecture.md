---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-15'
inputDocuments: [prd.md, ux-design-specification.md, product-brief-somago-2026-03-15.md]
workflowType: 'architecture'
project_name: 'Somago'
user_name: 'deliveryboy'
date: '2026-03-15'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
59 FRs organized into 8 capability areas:

| Capability Area | FR Count | Architectural Implication |
|----------------|----------|--------------------------|
| User Identity & Access (FR1-8) | 8 | Auth service with RBAC, social OAuth, seller verification workflow |
| Product Catalog & Discovery (FR9-18) | 10 | Catalog service with search indexing, category management, content moderation queue |
| Shopping & Checkout (FR19-24) | 6 | Cart service (session-synced), order creation, payment gateway integration |
| Order Management (FR25-30) | 6 | Order service with state machine, real-time tracking |
| Reviews & Ratings (FR31-34) | 4 | Review service with photo uploads, aggregation, moderation |
| Dispute Resolution (FR35-40) | 6 | Dispute service with auto-escalation timer (48hr), refund processing |
| Seller Analytics (FR41-44) | 4 | Analytics service with aggregation queries |
| Platform Administration (FR45-50) | 6 | Admin service with batch operations, seller approval, strike system |
| Notifications (FR51-55) | 5 | Notification service — push (FCM/APNs), email, SMS |
| Media & Content (FR56-59) | 4 | Media service — upload, optimization, CDN delivery |

**Non-Functional Requirements:**
43 NFRs driving architecture:

| Category | NFR Count | Key Architectural Drivers |
|----------|-----------|--------------------------|
| Performance (NFR1-8) | 8 | p95 API < 500ms, search < 800ms, DB queries < 100ms → caching, query optimization, CDN |
| Security (NFR9-19) | 11 | AES-256 at rest, TLS 1.2+, JWT 15-30min, rate limiting, audit trail |
| Scalability (NFR20-26) | 7 | 1K concurrent MVP → 100K+ growth, 1M+ products, 10x spike handling |
| Reliability (NFR27-31) | 5 | 99.5% uptime, zero data loss, graceful degradation |
| Accessibility (NFR32-36) | 5 | WCAG 2.1 AA — frontend concern |
| Integration (NFR37-43) | 7 | Payment gateway, push, email, SMS, CDN, circuit breakers, API versioning |

**UX Architectural Requirements:**
- Multi-platform: Next.js web SPA + React Native mobile (Expo) + shared API backend
- Design system: Tailwind CSS + NativeWind + shadcn/ui
- Real-time: Order status WebSocket, push notifications, optimistic UI
- Offline: Product browsing cache, cart persistence, seller draft listings
- Performance: FCP < 1.5s, app launch < 2s, skeleton loading, CDN images
- 10 custom components requiring specific API data contracts

### Scale & Complexity

- **Primary domain:** Full-stack multi-platform e-commerce marketplace
- **Complexity level:** High — 3 user roles, payment processing, real-time, multi-platform, content moderation
- **Estimated architectural components:** 10-12 backend services/modules, 3 frontend apps, 6+ external integrations
- **Data model complexity:** High — relational with denormalized views for performance

### Technical Constraints & Dependencies

**Hard Constraints:**
- Payment card data never stored — PCI DSS delegated to payment gateway
- User PII encrypted at rest (AES-256) and in transit (TLS 1.2+)
- Passwords hashed with Argon2/bcrypt (cost factor 10+)
- JWT access tokens max 30min, refresh tokens max 7 days
- API rate limiting on all endpoints
- Government ID uploads restricted to admin verification
- All admin actions logged in immutable audit trail

**Platform Constraints:**
- iOS 15+ and Android 10+ minimum
- Cross-platform via React Native + Expo
- Next.js with SSR for product pages (SEO)
- Shared REST API — no platform-specific backend logic
- API versioning (v1/v2) for mobile release cycle lag

**Infrastructure Constraints:**
- Auto-scaling for traffic spikes
- CDN for product images (Cloudflare/CloudFront)
- Object storage for uploads (S3)
- Redis caching for frequently accessed data

### Cross-Cutting Concerns Identified

| Concern | Spans | Architectural Impact |
|---------|-------|---------------------|
| **Authentication & Authorization** | All services | Centralized auth with JWT validation middleware |
| **Multi-role Access Control** | All endpoints | RBAC matrix (buyer/seller/admin) at middleware level |
| **Image Processing** | Products, reviews, seller IDs | Shared media pipeline: upload → validate → optimize → store → CDN |
| **Notifications** | Orders, disputes, admin, marketing | Unified notification service: push/email/SMS |
| **Audit Logging** | Admin actions, payments, disputes | Centralized immutable log service |
| **Error Handling** | All services | Consistent error format, circuit breakers for external services |
| **Caching Strategy** | Products, categories, search, sessions | Redis with per-entity invalidation rules |
| **Search** | Products, sellers, orders (admin) | Full-text search with relevance ranking |
| **File Upload & Validation** | Products, reviews, disputes, verification | Shared upload with type/size validation and malware scanning |
| **Real-time Updates** | Order tracking, notifications | WebSocket for connected clients, push for background |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack multi-platform e-commerce with Convex as the unified backend.

### Technology Stack Decided

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend/Database** | Convex (cloud) | Real-time reactive database, server functions, file storage, scheduling |
| **Authentication** | Clerk (Core 3) | Pre-built auth UI, social login, phone/OTP, role management |
| **Web Frontend** | Next.js + React | SSR for SEO, App Router, Tailwind CSS + shadcn/ui |
| **Mobile Frontend** | React Native + Expo | NativeWind for Tailwind parity, Clerk Expo SDK |
| **Deployment** | Vercel (web) + Convex Cloud (backend) | Zero-config Next.js, managed Convex backend |
| **Monorepo** | Turborepo | Shared Convex schema, TypeScript types, validation across web + mobile |

### Architecture Simplification via Convex

| Original Plan | Replaced By | Benefit |
|--------------|-------------|---------|
| PostgreSQL database | Convex reactive database | Real-time sync, no ORM, automatic indexing |
| REST API (Express/NestJS) | Convex server functions | Type-safe, auto-generated client, no API boilerplate |
| Redis caching | Convex built-in reactivity + caching | Automatic cache invalidation |
| WebSocket server | Convex real-time subscriptions | All queries are live by default |
| File upload service (S3) | Convex file storage | Integrated file storage with URLs |
| Cron jobs | Convex scheduled functions | Built-in scheduler for auto-escalation, analytics |
| Search indexing | Convex search indexes | Built-in full-text search |

**External Services Remaining:**
- Clerk — authentication and user management
- PayMongo/Stripe — payment processing (via Convex actions)
- FCM/APNs — push notifications (via Convex actions)
- SendGrid/SES — transactional emails (via Convex actions)
- Cloudflare/Vercel — CDN for static assets

### Selected Starter: template-nextjs-clerk-shadcn

**Rationale:** Official Convex template, pre-configured with Next.js + Clerk + shadcn/ui + Tailwind — exactly our stack.

**Initialization Command:**

```bash
npx create-turbo@latest somago
npx degit get-convex/template-nextjs-clerk-shadcn apps/web
npx create-expo-app apps/mobile --template blank-typescript
mkdir -p packages/convex packages/shared
```

**Code Organization (Monorepo):**
```
somago/
├── apps/
│   ├── web/                  # Next.js buyer + seller web app
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Web-specific components
│   │   └── lib/              # Web utilities
│   └── mobile/               # React Native + Expo
│       ├── app/              # Expo Router screens
│       ├── components/       # Mobile-specific components
│       └── lib/              # Mobile utilities
├── packages/
│   ├── convex/               # Shared Convex backend
│   │   ├── schema.ts         # Database schema
│   │   ├── functions/        # Queries, mutations, actions
│   │   └── _generated/       # Auto-generated types
│   └── shared/               # Shared TypeScript types, validation, constants
├── turbo.json
├── package.json
└── .env.local
```

**Testing Framework:**
- Vitest for unit tests (Convex functions, shared utilities)
- Playwright for E2E web testing
- Detox or Maestro for mobile E2E testing

**Note:** Project initialization using this monorepo setup should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data architecture via Convex schema design
- Auth via Clerk with buyer/seller/admin roles
- Payment integration (COD + GCash + Maya + Stripe)
- Monorepo structure and shared code strategy

**Important Decisions (Shape Architecture):**
- Admin routing within same Next.js app
- Push notification service selection
- Email via Resend
- Image handling via Convex + Vercel

**Deferred Decisions (Post-MVP):**
- Search engine upgrade (if Convex search indexes insufficient at scale)
- CDN migration (if Convex file storage hits limits)
- Self-hosted Convex (if cloud pricing becomes prohibitive)

### Data Architecture

**Database: Convex Reactive Database**
- Schema defined in TypeScript (`schema.ts`) with automatic type generation
- Documents (not rows) — flexible schema with type safety
- Indexes defined declaratively — Convex auto-optimizes queries
- Real-time by default — all queries are live subscriptions
- No ORM, no migrations — schema changes handled by Convex push deployments
- Transactions built-in — mutations are automatically transactional

**Data Modeling Approach:**
- **Users table:** Synced from Clerk via webhook (Clerk is source of truth for auth, Convex stores app-specific data)
- **Products table:** Seller-owned documents with category references, variant sub-objects, image storage IDs
- **Orders table:** State machine (pending → confirmed → packed → shipped → delivered), references buyer/seller/products
- **Reviews table:** Linked to orders (verified purchase enforcement), aggregated ratings cached on products
- **Disputes table:** Linked to orders, auto-escalation via Convex scheduled functions (48hr timer)
- **Notifications table:** Per-user notification log, read/unread status

**Data Validation:**
- Convex schema validators for all database writes (built-in)
- Zod schemas in `packages/shared` for form validation (web + mobile)
- Convex argument validators on all server functions

### Authentication & Security

**Authentication: Clerk (Core 3)**
- **Web:** `@clerk/nextjs` with `clerkMiddleware()` in Next.js middleware
- **Mobile:** `@clerk/clerk-expo` with Expo SecureStore for token persistence
- **Sign-up methods:** Phone (OTP), email, Google OAuth, Facebook OAuth
- **Role management:** Clerk metadata stores role (buyer/seller/admin) — synced to Convex user document

**Authorization: Convex Function-Level RBAC**
- Every Convex query/mutation validates user role before executing
- Helper functions: `requireBuyer()`, `requireSeller()`, `requireAdmin()` — reusable auth guards
- Seller functions validate ownership (seller can only modify own products/orders)
- Admin functions validate admin role before any platform-wide action

**Security Implementation:**
- Clerk handles password hashing, session management, JWT issuance
- Convex functions run server-side — no database credentials exposed to client
- File uploads validated in Convex actions (type, size) before storage
- Rate limiting via Convex function-level checks
- Admin audit trail: mutations log admin actions to dedicated audit table
- PII: Clerk handles auth PII; Convex built-in encryption at rest

### API & Communication Patterns

**API: Convex Functions (Not REST)**
- **Queries:** Read-only, cached, real-time subscriptions — product listings, order status, dashboard
- **Mutations:** Write operations, transactional — cart updates, order creation, product listing
- **Actions:** Side-effect functions for external APIs — payments, push notifications, email

**Communication Patterns:**

| Pattern | Implementation | Usage |
|---------|---------------|-------|
| Client → Backend | Convex `useQuery()` / `useMutation()` | All data reads and writes |
| Real-time Updates | Convex subscriptions (automatic) | Order status, cart sync, dashboard |
| Backend → External | Convex actions | Payment, push, email |
| Scheduled Tasks | Convex `crons` and `scheduler` | Dispute escalation, analytics |
| Webhooks Inbound | Next.js API routes → Convex mutations | Clerk sync, payment status |

**Error Handling:**
- Convex typed errors caught and displayed by client
- External service failures: retry with exponential backoff (Convex built-in)
- Payment failures: user-friendly error with retry option

### Frontend Architecture

**Single Next.js App with Role-Based Routing:**

```
apps/web/app/
├── (buyer)/              # Buyer pages (public + authenticated)
│   ├── page.tsx          # Home feed
│   ├── search/           # Search results
│   ├── product/[id]/     # Product detail
│   ├── cart/             # Cart
│   ├── checkout/         # Checkout flow
│   └── orders/           # Order history + tracking
├── (seller)/             # Seller pages (requires seller role)
│   ├── dashboard/        # Seller dashboard
│   ├── products/         # Product management
│   ├── orders/           # Seller order management
│   └── analytics/        # Sales analytics
├── (admin)/              # Admin pages (requires admin role)
│   ├── dashboard/        # Admin dashboard
│   ├── users/            # User management
│   ├── moderation/       # Content moderation
│   └── disputes/         # Dispute management
├── layout.tsx            # Root layout with Clerk + Convex providers
└── middleware.ts         # Clerk auth middleware for route protection
```

**State Management:**
- **Server state:** Convex `useQuery()` — replaces TanStack Query entirely
- **Client state:** Zustand for UI-only state (modals, filters, form drafts)
- **Form state:** React Hook Form + Zod for complex forms

**Mobile Architecture (React Native + Expo):**
- Expo Router for file-based navigation
- Same Convex hooks — identical data layer
- Clerk Expo SDK — same user sessions across platforms
- NativeWind — same Tailwind classes as web

**Performance Optimization:**
- Next.js SSR for product pages (SEO + fast FCP)
- Convex query caching + real-time subscriptions
- Vercel Image Optimization for responsive images
- Code splitting via dynamic imports (seller/admin not loaded for buyers)
- React Suspense with skeleton fallbacks

### Infrastructure & Deployment

| Component | Platform | Deployment |
|-----------|----------|------------|
| Web app | Vercel | Auto-deploy on push to `main`, preview on PRs |
| Convex backend | Convex Cloud | `npx convex deploy` CLI push |
| Mobile app | Expo EAS | EAS Build for iOS/Android, OTA updates |
| Domain/DNS | Vercel | Custom domain with automatic SSL |

**CI/CD Pipeline:**
- GitHub Actions: lint, type-check, test on every PR
- Vercel auto-deploys web on merge to `main`
- Convex deployed via GitHub Action
- Mobile: EAS Build on release tags

**Environment Configuration:**
- Vercel env vars for web (Clerk keys, Convex URL)
- Convex dashboard for backend env vars (Stripe, Resend, FCM keys)
- Separate Convex projects for dev/staging/production

**Monitoring:** Convex dashboard (logs, errors, performance), Vercel Analytics (web vitals), Clerk dashboard (auth metrics)

**Scaling:** Convex Cloud + Vercel both auto-scale — no manual infrastructure management

### Payment Architecture

**Multi-Provider Strategy:**

| Method | Provider | Integration |
|--------|----------|-------------|
| Credit/Debit Cards | Stripe | Convex action → Stripe API → webhook back |
| GCash | PayMongo | Convex action → PayMongo API → webhook back |
| Maya | PayMongo | Convex action → PayMongo API → webhook back |
| Cash on Delivery | Internal | Convex mutation sets order status to COD pending |

**Payment Flow:**
1. Buyer selects payment method at checkout
2. Convex mutation creates order with `payment_status: "pending"`
3. Convex action calls Stripe/PayMongo API to create payment intent
4. Client redirects to payment provider (or handles inline for cards)
5. Payment provider sends webhook → Next.js API route → Convex mutation updates order status
6. COD: order confirmed immediately, payment collected on delivery

### Notification Architecture

**Push Notifications:** FCM (Android) + APNs (iOS) triggered from Convex actions
**Email:** Resend API called from Convex actions for transactional emails
**In-App:** Convex notifications table with real-time subscription on client

### Decision Impact Analysis

**Implementation Sequence:**
1. Monorepo setup (Turborepo + apps + packages)
2. Convex project initialization + schema definition
3. Clerk integration (web + Convex webhook sync)
4. Core buyer flow (products → cart → checkout)
5. Payment integration (Stripe + PayMongo for GCash/Maya + COD)
6. Seller flow (listing → orders → analytics)
7. Admin flow (dashboard → moderation → disputes)
8. Mobile app (React Native + Expo with shared Convex backend)
9. Push notifications + email (FCM/APNs + Resend)

**Cross-Component Dependencies:**
- Clerk webhook → Convex user sync must be first authenticated feature
- Convex schema must be designed before any frontend work
- Payment requires Stripe (cards) + PayMongo (GCash/Maya) — two integrations
- Mobile shares 100% of Convex backend — no additional backend work

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Convex Schema:** `camelCase` for tables (`users`, `products`, `orders`), fields (`userId`, `productName`, `createdAt`), indexes (`by_userId`, `by_category`), search indexes (`search_products`).

**Convex Functions:** Queries: `get`/`list` prefix (`getProduct`, `listOrdersBySeller`). Mutations: action verb (`createProduct`, `updateOrderStatus`). Actions: `send`/`process` prefix (`sendPushNotification`, `processPayment`). Internal: `_` prefix (`_validateSeller`).

**React/TypeScript:** Components: `PascalCase` files (`ProductCard.tsx`). Hooks: `use` prefix (`useProducts.ts`). Utilities: `camelCase` (`formatPrice.ts`). Constants: `SCREAMING_SNAKE_CASE`. Types: `PascalCase` (`ProductCardProps`, `OrderStatus`).

### Structure Patterns

**Component Organization:** Co-located by role — `buyer/`, `seller/`, `admin/`, `shared/` folders within `components/`. Tests co-located: `Component.test.tsx` next to `Component.tsx`.

**Convex Functions:** One file per domain — `products.ts`, `orders.ts`, `cart.ts`, `reviews.ts`, `disputes.ts`, `payments.ts`, `notifications.ts`, `admin.ts`, `media.ts`. Shared helpers in `_helpers/auth.ts`, `_helpers/validation.ts`, `_helpers/rateLimit.ts`.

### Format Patterns

**Convex Responses:** Return data directly — no `{data, error}` wrapper. Use `ConvexError` with descriptive string messages for errors. Store dates as `Date.now()` numbers, display with `date-fns`. Use `v.id("tableName")` for document references.

### Communication Patterns

**Reactivity:** Convex `useQuery()` for all server data — auto-updates in real-time, no polling, no manual refetch. Optimistic updates via `useMutation` `optimisticUpdate` option.

**Zustand:** UI-only state (modals, filters, drafts). Never store server data in Zustand — Convex is source of truth.

**Scheduled Functions:** `cron_` prefix for recurring jobs. Descriptive names for one-off (`escalateDispute`, `sendOrderReminder`).

### Process Patterns

**Loading:** `useQuery` returns `undefined` while loading → show skeleton. Empty array → show empty state. Never blank screens.

**Error Handling:** `ConvexError` with friendly strings on server. `try/catch` with `toast.error()` on client. Never blame the user.

**Auth Guards:** Every authenticated Convex function calls `requireBuyer()`, `requireSeller()`, or `requireAdmin()` as first line. Seller functions validate ownership.

### Enforcement Guidelines

**All AI Agents MUST:**
1. `camelCase` for Convex tables, fields, functions
2. `PascalCase` for React components and TypeScript types
3. Co-locate tests with source files
4. Use `useQuery()` for server data — never Zustand or local state
5. Use `ConvexError` with string messages for errors
6. Auth guard as first line of every authenticated function
7. Dates as `Date.now()` numbers, display with `date-fns`
8. Shared code in `packages/convex/` and `packages/shared/`
9. Component folders: `buyer/`, `seller/`, `admin/`, `shared/`
10. Skeleton loading when `useQuery` returns `undefined`

**Anti-Patterns to Reject:**
- REST endpoints alongside Convex
- `useEffect` for data fetching
- Manual cache invalidation
- Server data in Zustand
- Snake_case in TypeScript
- Separate `__tests__` directories

## Project Structure & Boundaries

### Complete Project Directory Structure

```
somago/
├── .github/workflows/
│   ├── ci.yml                        # Lint, type-check, test on PRs
│   ├── deploy-convex.yml             # Deploy Convex on merge to main
│   └── deploy-mobile.yml             # EAS Build on release tags
├── apps/
│   ├── web/                          # Next.js app (buyer + seller + admin)
│   │   ├── app/
│   │   │   ├── layout.tsx            # ClerkProvider + ConvexProvider
│   │   │   ├── middleware.ts         # Clerk auth + role routing
│   │   │   ├── globals.css           # Tailwind + design tokens
│   │   │   ├── (buyer)/              # Buyer routes
│   │   │   │   ├── page.tsx          # Home feed
│   │   │   │   ├── search/page.tsx
│   │   │   │   ├── product/[id]/page.tsx  # SSR for SEO
│   │   │   │   ├── cart/page.tsx
│   │   │   │   ├── checkout/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── orders/[id]/page.tsx
│   │   │   │   ├── wishlist/page.tsx
│   │   │   │   └── account/page.tsx
│   │   │   ├── (seller)/             # Seller routes (role-protected)
│   │   │   │   ├── layout.tsx        # Sidebar nav
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── products/page.tsx
│   │   │   │   ├── products/new/page.tsx
│   │   │   │   ├── products/[id]/edit/page.tsx
│   │   │   │   ├── orders/page.tsx
│   │   │   │   ├── analytics/page.tsx
│   │   │   │   └── shop/page.tsx
│   │   │   ├── (admin)/              # Admin routes (role-protected)
│   │   │   │   ├── layout.tsx        # Dark sidebar
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── users/page.tsx
│   │   │   │   ├── moderation/page.tsx
│   │   │   │   ├── disputes/page.tsx
│   │   │   │   ├── disputes/[id]/page.tsx
│   │   │   │   ├── sellers/page.tsx
│   │   │   │   └── analytics/page.tsx
│   │   │   └── api/webhooks/
│   │   │       ├── clerk/route.ts
│   │   │       ├── stripe/route.ts
│   │   │       └── paymongo/route.ts
│   │   ├── components/
│   │   │   ├── buyer/                # ProductCard, SearchBar, OrderTimeline, etc.
│   │   │   ├── seller/               # StatCard, ProductForm, OrderRow, etc.
│   │   │   ├── admin/                # AlertCard, QueueItem, DisputeDetail, etc.
│   │   │   ├── shared/               # ImageUploader, RatingStars, StatusBadge, etc.
│   │   │   └── ui/                   # shadcn/ui (button, input, dialog, etc.)
│   │   ├── lib/
│   │   │   ├── utils.ts
│   │   │   └── stores/               # Zustand (useFilterStore, useModalStore)
│   │   ├── public/                   # Logo, favicon, OG image
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   └── mobile/                       # React Native + Expo
│       ├── app/                      # Expo Router
│       │   ├── _layout.tsx           # ClerkProvider + ConvexProvider
│       │   ├── (tabs)/               # Buyer bottom tabs
│       │   ├── product/[id].tsx
│       │   ├── checkout.tsx
│       │   ├── search.tsx
│       │   └── (seller)/             # Seller tab group
│       ├── components/               # buyer/, seller/, shared/
│       ├── lib/utils.ts
│       ├── tailwind.config.js        # NativeWind (shared tokens)
│       └── package.json
├── packages/
│   ├── convex/                       # Shared Convex backend
│   │   ├── schema.ts                 # All database tables
│   │   ├── functions/
│   │   │   ├── users.ts              # FR1-8
│   │   │   ├── products.ts           # FR9-18
│   │   │   ├── cart.ts               # FR19-20
│   │   │   ├── orders.ts             # FR21-30
│   │   │   ├── reviews.ts            # FR31-34
│   │   │   ├── disputes.ts           # FR35-40
│   │   │   ├── analytics.ts          # FR41-44
│   │   │   ├── admin.ts              # FR45-50
│   │   │   ├── notifications.ts      # FR51-55
│   │   │   ├── media.ts              # FR56-59
│   │   │   ├── payments.ts           # Stripe + PayMongo
│   │   │   └── _helpers/
│   │   │       ├── auth.ts           # Role guards
│   │   │       ├── validation.ts
│   │   │       └── rateLimit.ts
│   │   ├── crons.ts                  # Dispute escalation, analytics
│   │   └── package.json
│   └── shared/                       # Shared TypeScript
│       ├── types/                    # OrderStatus, ProductVariant, UserRole
│       ├── validation/               # Zod schemas (product, checkout, profile)
│       ├── constants/                # Categories, order states, config
│       ├── utils/                    # formatPrice, formatDate, slugify
│       └── package.json
├── turbo.json
├── package.json
├── .env.example
└── .gitignore
```

### Architectural Boundaries

**Convex Domain Ownership:**

| Domain | File | Owns Tables | External Calls |
|--------|------|-------------|----------------|
| Users | `users.ts` | users, addresses | — |
| Products | `products.ts` | products, categories | media.ts |
| Cart | `cart.ts` | cart | products.ts (validate) |
| Orders | `orders.ts` | orders | payments.ts, notifications.ts |
| Reviews | `reviews.ts` | reviews | orders.ts (verify purchase) |
| Disputes | `disputes.ts` | disputes | notifications.ts, crons.ts |
| Payments | `payments.ts` | paymentIntents | Stripe, PayMongo (external) |
| Notifications | `notifications.ts` | notifications | FCM, APNs, Resend (external) |
| Admin | `admin.ts` | auditLog | users.ts, products.ts, disputes.ts |
| Media | `media.ts` | Convex storage | — |

**Rules:** Each domain owns its tables. Cross-domain reads allowed. Cross-domain writes go through owning domain's mutations. External API calls only in `actions`.

### Requirements to Structure Mapping

| FR Category | Convex File | Web Pages | Mobile Screens |
|-------------|------------|-----------|----------------|
| FR1-8 User Identity | `users.ts` | `account/` | `account.tsx` |
| FR9-18 Catalog | `products.ts` | `search/`, `product/[id]` | `search`, `product/[id]` |
| FR19-24 Shopping | `cart.ts`, `orders.ts` | `cart/`, `checkout/` | `cart`, `checkout` |
| FR25-30 Orders | `orders.ts` | `orders/` | `orders` |
| FR31-34 Reviews | `reviews.ts` | `product/[id]` section | `product/[id]` section |
| FR35-40 Disputes | `disputes.ts` | `(admin)/disputes/` | N/A |
| FR41-44 Analytics | `analytics.ts` | `(seller)/analytics/` | `(seller)/analytics` |
| FR45-50 Admin | `admin.ts` | `(admin)/` all pages | N/A (web only) |

### Data Flow

```
User Action → Convex Mutation → Database → Reactive Query → UI (automatic)
                    ↓ (if external needed)
              Convex Action → External Service
                    ↓
              Webhook → API Route → Convex Mutation → UI Update
```

## Architecture Validation Results

### Coherence Validation ✅

All decisions compatible: Convex + Clerk + Next.js + React Native are officially supported integrations. Tailwind + NativeWind share identical tokens. Turborepo supports both Next.js and Expo. No version conflicts. Naming patterns consistent (camelCase Convex, PascalCase React). Auth guard pattern uniform across all functions. Structure aligns with role-based routing and domain-owned Convex files.

### Requirements Coverage ✅

**All 59 FRs covered:** Each FR mapped to specific Convex function file and frontend pages. **All 43 NFRs covered:** Performance via Convex auto-caching + Vercel CDN. Security via Clerk + server-side functions + auth guards. Scalability via Convex/Vercel auto-scaling. Reliability via Convex managed infrastructure. Accessibility via shadcn/ui Radix primitives. Integration via Convex actions + webhooks.

**NFR Adaptations for Convex:** Redis replaced by Convex reactivity. DB query optimization handled by declared indexes. API versioning not needed (lock-step deployment). Stateless by design.

### Implementation Readiness ✅

All critical decisions documented. Full directory tree mapped to FRs. Patterns specified with code examples and anti-patterns. No critical gaps.

**Important gaps (addressable during implementation):** Convex schema.ts field-level design (first implementation task). PayMongo webhook format verification. FCM/APNs certificate setup.

### Architecture Completeness Checklist

- [x] Project context analyzed (59 FRs, 43 NFRs, 3 roles)
- [x] Technology stack specified (Convex, Clerk, Stripe, PayMongo, Resend)
- [x] Integration patterns defined (Convex actions + webhooks)
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Complete directory structure with FR mapping
- [x] Component boundaries established
- [x] Validation passed — all decisions coherent

### Architecture Readiness Assessment

**Status: READY FOR IMPLEMENTATION** ✅ | **Confidence: High**

**Key Strengths:** Convex replaces 5+ services. Type-safe end-to-end. Real-time by default. Shared backend for web + mobile. Managed auto-scaling.

**Future Enhancement Areas:** Self-hosted Convex, dedicated search (Algolia), CDN migration (Cloudinary), microservices extraction.

**First Implementation Priority:**
1. Initialize Turborepo monorepo
2. Configure Convex + design schema.ts
3. Set up Clerk + webhook user sync
4. Build first buyer flow: browsing → detail → cart
