---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: 'complete'
completedAt: '2026-03-15'
inputDocuments: [prd.md, architecture.md, ux-design-specification.md]
---

# Somago - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Somago, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: Buyers can register using email, phone number, or social login (Google, Facebook)
- FR2: Sellers can register using email or phone number with government ID upload for verification
- FR3: Admins can log in using internal credentials with role-based access
- FR4: Users can reset their password via email or SMS OTP
- FR5: Users can manage their profile information (name, avatar, contact details)
- FR6: Buyers can manage multiple delivery addresses with a default selection
- FR7: Sellers can set up and customize their shop profile (logo, description, shipping policy)
- FR8: System can enforce role-based access control across buyer, seller, and admin roles
- FR9: Buyers can browse products organized by categories and subcategories
- FR10: Buyers can search products by keyword with results ranked by relevance
- FR11: Buyers can filter search results by price range, rating, category, and seller location
- FR12: Buyers can view product detail pages with images, descriptions, size/color variants, and pricing
- FR13: Buyers can view product reviews and ratings from verified purchasers
- FR14: Sellers can create product listings with photos, descriptions, pricing, variants, and stock quantities
- FR15: Sellers can edit and update existing product listings
- FR16: Sellers can manage inventory stock levels per product variant
- FR17: Admins can review and moderate product listings flagged by the system or buyers
- FR18: Admins can remove product listings and issue warnings or strikes to sellers
- FR19: Buyers can add products to a shopping cart with quantity selection
- FR20: Buyers can save products to a wishlist for later purchase
- FR21: Buyers can proceed through a checkout flow with order summary and address selection
- FR22: Buyers can select from multiple payment methods (credit/debit card, e-wallet, COD)
- FR23: Buyers can place an order and receive an order confirmation
- FR24: Buyers can view their order history and reorder previous purchases
- FR25: Buyers can track order status in real-time (confirmed, packed, shipped, out for delivery, delivered)
- FR26: Sellers can view incoming orders on their dashboard
- FR27: Sellers can confirm, pack, and mark orders as shipped with a tracking number
- FR28: Sellers can view order details including buyer shipping address and payment method
- FR29: Admins can monitor all orders across the platform
- FR30: Admins can intervene in orders when disputes are escalated
- FR31: Buyers can submit a star rating and text review for purchased products
- FR32: Buyers can upload photos with their reviews
- FR33: Buyers can view aggregated ratings and individual reviews on product pages
- FR34: Admins can moderate reviews flagged as inappropriate or fraudulent
- FR35: Buyers can report issues with orders (damaged item, non-delivery, wrong item)
- FR36: Buyers can upload evidence (photos) when reporting an issue
- FR37: Sellers can respond to buyer disputes with proposed resolutions
- FR38: System can auto-escalate disputes to admin when seller does not respond within 48 hours
- FR39: Admins can review disputes, approve refunds, or reject claims
- FR40: Buyers can receive refunds credited to their Somago balance
- FR41: Sellers can view sales analytics (revenue, top products, order trends) on their dashboard
- FR42: Sellers can view shop performance metrics (views, conversion rate, response rate)
- FR43: Sellers can view commission deductions per transaction
- FR44: Admins can view seller performance data for moderation decisions
- FR45: Admins can view a platform-wide dashboard with key metrics (GMV, active users, transaction volume)
- FR46: Admins can manage buyer and seller accounts (view, suspend, ban)
- FR47: Admins can review and process seller applications (approve, reject, request resubmission)
- FR48: Admins can detect and flag accounts matching previously banned sellers
- FR49: Admins can issue warnings and strikes to sellers with an escalation policy
- FR50: Admins can view platform health metrics (uptime, error rates)
- FR51: Buyers can receive push notifications for order status updates
- FR52: Buyers can receive push notifications for promotions and deals
- FR53: Sellers can receive push notifications for new orders and dispute alerts
- FR54: Admins can receive dashboard alerts for escalated disputes and flagged content
- FR55: Users can receive transactional emails (order confirmation, seller approval, password reset)
- FR56: Sellers can upload product images with automatic optimization for multiple display sizes
- FR57: Buyers can view product images delivered via CDN for fast loading
- FR58: Sellers can upload government ID documents securely during registration
- FR59: System can serve static assets and images through a content delivery network

### NonFunctional Requirements

