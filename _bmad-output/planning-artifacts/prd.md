---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments: [product-brief-somago-2026-03-15.md]
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
  projectContext: 0
classification:
  projectType: web_app + mobile_app + api_backend
  domain: e-commerce/marketplace
  complexity: medium-high
  projectContext: greenfield
---

# Product Requirements Document - Somago

**Author:** deliveryboy
**Date:** 2026-03-15

## Executive Summary

Somago is a full-stack e-commerce marketplace platform targeting the Southeast Asian market, connecting buyers with small-to-medium sellers through a unified web and mobile experience. The platform addresses two core problems: (1) SME sellers lack affordable, intuitive marketplace access to grow beyond local reach, and (2) buyers demand fast, trustworthy shopping with flexible payment options and reliable order tracking. Somago delivers a Shopee-equivalent feature set across three user roles — buyers, sellers, and platform administrators — with a microservices-ready architecture designed to scale from thousands to millions of users.

### What Makes This Special

Somago is built as a modern, modular, and extensible marketplace platform — unlike closed ecosystems like Shopee, Lazada, and Tokopedia, it provides a customizable, self-hostable foundation for localized e-commerce. The codebase serves dual purpose: a production-ready marketplace and a comprehensive reference architecture for large-scale e-commerce systems. Built API-first, containerized, and cloud-native, it follows an MVP-first delivery strategy that enables iterative market validation while maintaining a clear path to full-scale operation.

## Project Classification

- **Project Type:** Multi-platform (responsive web SPA + native iOS/Android apps + API backend)
- **Domain:** E-commerce / Marketplace
- **Complexity:** Medium-High — payment processing, multi-role authentication, real-time notifications, image-heavy catalog, concurrent transaction handling
- **Project Context:** Greenfield — new platform built from scratch
- **Key Domain Concerns:** PCI DSS awareness, multi-tenant seller architecture, search/catalog performance at scale, fraud prevention, user data privacy

## Success Criteria

### User Success

**Buyer Success:**
- Search-to-checkout completion in under 5 minutes for returning users
- Real-time order tracking accuracy of 95%+ (status reflects actual shipment state)
- 80%+ of buyers rate their purchase experience 4+ stars
- Cart abandonment rate below 30% within 6 months of launch
- Buyers can complete checkout with 2 or fewer payment attempts

**Seller Success:**
- New product listing created and published in under 3 minutes
- Orders confirmed and shipped within 24 hours of placement by 80%+ of sellers
- Sellers access actionable analytics (top products, revenue trends) within 2 clicks from dashboard
- 70%+ seller retention at 90 days post-registration

**Admin Success:**
- Flagged content reviewed and actioned within 4 hours during business hours
- Platform-wide metrics (GMV, active users, disputes) visible in real-time on admin dashboard
- Seller applications processed within 48 hours

### Business Success

**3-Month Targets (MVP Launch):**
- Platform operational with end-to-end buyer-seller-admin flows
- 100+ registered sellers with active listings
- 1,000+ registered buyers with completed purchases
- At least 2 payment methods functional (e-wallet + COD)

**12-Month Targets (Growth):**
- 10,000+ monthly active buyers
- 1,000+ active sellers
- GMV growing 20% month-over-month
- Revenue via 5-10% seller commission per transaction
- Conversion rate of 3-5% (visitors to purchasers)

### Technical Success

- 99.5%+ platform uptime measured monthly
- API response time p95 < 500ms for catalog/search endpoints
- Page load time < 3 seconds on 4G mobile connections
- Platform sustains 1,000+ concurrent users without degradation at MVP launch
- Zero critical security vulnerabilities in payment and auth flows
- Mobile apps achieve 4.0+ star rating on App Store and Google Play

### Measurable Outcomes

| Metric | MVP Target | 12-Month Target |
|--------|-----------|-----------------|
| Monthly Active Users | 1,000+ | 10,000+ |
| Active Sellers | 100+ | 1,000+ |
| GMV | First transactions | 20% MoM growth |
| Conversion Rate | Baseline established | 3-5% |
| Buyer Retention (30-day) | Baseline established | 40%+ |
| Seller Retention (90-day) | Baseline established | 70%+ |
| Order Fulfillment Rate | 80%+ | 95%+ |
| Platform Uptime | 99%+ | 99.5%+ |