- NFR1: Product search results return within 800ms at p95 under normal load
- NFR2: API responses complete within 500ms at p95 for all catalog and order endpoints
- NFR3: Web pages achieve First Contentful Paint under 1.5 seconds on broadband connections
- NFR4: Mobile app cold launch to interactive state within 2 seconds on mid-range devices
- NFR5: Product images load within 1 second via CDN on 4G connections
- NFR6: Checkout flow steps complete within 2 seconds each including payment gateway round-trip
- NFR7: Real-time order status updates delivered to clients within 3 seconds of state change
- NFR8: Database queries for product listing pages execute within 100ms with proper indexing
- NFR9: All data in transit encrypted via TLS 1.2+ with no exceptions
- NFR10: All PII encrypted at rest using AES-256
- NFR11: Passwords hashed using Argon2 or bcrypt with minimum cost factor of 10
- NFR12: JWT access tokens expire within 15-30 minutes; refresh tokens within 7 days
- NFR13: Login attempts rate-limited to 5 attempts per 15-minute window per IP/account
- NFR14: Payment card data never stored on Somago servers
- NFR15: Government ID uploads stored in encrypted object storage with restricted access
- NFR16: API endpoints enforce authorization checks
- NFR17: All admin actions logged in an immutable audit trail
- NFR18: File uploads validated for type, size, and scanned for malicious content
- NFR19: CSRF protection on all state-changing web endpoints; XSS prevention via output encoding
- NFR20: System supports 1,000 concurrent users at MVP launch
- NFR21: Architecture supports horizontal scaling to 100,000+ concurrent users
- NFR22: Database supports 1 million+ product listings with sub-second query performance
- NFR23: Image CDN handles 10,000+ concurrent image requests
- NFR24: System handles 10x traffic spikes via auto-scaling
- NFR25: Stateless API servers enable adding capacity by adding instances
- NFR26: Redis/caching layer absorbs 80%+ of read traffic
- NFR27: Platform maintains 99.5%+ monthly uptime
- NFR28: Payment processing failures handled gracefully with retry logic
- NFR29: Database backed up daily with point-in-time recovery
- NFR30: Zero data loss for completed transactions
- NFR31: Graceful degradation when services are down
- NFR32: Web application meets WCAG 2.1 Level AA compliance for core buyer flows
- NFR33: All interactive elements keyboard-navigable with visible focus indicators
- NFR34: Product images include alt text
- NFR35: Color contrast ratios meet 4.5:1 minimum for text
- NFR36: Mobile apps follow iOS and Android accessibility guidelines
- NFR37: Payment gateway integration supports synchronous transaction processing with webhooks
- NFR38: Push notification delivery achieves 95%+ delivery rate
- NFR39: Email delivery via transactional email service with 99%+ delivery rate
- NFR40: SMS OTP delivery completes within 30 seconds
- NFR41: CDN cache invalidation propagates within 60 seconds
- NFR42: All third-party integrations implement circuit breaker patterns
- NFR43: API versioning ensures backward compatibility for mobile clients

### Additional Requirements

- AR1: Initialize Turborepo monorepo with apps/web, apps/mobile, packages/convex, packages/shared
- AR2: Configure Convex project and design schema.ts with all database tables
- AR3: Set up Clerk integration with ConvexProviderWithClerk and webhook user sync
- AR4: Integrate Stripe for credit/debit card payments via Convex actions + webhooks
- AR5: Integrate PayMongo for GCash and Maya e-wallet payments via Convex actions + webhooks
- AR6: Implement COD payment flow as internal Convex mutation (no external provider)
- AR7: Integrate Resend for transactional emails via Convex actions
- AR8: Integrate FCM (Android) and APNs (iOS) for push notifications via Convex actions
- AR9: Set up CI/CD pipeline (GitHub Actions for lint/test, Vercel auto-deploy, Convex deploy)
- AR10: Configure environment management (dev/staging/production Convex projects)

### UX Design Requirements

- UX-DR1: Implement design token system (green palette, typography scale, spacing, shadows) in tailwind.config.js
- UX-DR2: Build ProductCard component (grid/list/small variants, skeleton loading, wishlist state)
- UX-DR3: Build SearchBar component (instant suggestions after 2 chars, recent searches, category-scoped)
- UX-DR4: Build BottomTabBar component (5 tabs, badge count, buyer/seller variants)
- UX-DR5: Build StickyCtaBar component (dual-button product detail, single-button checkout)
- UX-DR6: Build OrderTimeline component (vertical timeline, 5 states, compact/expanded variants)
- UX-DR7: Build CategoryIconGrid component (horizontal scroll, visual icons)
- UX-DR8: Build ReviewCard component (star rating, photos, verified purchase badge)
- UX-DR9: Build SellerStatCard component (metric display, change indicator, sparkline variant)
- UX-DR10: Build AdminAlertCard component (color-coded priority, count display)
- UX-DR11: Build AdminQueueItem component (priority dot, batch checkbox, action button)
- UX-DR12: Implement empty states for all list views (cart, orders, search, products)
- UX-DR13: Implement skeleton loading screens for all content areas
- UX-DR14: Implement toast notification system (success/error/warning/info patterns)
- UX-DR15: Implement responsive layout system (4 breakpoints: 375/768/1024/1440px)
- UX-DR16: Implement WCAG 2.1 AA accessibility (contrast, keyboard nav, ARIA, focus rings)
- UX-DR17: Implement buyer checkout flow (3-step progress, saved defaults, buyer protection badge)
- UX-DR18: Implement seller product listing wizard (4-step guided flow with progress bar)
- UX-DR19: Implement admin priority queue with batch actions and keyboard shortcuts

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Buyer registration |
| FR2 | Epic 2 | Seller registration with ID |
| FR3 | Epic 2 | Admin login |
| FR4 | Epic 2 | Password reset |
| FR5 | Epic 2 | Profile management |
| FR6 | Epic 2 | Address management |
| FR7 | Epic 2 | Shop profile setup |
| FR8 | Epic 1 | RBAC enforcement |
| FR9 | Epic 3 | Category browsing |
| FR10 | Epic 3 | Product search |
| FR11 | Epic 3 | Search filters |
| FR12 | Epic 3 | Product detail pages |
| FR13 | Epic 3 | Product reviews display |
| FR14 | Epic 6 | Product listing creation |
| FR15 | Epic 6 | Product listing editing |
| FR16 | Epic 6 | Inventory management |
| FR17 | Epic 9 | Product moderation |
| FR18 | Epic 9 | Product removal + strikes |
| FR19 | Epic 4 | Shopping cart |
| FR20 | Epic 4 | Wishlist |
| FR21 | Epic 4 | Checkout flow |
| FR22 | Epic 4 | Payment methods |
| FR23 | Epic 4 | Order placement |
| FR24 | Epic 4 | Order history + reorder |
| FR25 | Epic 5 | Order tracking |
| FR26 | Epic 5 | Seller order view |
| FR27 | Epic 5 | Seller order fulfillment |
| FR28 | Epic 5 | Order details for seller |
| FR29 | Epic 5 | Admin order monitoring |
| FR30 | Epic 5 | Admin order intervention |
| FR31 | Epic 7 | Review submission |
| FR32 | Epic 7 | Review photos |
| FR33 | Epic 7 | Aggregated ratings |
| FR34 | Epic 7 | Review moderation |
| FR35 | Epic 7 | Issue reporting |
| FR36 | Epic 7 | Evidence upload |
| FR37 | Epic 7 | Seller dispute response |
| FR38 | Epic 7 | Auto-escalation |
| FR39 | Epic 7 | Admin dispute resolution |
| FR40 | Epic 7 | Refund processing |
| FR41 | Epic 8 | Sales analytics |
| FR42 | Epic 8 | Shop performance metrics |
| FR43 | Epic 8 | Commission tracking |
| FR44 | Epic 8 | Admin seller performance view |
| FR45 | Epic 9 | Admin dashboard |
| FR46 | Epic 9 | User/seller management |
| FR47 | Epic 9 | Seller application review |
| FR48 | Epic 9 | Banned seller detection |
| FR49 | Epic 9 | Warning/strike system |
| FR50 | Epic 9 | Platform health metrics |
| FR51 | Epic 10 | Buyer push notifications |
| FR52 | Epic 10 | Promotional notifications |
| FR53 | Epic 10 | Seller push notifications |
| FR54 | Epic 10 | Admin alerts |
| FR55 | Epic 10 | Transactional emails |
| FR56 | Epic 6 | Product image upload |
| FR57 | Epic 6 | CDN image delivery |
| FR58 | Epic 2 | Government ID upload |
| FR59 | Epic 6 | Static asset CDN |

## Epic List

### Epic 1: Project Foundation & Design System
Users can see a polished, consistent, accessible Somago interface across web and mobile.
**FRs covered:** FR8
**ARs covered:** AR1, AR2, AR9, AR10
**UX-DRs covered:** UX-DR1, UX-DR12, UX-DR13, UX-DR14, UX-DR15, UX-DR16

### Epic 2: User Authentication & Profiles
Buyers and sellers can register, log in, manage their profiles, and access role-appropriate features.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7
**ARs covered:** AR3

### Epic 3: Product Catalog & Discovery
Buyers can browse, search, and discover products across categories with filters and visual product detail pages.
**FRs covered:** FR9, FR10, FR11, FR12, FR13
**UX-DRs covered:** UX-DR2, UX-DR3, UX-DR7

### Epic 4: Shopping Cart, Wishlist & Checkout
Buyers can add items to cart, save wishlist items, and complete purchases with multiple payment methods.
**FRs covered:** FR19, FR20, FR21, FR22, FR23, FR24
**ARs covered:** AR4, AR5, AR6
**UX-DRs covered:** UX-DR5, UX-DR17