## User Journeys

### Journey 1: Maria Discovers and Buys Her First Item (Buyer — Happy Path)

Maria, a 22-year-old student in Metro Manila, is scrolling through her phone on the MRT home from class. She sees a Somago ad on Instagram for affordable laptop sleeves. She taps through, downloads the app, and signs up with her phone number in under 30 seconds.

She searches "laptop sleeve 14 inch" and gets filtered results sorted by relevance. She spots one with 4.5 stars and 200+ reviews for ₱350. She taps into the product page — clear photos, size chart, and reviews from verified buyers. She adds it to cart, adds a phone case she spots in "You May Also Like," and proceeds to checkout.

At checkout, she selects Cash on Delivery since she doesn't have a credit card. She confirms her dorm address, reviews the order summary, and places the order. She immediately gets a push notification: "Order confirmed! Estimated delivery: 3-5 days."

Over the next three days, Maria checks the order tracking page twice — she sees "Packed," then "Shipped," then "Out for Delivery." The courier arrives, she pays cash, and the item matches expectations. She leaves a 5-star review with a photo: "Perfect fit for my laptop!" She adds the seller to her favorites and starts browsing for more.

**Capabilities revealed:** App onboarding, search with filters, product detail pages, reviews, cart, COD payment, order tracking, push notifications, review submission, seller follow.

---

### Journey 2: Maria's Order Goes Wrong (Buyer — Edge Case)

Two weeks later, Maria orders a phone case that arrives cracked. She opens the app, goes to Order History, and taps "Report Issue." She selects "Item damaged" from a dropdown, uploads two photos of the cracked case, and adds a note.

The system creates a dispute ticket and notifies both Maria and the seller. Maria gets a push notification: "Your report has been submitted. The seller has 48 hours to respond." The seller offers a replacement, but Maria prefers a refund. She selects "Request refund" in the dispute thread.

The seller doesn't respond within 48 hours, so the dispute auto-escalates to platform admin. Jay (admin) reviews the photos, approves the refund, and Maria receives her money back to her Somago balance within 24 hours. She gets a notification: "Refund of ₱180 has been credited to your Somago balance."

Maria is frustrated but relieved the process was straightforward. She uses the balance on her next purchase.

**Capabilities revealed:** Order history, dispute/report system, photo upload for disputes, seller-buyer dispute communication, auto-escalation rules, admin dispute review, refund processing, in-app balance/credits, notification system for dispute status.

---

### Journey 3: Rina Opens Her Shop and Makes Her First Sale (Seller — Success Path)

Rina, a 34-year-old entrepreneur in Cebu, has been selling handmade clothes on Facebook and wants to expand. She downloads Somago, taps "Sell on Somago," and starts the seller registration. She uploads her government ID, fills in her business details, and submits for verification.

Within 24 hours, she gets an email: "Your seller account has been approved!" She logs into the Seller Dashboard and sets up her shop — uploads a logo, writes a shop description, and sets her shipping policy.

She lists her first product: a hand-embroidered blouse. She uploads 5 photos, writes a description with size variants (S/M/L/XL), sets prices (₱850 for S-L, ₱950 for XL), and enters stock quantities. The listing goes live after a quick content review.

Three days later, her phone buzzes: "New order! Maria ordered 1x Embroidered Blouse (Size M)." Rina opens the Seller Dashboard, confirms the order, prints the shipping label, packs the item, and marks it as "Shipped" with a tracking number from J&T Express.

After delivery confirmation, Rina checks her Sales Analytics: 1 order, ₱850 GMV, ₱807.50 net after 5% commission. She sees the dashboard showing her shop views, conversion rate, and that the blouse is her top-performing product. She lists 10 more items that weekend.

**Capabilities revealed:** Seller registration with ID verification, seller approval workflow, shop profile setup, product listing with variants/pricing/stock, content moderation queue, order notification, order confirmation flow, shipping label/tracking, sales analytics dashboard, commission calculation, shop performance metrics.

---

### Journey 4: Jay Handles a Busy Monday Morning (Admin — Operations)

Jay, a 28-year-old platform ops team member, starts his Monday by opening the Admin Dashboard. The overnight summary shows: 12 new seller applications, 3 flagged products, 2 escalated disputes, and platform health is green (99.8% uptime over the weekend).