### Epic 5: Order Management & Tracking
Buyers can track orders in real-time. Sellers can view, confirm, pack, and ship orders.
**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30
**UX-DRs covered:** UX-DR6

### Epic 6: Seller Product Management
Sellers can create, edit, and manage product listings with photos, variants, and inventory.
**FRs covered:** FR14, FR15, FR16, FR56, FR57, FR59
**UX-DRs covered:** UX-DR18

### Epic 7: Reviews, Ratings & Disputes
Buyers can review products and report issues. Sellers can respond to disputes. System auto-escalates unresolved disputes.
**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39, FR40
**UX-DRs covered:** UX-DR8

### Epic 8: Seller Dashboard & Analytics
Sellers can view sales analytics, shop performance metrics, and commission details.
**FRs covered:** FR41, FR42, FR43, FR44
**UX-DRs covered:** UX-DR9

### Epic 9: Platform Administration
Admins can manage users/sellers, moderate content, review seller applications, resolve escalated disputes, and view platform analytics.
**FRs covered:** FR17, FR18, FR45, FR46, FR47, FR48, FR49, FR50
**UX-DRs covered:** UX-DR10, UX-DR11, UX-DR19

### Epic 10: Notifications & Communications
Users receive push notifications, transactional emails, and in-app alerts for order updates, disputes, and platform events.
**FRs covered:** FR51, FR52, FR53, FR54, FR55
**ARs covered:** AR7, AR8

### Epic 11: Mobile App
Buyers and sellers can use all core features via native iOS and Android apps with platform-native navigation.
**FRs covered:** All buyer + seller FRs (mobile parity)
**UX-DRs covered:** UX-DR4

---

## Epic 1: Project Foundation & Design System

Users can see a polished, consistent, accessible Somago interface across web and mobile.

### Story 1.1: Initialize Turborepo Monorepo

As a **developer**,
I want a properly configured monorepo with web, mobile, and shared packages,
So that all apps share code and deploy from a single repository.

**Acceptance Criteria:**

**Given** a fresh repository
**When** the monorepo is initialized with Turborepo
**Then** the following workspace structure exists: `apps/web` (Next.js), `apps/mobile` (Expo), `packages/convex`, `packages/shared`
**And** `turbo dev` starts the web app and Convex dev server simultaneously
**And** `turbo build` compiles all workspaces without errors
**And** TypeScript strict mode is enabled across all workspaces

### Story 1.2: Configure Convex Backend and Database Schema

As a **developer**,
I want a Convex project with the complete database schema designed,
So that all subsequent features have a type-safe data foundation.

**Acceptance Criteria:**

**Given** the Turborepo monorepo from Story 1.1
**When** Convex is initialized in `packages/convex`
**Then** `schema.ts` defines all tables: users, products, categories, orders, cart, reviews, disputes, notifications, auditLog, paymentIntents
**And** all tables have appropriate indexes (e.g., `by_sellerId`, `by_category`, `by_orderStatus`)
**And** search indexes are defined for products (`search_products`)
**And** `npx convex dev` starts successfully and generates TypeScript types
**And** the Convex dashboard shows all tables

### Story 1.3: Set Up CI/CD Pipeline

As a **developer**,
I want automated linting, type-checking, and testing on every PR,
So that code quality is maintained throughout development.

**Acceptance Criteria:**

**Given** the monorepo with Convex configured
**When** a pull request is opened on GitHub
**Then** GitHub Actions runs `turbo lint`, `turbo type-check`, and `turbo test`
**And** Vercel creates a preview deployment for the web app
**And** merging to `main` triggers Vercel production deploy and `npx convex deploy`
**And** `.env.example` documents all required environment variables

### Story 1.4: Implement Design Token System

As a **buyer**,
I want a consistent, polished visual experience,
So that Somago feels trustworthy and professional.

**Acceptance Criteria:**

**Given** the Next.js web app
**When** `tailwind.config.js` is configured
**Then** the green primary palette (primary-50 through primary-900) is available as Tailwind utilities
**And** secondary (teal), semantic (success/warning/error/info), accent (orange/yellow), and neutral (warm gray) colors are defined
**And** typography scale (display through caption) uses Plus Jakarta Sans
**And** spacing scale (space-1 through space-16) follows 4px base unit
**And** border radius and shadow tokens are defined
**And** all color combinations meeting WCAG 2.1 AA contrast ratios are verified

### Story 1.5: Implement Core UI Components (shadcn/ui)

As a **developer**,
I want pre-built, accessible UI components installed,
So that all features use consistent, WCAG-compliant building blocks.

**Acceptance Criteria:**