He starts with the escalated disputes. The first is Maria's cracked phone case — he reviews the photos, sees the seller didn't respond in 48 hours, and approves the refund with one click. The second dispute is a buyer claiming non-delivery, but tracking shows "Delivered" — Jay messages the buyer for clarification and puts it on hold.

Next, he reviews flagged products. Two are listings with misleading photos (stock images for handmade items) — he sends warnings to the sellers with a 48-hour correction window. The third is a prohibited item (counterfeit branded goods) — he immediately removes the listing and issues a first-strike warning to the seller.

He then processes seller applications. He batch-reviews the 12 applications — 10 have valid IDs and complete profiles (approved), 1 has a blurry ID (requests resubmission), and 1 has suspicious details matching a previously banned seller (rejected with notes).

Before lunch, Jay checks Platform Analytics: weekend GMV was ₱2.3M (+15% vs previous weekend), 450 new buyer registrations, and the top-selling category was Electronics. He flags a trending spike in "Fashion > Accessories" for the marketing team to consider for a future promotion.

**Capabilities revealed:** Admin dashboard with overnight summary, dispute management with one-click actions, buyer/seller communication from admin, product moderation (warn/remove/strike), seller application batch review (approve/reject/request resubmission), banned seller detection, platform analytics (GMV, registrations, category trends), seller strike/warning system.

---

### Journey Requirements Summary

| Capability Area | Revealed By Journeys |
|----------------|---------------------|
| **Auth & Onboarding** | Maria signup, Rina seller registration, Jay admin login |
| **Product Catalog** | Maria browsing/search, Rina listing products |
| **Shopping Flow** | Maria cart/checkout/payment |
| **Order Management** | Maria tracking, Rina confirming/shipping, Jay monitoring |
| **Payments** | Maria COD, Rina commission settlement, Maria refund |
| **Reviews & Ratings** | Maria leaving review |
| **Dispute Resolution** | Maria reporting, seller responding, Jay resolving |
| **Seller Dashboard** | Rina analytics, shop setup, inventory |
| **Admin Dashboard** | Jay moderation, analytics, seller approvals |
| **Notifications** | Push notifications across all journeys |
| **Content Moderation** | Jay reviewing flagged products, seller strikes |
| **Platform Analytics** | Jay GMV tracking, category trends, health monitoring |

## Domain-Specific Requirements

### Compliance & Regulatory

- **PCI DSS Awareness:** Payment card data must never be stored on Somago servers — delegate to payment gateway (Stripe, PayMongo, or equivalent) for tokenized card processing
- **Data Privacy Act of 2012 (Philippines):** User PII (names, addresses, phone numbers) must be encrypted at rest and in transit; users must be able to request data deletion
- **Consumer Protection:** Order cancellation and refund policies must comply with DTI (Department of Trade and Industry) e-commerce guidelines
- **Seller Verification:** Government ID verification required for sellers to prevent fraud and comply with anti-money laundering basics
- **Tax Compliance:** Platform must support generation of sales records for seller tax reporting; withholding tax on commissions where applicable

### Technical Constraints

- **Payment Security:** All payment flows via HTTPS with TLS 1.2+; no raw card numbers in logs or databases; payment gateway handles PCI scope
- **Data Encryption:** AES-256 encryption at rest for PII; TLS 1.2+ for all data in transit
- **Authentication Security:** Bcrypt/Argon2 password hashing; rate-limited login attempts; optional 2FA via SMS/authenticator
- **Image Handling:** User-uploaded images must be scanned for malicious content; served via CDN with signed URLs; max file size enforced
- **Session Management:** JWT tokens with short expiry (15-30 min access, 7-day refresh); secure, httpOnly cookies for web
- **Rate Limiting:** API rate limiting to prevent abuse (search spam, cart manipulation, review bombing)

### Integration Requirements

- **Payment Gateway:** PayMongo or Stripe (Philippines) for card and e-wallet processing; GCash and Maya integration for e-wallets
- **SMS/OTP Provider:** Semaphore or Twilio for phone verification and OTP during registration/login
- **Push Notifications:** Firebase Cloud Messaging (FCM) for Android, APNs for iOS
- **Email Service:** SendGrid or AWS SES for transactional emails (order confirmations, seller approvals)
- **CDN:** Cloudflare or AWS CloudFront for product images and static assets
- **Object Storage:** AWS S3 or equivalent for product images, user uploads, seller documents

### Risk Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment fraud | Financial loss, trust erosion | Gateway-side fraud detection, velocity checks, seller verification |
| Fake/counterfeit products | Legal liability, buyer distrust | Content moderation queue, seller strikes, buyer reporting |
| Platform downtime during peak | Lost revenue, user churn | Auto-scaling infrastructure, load testing, CDN caching |
| Data breach (PII/payment) | Legal penalties, reputation damage | Encryption at rest/transit, minimal data retention, security audits |
| Seller account abuse | Marketplace quality degradation | ID verification, progressive trust system, strike policy |
| Review manipulation | Buyer distrust | Verified purchase reviews only, anti-spam detection |

## Multi-Platform Specific Requirements

### Project-Type Overview

Somago is a multi-platform e-commerce marketplace consisting of three tightly integrated components:
1. **Web Application** — Responsive SPA for buyers, sellers, and admins (browser-based)
2. **Mobile Applications** — Native iOS and Android apps for buyers and sellers
3. **API Backend** — RESTful API layer serving all frontends and enabling future integrations

All three platforms share a single API backend, ensuring consistent business logic and data integrity across channels.

### Technical Architecture Considerations

**Web Application (SPA):**
- Single Page Application architecture for fast, app-like browsing experience
- Server-side rendering (SSR) for product pages to support SEO and social sharing
- Progressive Web App (PWA) capabilities for add-to-homescreen and offline product browsing
- Browser support: Chrome, Safari, Firefox, Edge (latest 2 versions)
- Responsive design: mobile-first, breakpoints at 375px, 768px, 1024px, 1440px
- Accessibility: WCAG 2.1 Level AA compliance for core buyer flows

**Mobile Applications (iOS & Android):**
- Cross-platform framework (React Native or Flutter) for code sharing between iOS and Android
- Minimum OS support: iOS 15+, Android 10+ (API 29+)
- Device permissions required: Camera (product photos for sellers, review photos), Push notifications, Location (optional, for delivery estimates), Photo library access
- Offline capabilities: Product browsing cache, cart persistence, draft product listings for sellers
- Push notification strategy: FCM (Android) + APNs (iOS) for order updates, promotions, seller alerts
- App Store compliance: Apple App Store Guidelines, Google Play Developer Policies
- Deep linking for marketing campaigns and social sharing

**API Backend:**
- RESTful API design with versioned endpoints (v1/v2)
- Authentication: JWT with refresh token rotation; OAuth2 for social login (Google, Facebook)
- Rate limiting: Per-user and per-IP rate limits; stricter limits on auth endpoints
- Data format: JSON request/response; multipart for image uploads
- Pagination: Cursor-based pagination for product listings, order history
- Error handling: Consistent error response format with error codes and messages
- API documentation: OpenAPI 3.0 spec auto-generated and published

### Platform-Specific Sections

**Responsive Design Requirements:**
| Breakpoint | Target | Layout |
|-----------|--------|--------|
| 375px | Mobile phones | Single column, bottom nav, touch-optimized |
| 768px | Tablets | Two-column product grid, side navigation |
| 1024px | Small laptops | Three-column grid, expanded filters |
| 1440px | Desktops | Four-column grid, full dashboard layouts |

**Permission Matrix (RBAC):**
| Resource | Buyer | Seller | Admin |
|----------|-------|--------|-------|
| Browse products | Read | Read | Read |
| Purchase products | Create | — | — |
| Manage cart/wishlist | CRUD own | — | — |
| List products | — | CRUD own | Read/Delete any |
| Manage inventory | — | CRUD own | Read any |
| View own orders | Read own | Read own shop | Read all |
| Manage disputes | Create own | Respond own | CRUD all |
| View analytics | — | Own shop | Platform-wide |
| Manage users | — | — | CRUD all |
| Moderate content | — | — | CRUD all |
| Approve sellers | — | — | CRUD all |

**Performance Targets:**
| Metric | Web | Mobile |
|--------|-----|--------|
| First Contentful Paint | < 1.5s | N/A (native) |
| Time to Interactive | < 3s | App launch < 2s |
| API Response (p95) | < 500ms | < 500ms |
| Image Load (CDN) | < 1s | < 1s |
| Search Results | < 800ms | < 800ms |
| Checkout Flow | < 2s per step | < 2s per step |