**Given** the design token system from Story 1.4
**When** shadcn/ui components are installed
**Then** Button, Input, Select, Dialog, Toast, Badge, Avatar, Tabs, Table, Dropdown, Card, Skeleton, Sheet, Command, Checkbox, Progress, and Separator components are available
**And** all components use the Somago design tokens
**And** all components pass WCAG 2.1 AA accessibility audit (axe-core)
**And** keyboard navigation works for all interactive components

### Story 1.6: Implement Responsive Layout System

As a **buyer**,
I want Somago to work beautifully on my phone, tablet, and laptop,
So that I can shop from any device.

**Acceptance Criteria:**

**Given** the design token system
**When** responsive layout utilities are configured
**Then** breakpoints at 375px, 768px, 1024px, 1440px are working
**And** a responsive page shell component exists with max-width 1280px container
**And** product grid adapts: 2-col (mobile), 3-col (tablet), 4-col (desktop), 5-col (wide)
**And** no horizontal scrolling occurs on any breakpoint

### Story 1.7: Implement Skeleton Loading & Empty States

As a **buyer**,
I want to see loading indicators and helpful empty states,
So that I never see a blank white screen.

**Acceptance Criteria:**

**Given** the shadcn/ui Skeleton component
**When** data is loading (Convex `useQuery` returns `undefined`)
**Then** skeleton placeholders appear matching the shape of the content
**And** empty states display illustration + message + CTA button
**And** empty states exist for: cart, orders, wishlist, search results, seller products, admin queues

### Story 1.8: Implement Toast Notification System

As a **user**,
I want immediate visual feedback for my actions,
So that I know my actions succeeded or failed.

**Acceptance Criteria:**

**Given** the shadcn/ui Toast component
**When** a success/error/warning/info event occurs
**Then** a toast notification appears at top-center (mobile) or top-right (desktop)
**And** success toasts auto-dismiss after 3 seconds
**And** error toasts persist until manually dismissed
**And** maximum 1 toast visible at a time with queuing

### Story 1.9: Implement RBAC Middleware and Auth Guards

As an **admin**,
I want role-based access control enforced on all routes and functions,
So that users can only access features appropriate to their role.

**Acceptance Criteria:**

**Given** the Convex backend
**When** auth helper functions are created in `_helpers/auth.ts`
**Then** `requireBuyer()`, `requireSeller()`, and `requireAdmin()` functions exist
**And** each validates user's Clerk identity and role from Convex users table
**And** unauthorized access throws `ConvexError`
**And** Next.js middleware protects `(seller)/` and `(admin)/` route groups

---

## Epic 2: User Authentication & Profiles

Buyers and sellers can register, log in, manage their profiles, and access role-appropriate features.

### Story 2.1: Buyer Registration & Login

As a **buyer**,
I want to register and log in with my phone, email, or social accounts,
So that I can start shopping on Somago.

**Acceptance Criteria:**

**Given** the Clerk integration is configured
**When** a new user visits Somago
**Then** they can register via phone (OTP), email, Google OAuth, or Facebook OAuth
**And** registration completes in under 30 seconds
**And** a Clerk webhook creates a Convex user document with role "buyer"
**And** the user is redirected to the home feed after registration

### Story 2.2: Seller Registration with ID Verification

As a **seller**,
I want to register as a seller by uploading my government ID,
So that I can start listing products on Somago.

**Acceptance Criteria:**

**Given** a registered buyer account
**When** the user submits seller registration
**Then** they can upload a government ID (image, max 10MB) stored in Convex file storage
**And** they fill in business details (shop name, business type)
**And** a seller application is created with status "pending"
**And** admin is notified of the new application

### Story 2.3: Password Reset

As a **user**,
I want to reset my password via email or SMS,
So that I can recover my account.

**Acceptance Criteria:**

**Given** a registered user who forgot their password
**When** they tap "Forgot Password"
**Then** Clerk sends a reset link (email) or OTP (phone)
**And** the user can set a new password and is logged in
**And** rate limiting prevents more than 5 attempts per 15 minutes

### Story 2.4: Buyer Profile & Address Management

As a **buyer**,
I want to manage my profile and delivery addresses,
So that checkout is fast and orders arrive correctly.

**Acceptance Criteria:**

**Given** a logged-in buyer
**When** they navigate to Account settings
**Then** they can edit name, avatar, and contact details
**And** they can add, edit, delete multiple delivery addresses
**And** they can set a default address (pre-selected during checkout)

### Story 2.5: Seller Shop Profile Setup

As a **seller**,
I want to customize my shop profile,
So that buyers can learn about my shop.

**Acceptance Criteria:**

**Given** an approved seller account
**When** the seller navigates to Shop settings
**Then** they can upload a shop logo, write description, set shipping policies
**And** the shop profile is visible on their product listings

---

## Epic 3: Product Catalog & Discovery

Buyers can browse, search, and discover products across categories.

### Story 3.1: Category Browsing