### Implementation Considerations

- **Shared API Contract:** All three platforms consume the same REST API — no platform-specific backend logic
- **Real-time Layer:** WebSocket connections for order status updates and notifications; fallback to polling on unreliable connections
- **Image Pipeline:** Client-side compression before upload → S3 storage → CDN delivery with responsive image variants (thumbnail, medium, full)
- **State Management:** Cart and wishlist synced server-side to ensure consistency across web and mobile
- **Feature Parity:** Core buyer and seller flows must be identical across web and mobile; admin dashboard web-only for MVP
- **Release Strategy:** Web deploys independently (CI/CD); mobile releases coordinated for App Store/Play Store review cycles (1-3 day lag)

## Product Scope & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Platform MVP — deliver the complete marketplace loop (buyer discovers → purchases → seller fulfills → admin monitors) across all platforms (web + iOS + Android) simultaneously. This validates the full marketplace dynamic rather than testing individual features in isolation.

**Resource Requirements:**
- Full-stack developers (3-4) for API backend and web frontend
- Mobile developers (2) for React Native / Flutter cross-platform apps
- UI/UX designer (1) for consistent design system across platforms
- DevOps/Infrastructure (1) for CI/CD, cloud setup, deployment pipelines
- QA (1) for cross-platform testing
- Product/Project lead (1) — deliveryboy
- **Minimum viable team: 8-10 people** (can be smaller with cross-functional developers)

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
1. Maria's Happy Path — buyer discovers, purchases, tracks, and reviews (web + mobile)
2. Rina's Success Path — seller registers, lists products, fulfills orders, views analytics (web + mobile)
3. Jay's Operations — admin monitors platform, moderates content, manages users (web only)

**Must-Have Capabilities:**
| Capability | Buyer | Seller | Admin |
|-----------|-------|--------|-------|
| Registration & Auth | Phone/email + social | Phone/email + ID verification | Internal credentials |
| Core Dashboard | — | Sales overview, orders, listings | Platform metrics, queues |
| Product Management | Browse, search, filter, view | Create, edit, manage stock | Moderate, flag, remove |
| Shopping Flow | Cart, wishlist, checkout | — | — |
| Order Flow | Place, track, review | Confirm, ship, complete | Monitor, resolve disputes |
| Payments | Cards, e-wallets, COD | Commission settlement | Transaction monitoring |
| Notifications | Push (order updates) | Push (new orders) | Dashboard alerts |

**MVP Technical Foundation:**
Modular monolith (microservices-ready), JWT auth with RBAC, RESTful APIs, image upload + CDN, real-time notifications (WebSocket/push), payment gateway integration, PostgreSQL with optimized indexing, Redis caching, responsive web SPA + native iOS/Android apps.

**Explicitly Excluded from MVP:**
- Live chat, vouchers/coupons, flash sales, shipping API integration, in-app wallet, AI recommendations, gamification, multi-language, seller ads, affiliate program

### Phase 2 — Growth (Months 4-8)

- Live chat / messaging between buyers and sellers
- Voucher and coupon system with seller-created promotions
- Flash sales and daily deals engine with countdown timers
- Shipping partner API integration (J&T, LBC, Grab Express) for automated tracking
- In-app wallet (Somago Pay) for faster checkout
- Basic product recommendations based on browsing history
- Seller performance tiers (response rate, fulfillment speed)

### Phase 3 — Scale (Months 9-14)

- AI-powered search and personalized recommendations
- Seller advertising platform (promoted listings, banner ads)
- Multi-language (Filipino, English) and multi-currency support
- Affiliate and referral program with tracking
- Gamification (Somago Coins, daily check-in rewards, loyalty tiers)
- Advanced seller analytics and business insights
- Bulk order management tools for high-volume sellers

### Phase 4 — Ecosystem (12+ Months)

- Somago Mall (verified brand stores with premium placement)
- Somago Express (integrated logistics with own delivery network)
- API marketplace for third-party integrations (ERP, inventory, accounting)
- Seller financing and working capital tools
- Social commerce features (live selling, social feed, influencer storefronts)

### Risk Mitigation Strategy