As a **buyer**,
I want to browse products by categories,
So that I can explore products by department.

**Acceptance Criteria:**

**Given** products exist in the catalog
**When** the buyer views the home page
**Then** a CategoryIconGrid displays top-level categories with visual icons
**And** tapping a category shows subcategories and filtered product grid
**And** categories are limited to 2 levels deep

### Story 3.2: Product Search with Filters

As a **buyer**,
I want to search for products and filter results,
So that I can find what I'm looking for quickly.

**Acceptance Criteria:**

**Given** products exist in the catalog
**When** the buyer types a query in the SearchBar
**Then** instant suggestions appear after 2 characters (300ms debounce)
**And** recent searches (max 5) display on focus
**And** results load in a 2-column grid with filters (price, rating, category, location)
**And** active filters show as removable pills
**And** results return within 800ms

### Story 3.3: Product Detail Page

As a **buyer**,
I want to view detailed product information,
So that I can make an informed purchase decision.

**Acceptance Criteria:**

**Given** a product exists
**When** the buyer taps a ProductCard
**Then** product detail page loads with SSR (SEO)
**And** swipeable image gallery, price, variants (tappable pills), ratings, verified seller row display
**And** StickyCtaBar shows "Add to Cart" and "Buy Now"
**And** scrolling reveals description, specs, reviews

### Story 3.4: Product Reviews Display

As a **buyer**,
I want to read reviews from verified purchasers,
So that I can trust the product quality.

**Acceptance Criteria:**

**Given** a product has reviews
**When** the buyer scrolls to reviews section
**Then** aggregated rating and count display
**And** ReviewCards show: stars, text, name, date, verified badge, photo thumbnails
**And** "No reviews yet" empty state shows if none exist

---

## Epic 4: Shopping Cart, Wishlist & Checkout

Buyers can add items to cart, save wishlist, and complete purchases.

### Story 4.1: Shopping Cart

As a **buyer**,
I want to add products to my cart,
So that I can collect items before checkout.

**Acceptance Criteria:**

**Given** a buyer is viewing a product
**When** they tap "Add to Cart"
**Then** the product is added with selected variant and quantity
**And** cart badge animates, success toast confirms
**And** cart page shows items with quantity controls and running total
**And** cart persists across sessions (Convex-synced)

### Story 4.2: Wishlist

As a **buyer**,
I want to save products to my wishlist,
So that I can purchase them later.

**Acceptance Criteria:**

**Given** a buyer is viewing a product
**When** they tap the heart icon
**Then** the product saves to wishlist, heart fills
**And** wishlist page shows saved ProductCards
**And** tapping again removes from wishlist

### Story 4.3: Checkout Flow with COD

As a **buyer**,
I want to check out with Cash on Delivery,
So that I can buy without e-wallet or card.

**Acceptance Criteria:**

**Given** items in cart
**When** buyer taps "Checkout"
**Then** 3-step flow: address (default pre-selected) → payment (COD default) → confirm (summary + total)
**And** "Somago Buyer Protection" badge visible
**And** placing order creates record with status "confirmed", payment "cod"
**And** confirmation screen shows order number, estimated delivery, "Track Order"

### Story 4.4: Stripe Card Payment Integration

As a **buyer**,
I want to pay with credit or debit card,
So that I have a digital payment option.

**Acceptance Criteria:**

**Given** buyer at payment step
**When** they select card payment
**Then** Convex action creates Stripe PaymentIntent
**And** Stripe form collects card details (no data stored on Somago)
**And** success updates order via webhook; failure shows retry option

### Story 4.5: GCash & Maya Payment Integration

As a **buyer**,
I want to pay with GCash or Maya,
So that I can use my preferred e-wallet.

**Acceptance Criteria:**

**Given** buyer at payment step
**When** they select GCash or Maya
**Then** Convex action creates PayMongo payment source
**And** buyer redirected to e-wallet for authorization
**And** success updates order via webhook; cancellation returns to checkout

### Story 4.6: Order History & Reorder

As a **buyer**,
I want to view past orders and reorder,
So that I can quickly repurchase.

**Acceptance Criteria:**

**Given** buyer has completed orders
**When** they navigate to Orders tab
**Then** order history sorted by most recent with status badges
**And** "Reorder" button adds same items to cart
**And** empty state with "Browse Products" CTA when no orders

---

## Epic 5: Order Management & Tracking

Buyers track orders. Sellers fulfill orders.

### Story 5.1: Buyer Order Tracking

As a **buyer**,
I want to track my order in real-time,
So that I know when it will arrive.

**Acceptance Criteria:**

**Given** an order is placed
**When** buyer views order detail
**Then** OrderTimeline shows: Confirmed → Packed → Shipped → Out for Delivery → Delivered
**And** completed steps show green checks with timestamps, current step pulses
**And** updates appear in real-time via Convex subscription (within 3 seconds)

### Story 5.2: Seller Order Dashboard & Fulfillment

As a **seller**,
I want to view and fulfill orders,
So that I can ship products efficiently.

**Acceptance Criteria:**

**Given** seller has received orders
**When** they navigate to Seller Orders
**Then** orders display in pipeline: New → Confirmed → Packed → Shipped → Completed
**And** seller can confirm, pack, and ship (with tracking number) orders
**And** push notification on new orders

### Story 5.3: Admin Order Monitoring

As an **admin**,
I want to monitor all orders,
So that I can intervene when issues arise.

**Acceptance Criteria:**

**Given** orders exist
**When** admin views orders page
**Then** sortable, searchable data table shows all orders
**And** filters by status, date, seller, buyer
**And** admin can view full details and intervene on escalated disputes

---

## Epic 6: Seller Product Management

Sellers can create, edit, and manage products.

### Story 6.1: Product Listing Wizard

As a **seller**,
I want to create a product listing through a guided wizard,
So that I can list my first product in under 3 minutes.

**Acceptance Criteria:**

**Given** an approved seller
**When** they tap "+ Add Product"
**Then** 4-step wizard: Photos (1-10, drag reorder) → Details (name, category, description, variants) → Pricing (price, stock, commission preview) → Review (ProductCard preview + Publish)
**And** celebration animation on publish
**And** auto-save drafts after each step
**And** images uploaded to Convex file storage with optimization

### Story 6.2: Edit Product Listing

As a **seller**,
I want to edit my existing listings,
So that I can update prices, descriptions, and stock.

**Acceptance Criteria:**

**Given** seller has published products
**When** they tap edit
**Then** form loads with current data pre-filled
**And** seller can modify any field and save
**And** only owning seller can edit (RBAC enforced)

### Story 6.3: Inventory Management

As a **seller**,
I want to manage stock levels,
So that buyers don't order out-of-stock items.

**Acceptance Criteria:**

**Given** products with variants
**When** seller views Products page
**Then** stock levels display per variant
**And** low stock (< 5) highlighted with warning
**And** out-of-stock variants grayed out and not purchasable
**And** stock auto-decreases on order placement

---

## Epic 7: Reviews, Ratings & Disputes

Buyers review products and resolve issues.

### Story 7.1: Submit Product Review

As a **buyer**,
I want to leave a rating and review with photos,
So that I can help other buyers.

**Acceptance Criteria:**

**Given** buyer received a delivered order
**When** they tap "Write Review"
**Then** they can select 1-5 stars, write text, upload up to 5 photos
**And** "Verified Purchase" badge applied automatically
**And** product aggregated rating updates

### Story 7.2: Report Order Issue

As a **buyer**,
I want to report a problem with my order,
So that I can get a refund or replacement.

**Acceptance Criteria:**

**Given** buyer received an order
**When** they tap "Report Issue"
**Then** select issue type, upload evidence photos, optional description
**And** dispute created, seller notified with 48-hour response window

### Story 7.3: Seller Dispute Response

As a **seller**,
I want to respond to disputes,
So that I can resolve issues.

**Acceptance Criteria:**

**Given** a dispute filed against seller's order
**When** seller views the dispute
**Then** they see issue details and evidence
**And** can offer replacement or refund
**And** buyer can accept or reject the offer

### Story 7.4: Auto-Escalation & Admin Resolution

As an **admin**,
I want unresolved disputes to auto-escalate,
So that buyers always get resolution.

**Acceptance Criteria:**

**Given** dispute open 48 hours without seller response
**When** Convex scheduled function fires
**Then** dispute escalates to admin
**And** admin can approve refund (to Somago balance) or reject with reason
**And** buyer notified of resolution
**And** action logged in audit trail

### Story 7.5: Review Moderation

As an **admin**,
I want to moderate flagged reviews,
So that content stays trustworthy.

**Acceptance Criteria:**

**Given** reviews flagged as inappropriate
**When** admin views moderation queue
**Then** can approve (keep) or remove (delete) reviews
**And** action logged in audit trail

---

## Epic 8: Seller Dashboard & Analytics

Sellers view sales performance.

### Story 8.1: Seller Dashboard Overview

As a **seller**,
I want to see key metrics at a glance,
So that I know how my business is performing.

**Acceptance Criteria:**