**Technical Risks:**
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Cross-platform complexity slows delivery | High | Use React Native/Flutter for shared mobile codebase; design system for UI consistency |
| Payment integration delays | Medium | Start with PayMongo sandbox early; COD as fallback payment at launch |
| Performance under load | Medium | Load test with k6/Locust before launch; auto-scaling from day one; CDN for static assets |
| Real-time notifications unreliable | Low | WebSocket with polling fallback; FCM/APNs for mobile push |

**Market Risks:**
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Low seller adoption | High | Seed marketplace with 50+ curated sellers before public launch; offer 0% commission for first 3 months |
| Low buyer trust (new platform) | High | Buyer protection guarantee; verified seller badges; visible review system |
| Competing with established platforms | High | Focus on niche/local markets first; lower commission rates; better seller tools |

**Resource Risks:**
| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Team smaller than planned | Medium | Prioritize API + web first; delay mobile to Phase 1.5 if needed |
| Budget constraints | Medium | Use open-source stack; start with free-tier cloud services; scale infrastructure with revenue |
| Key developer departure | Low | Documented architecture; code reviews; no single points of failure in knowledge |

## Functional Requirements

### User Identity & Access

- FR1: Buyers can register using email, phone number, or social login (Google, Facebook)
- FR2: Sellers can register using email or phone number with government ID upload for verification
- FR3: Admins can log in using internal credentials with role-based access
- FR4: Users can reset their password via email or SMS OTP
- FR5: Users can manage their profile information (name, avatar, contact details)
- FR6: Buyers can manage multiple delivery addresses with a default selection
- FR7: Sellers can set up and customize their shop profile (logo, description, shipping policy)
- FR8: System can enforce role-based access control across buyer, seller, and admin roles

### Product Catalog & Discovery

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

### Shopping & Checkout

- FR19: Buyers can add products to a shopping cart with quantity selection
- FR20: Buyers can save products to a wishlist for later purchase
- FR21: Buyers can proceed through a checkout flow with order summary and address selection
- FR22: Buyers can select from multiple payment methods (credit/debit card, e-wallet, COD)
- FR23: Buyers can place an order and receive an order confirmation
- FR24: Buyers can view their order history and reorder previous purchases

### Order Management

- FR25: Buyers can track order status in real-time (confirmed, packed, shipped, out for delivery, delivered)
- FR26: Sellers can view incoming orders on their dashboard
- FR27: Sellers can confirm, pack, and mark orders as shipped with a tracking number
- FR28: Sellers can view order details including buyer shipping address and payment method
- FR29: Admins can monitor all orders across the platform
- FR30: Admins can intervene in orders when disputes are escalated

### Reviews & Ratings

- FR31: Buyers can submit a star rating and text review for purchased products
- FR32: Buyers can upload photos with their reviews
- FR33: Buyers can view aggregated ratings and individual reviews on product pages
- FR34: Admins can moderate reviews flagged as inappropriate or fraudulent

### Dispute Resolution

- FR35: Buyers can report issues with orders (damaged item, non-delivery, wrong item)
- FR36: Buyers can upload evidence (photos) when reporting an issue
- FR37: Sellers can respond to buyer disputes with proposed resolutions
- FR38: System can auto-escalate disputes to admin when seller does not respond within 48 hours
- FR39: Admins can review disputes, approve refunds, or reject claims
- FR40: Buyers can receive refunds credited to their Somago balance

### Seller Analytics & Performance

- FR41: Sellers can view sales analytics (revenue, top products, order trends) on their dashboard
- FR42: Sellers can view shop performance metrics (views, conversion rate, response rate)
- FR43: Sellers can view commission deductions per transaction
- FR44: Admins can view seller performance data for moderation decisions

### Platform Administration

- FR45: Admins can view a platform-wide dashboard with key metrics (GMV, active users, transaction volume)
- FR46: Admins can manage buyer and seller accounts (view, suspend, ban)
- FR47: Admins can review and process seller applications (approve, reject, request resubmission)
- FR48: Admins can detect and flag accounts matching previously banned sellers
- FR49: Admins can issue warnings and strikes to sellers with an escalation policy
- FR50: Admins can view platform health metrics (uptime, error rates)

### Notifications

- FR51: Buyers can receive push notifications for order status updates
- FR52: Buyers can receive push notifications for promotions and deals
- FR53: Sellers can receive push notifications for new orders and dispute alerts
- FR54: Admins can receive dashboard alerts for escalated disputes and flagged content
- FR55: Users can receive transactional emails (order confirmation, seller approval, password reset)

### Media & Content

- FR56: Sellers can upload product images with automatic optimization for multiple display sizes
- FR57: Buyers can view product images delivered via CDN for fast loading
- FR58: Sellers can upload government ID documents securely during registration
- FR59: System can serve static assets and images through a content delivery network

## Non-Functional Requirements

### Performance

- NFR1: Product search results return within 800ms at p95 under normal load
- NFR2: API responses complete within 500ms at p95 for all catalog and order endpoints
- NFR3: Web pages achieve First Contentful Paint under 1.5 seconds on broadband connections
- NFR4: Mobile app cold launch to interactive state within 2 seconds on mid-range devices
- NFR5: Product images load within 1 second via CDN on 4G connections
- NFR6: Checkout flow steps complete within 2 seconds each including payment gateway round-trip
- NFR7: Real-time order status updates delivered to clients within 3 seconds of state change
- NFR8: Database queries for product listing pages execute within 100ms with proper indexing

### Security

- NFR9: All data in transit encrypted via TLS 1.2+ with no exceptions
- NFR10: All PII (names, addresses, phone numbers, emails) encrypted at rest using AES-256
- NFR11: Passwords hashed using Argon2 or bcrypt with minimum cost factor of 10
- NFR12: JWT access tokens expire within 15-30 minutes; refresh tokens within 7 days
- NFR13: Login attempts rate-limited to 5 attempts per 15-minute window per IP/account
- NFR14: Payment card data never stored on Somago servers — delegated entirely to PCI-compliant payment gateway
- NFR15: Government ID uploads stored in encrypted object storage with access restricted to admin verification workflows
- NFR16: API endpoints enforce authorization checks — users cannot access or modify resources belonging to other users
- NFR17: All admin actions logged in an immutable audit trail (who, what, when)
- NFR18: File uploads validated for type, size (max 10MB images), and scanned for malicious content
- NFR19: CSRF protection on all state-changing web endpoints; XSS prevention via output encoding

### Scalability

- NFR20: System supports 1,000 concurrent users at MVP launch without performance degradation
- NFR21: Architecture supports horizontal scaling to 100,000+ concurrent users without re-architecture
- NFR22: Database supports 1 million+ product listings with sub-second query performance via indexing and caching
- NFR23: Image CDN handles 10,000+ concurrent image requests with edge caching
- NFR24: System handles 10x traffic spikes (flash sale scenarios) via auto-scaling infrastructure
- NFR25: Stateless API servers enable adding capacity by adding instances with no session affinity required
- NFR26: Redis caching layer absorbs 80%+ of read traffic for frequently accessed data (categories, trending products, search results)

### Reliability

- NFR27: Platform maintains 99.5%+ monthly uptime (max ~3.6 hours downtime/month)
- NFR28: Payment processing failures handled gracefully with retry logic and user notification — no silent order failures
- NFR29: Database backed up daily with point-in-time recovery capability within the last 7 days
- NFR30: Zero data loss for completed transactions — write-ahead logging and transaction durability guaranteed
- NFR31: Graceful degradation: if search service is down, buyers can still browse by category; if notification service is down, orders still process

### Accessibility

- NFR32: Web application meets WCAG 2.1 Level AA compliance for core buyer flows (browse, search, checkout)
- NFR33: All interactive elements keyboard-navigable with visible focus indicators
- NFR34: Product images include alt text; seller-uploaded images prompt for description
- NFR35: Color contrast ratios meet 4.5:1 minimum for text, 3:1 for large text and UI components
- NFR36: Mobile apps follow iOS and Android accessibility guidelines (VoiceOver, TalkBack support)

### Integration

- NFR37: Payment gateway integration supports synchronous transaction processing with webhook callbacks for async events
- NFR38: Push notification delivery achieves 95%+ delivery rate via FCM and APNs
- NFR39: Email delivery via transactional email service with 99%+ delivery rate and bounce handling
- NFR40: SMS OTP delivery completes within 30 seconds of user request
- NFR41: CDN cache invalidation propagates within 60 seconds when product images are updated
- NFR42: All third-party integrations implement circuit breaker patterns — service degradation rather than cascade failure
- NFR43: API versioning (v1, v2) ensures backward compatibility for mobile clients during app store review cycles