**Given** seller with sales history
**When** they open Dashboard
**Then** greeting + StatCards (Today's Sales, Pending Orders, Products Listed) + recent orders table
**And** real-time data via Convex subscriptions

### Story 8.2: Sales Analytics & Reports

As a **seller**,
I want detailed sales analytics,
So that I can optimize my strategy.

**Acceptance Criteria:**

**Given** seller has completed orders
**When** they view Analytics page
**Then** revenue over time, top products, order trends, shop performance, commission deductions display
**And** data aggregated by Convex cron jobs

---

## Epic 9: Platform Administration

Admins manage the marketplace.

### Story 9.1: Admin Dashboard with Priority Queue

As an **admin**,
I want an overnight summary and prioritized queue,
So that I can clear my workload efficiently.

**Acceptance Criteria:**

**Given** overnight platform activity
**When** admin opens Dashboard
**Then** AlertCards: Disputes (red), Flagged Products (yellow), Applications (blue), Uptime (green)
**And** priority queue sorted by urgency with action buttons
**And** "All Queues Green" state when resolved

### Story 9.2: Seller Application Review

As an **admin**,
I want to review seller applications,
So that only verified sellers list products.

**Acceptance Criteria:**

**Given** pending applications
**When** admin views Applications
**Then** displays applicant, ID document, business details
**And** can approve, reject, or request resubmission
**And** batch approve multiple valid applications
**And** flags matching banned sellers
**And** actions logged in audit trail

### Story 9.3: Product Moderation

As an **admin**,
I want to review flagged products,
So that the marketplace stays safe.

**Acceptance Criteria:**

**Given** flagged products
**When** admin views Moderation queue
**Then** can warn seller (48hr correction), remove + strike, or approve
**And** 3 strikes = account suspension
**And** actions logged

### Story 9.4: User & Seller Management

As an **admin**,
I want to manage accounts,
So that I maintain platform safety.

**Acceptance Criteria:**

**Given** users on the platform
**When** admin views User Management
**Then** searchable table with name, role, status, join date
**And** can suspend or ban accounts
**And** actions logged

### Story 9.5: Platform Analytics

As an **admin**,
I want platform-wide metrics,
So that I track growth and health.

**Acceptance Criteria:**

**Given** active platform
**When** admin views Analytics
**Then** GMV, active users, transactions, top categories, health metrics display
**And** filterable by date range

---

## Epic 10: Notifications & Communications

Users receive timely notifications.

### Story 10.1: Push Notification Infrastructure

As a **user**,
I want push notifications on my phone,
So that I'm instantly informed about updates.

**Acceptance Criteria:**

**Given** mobile app installed
**When** notification event occurs
**Then** Convex action sends push via FCM/APNs
**And** notification includes title, body, deep link
**And** 95%+ delivery rate

### Story 10.2: Transactional Email Service

As a **user**,
I want emails for important events,
So that I have permanent records.

**Acceptance Criteria:**

**Given** transactional event occurs
**When** email triggers
**Then** Convex action sends via Resend
**And** emails for: order confirmation, seller approval, password reset, dispute resolution
**And** 99%+ delivery rate

### Story 10.3: In-App Notification Center

As a **user**,
I want all notifications in one place,
So that I never miss updates.

**Acceptance Criteria:**

**Given** notifications sent
**When** user taps bell icon
**Then** notification list sorted by recent, unread visually distinct
**And** tapping marks as read and navigates to relevant screen
**And** badge shows unread count
**And** real-time updates via Convex subscription

---

## Epic 11: Mobile App

Buyers and sellers use Somago on iOS and Android.

### Story 11.1: Mobile App Shell & Navigation

As a **mobile user**,
I want a native app with bottom tab navigation,
So that I can shop and manage my store on my phone.

**Acceptance Criteria:**

**Given** Expo app configured in monorepo
**When** user launches app
**Then** Clerk auth with SecureStore, Convex client connected
**And** buyer tabs: Home, Categories, Cart (badge), Orders, Account
**And** seller tabs: Dashboard, Orders, Products, Analytics, Shop
**And** NativeWind uses same design tokens as web

### Story 11.2: Mobile Buyer Experience

As a **mobile buyer**,
I want to browse and purchase on my phone,
So that I can shop during my commute.

**Acceptance Criteria:**

**Given** mobile app shell
**When** buyer uses app
**Then** home feed with product grid, pull-to-refresh
**And** search with suggestions, filters in bottom sheet
**And** product detail with swipe gallery and sticky CTA
**And** checkout with all payment methods
**And** order tracking with push notifications
**And** all interactions thumb-friendly (44px targets)
**And** cold launch under 2 seconds

### Story 11.3: Mobile Seller Experience

As a **mobile seller**,
I want to manage my shop on my phone,
So that I can list products and fulfill orders on the go.

**Acceptance Criteria:**

**Given** mobile app with seller tabs
**When** seller uses app
**Then** dashboard with stat cards and orders
**And** product listing wizard with camera access
**And** order fulfillment (confirm/pack/ship)
**And** analytics in compact format
**And** push notifications for new orders
**And** draft listings save locally for offline
