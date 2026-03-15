---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-03-15
author: deliveryboy
---

# Product Brief: Somago

## Executive Summary

Somago is a full-stack e-commerce marketplace platform modeled after Shopee, designed to connect buyers and sellers in a seamless, scalable digital marketplace. The platform targets the Southeast Asian market, offering a web application and mobile app with comprehensive buyer, seller, and admin capabilities. Somago aims to deliver a modern, reliable e-commerce experience with support for multiple payment methods, real-time notifications, and a microservices-friendly architecture built for scale.

---

## Core Vision

### Problem Statement

Small and medium businesses in Southeast Asia still face barriers to reaching online customers — existing marketplace platforms can be expensive, overly complex for new sellers, or lack localized features for specific markets. Buyers, meanwhile, desire a fast, trustworthy, and feature-rich shopping experience with reliable delivery tracking and multiple payment options.

### Problem Impact

- Sellers lose potential revenue due to limited online reach and high platform fees
- Buyers face fragmented shopping experiences, unreliable order tracking, and limited payment flexibility
- The growing digital economy in SEA demands more marketplace options to foster healthy competition

### Why Existing Solutions Fall Short

While platforms like Shopee, Lazada, and Tokopedia dominate, they are closed ecosystems. For developers and entrepreneurs, there is no readily available, modern, open-source-friendly e-commerce marketplace platform that can be customized, self-hosted, or used as a foundation for a localized marketplace. Somago fills this gap as a buildable, extensible platform.

### Proposed Solution

A Shopee-style marketplace platform featuring:
- **Buyers:** Product browsing, search, cart, wishlist, checkout, order tracking, reviews, and push notifications
- **Sellers:** Dashboard, product/inventory management, order management, and sales analytics
- **Admin:** Platform-wide dashboard, user/seller management, product moderation, and analytics
- **Technical:** Microservices-ready architecture, secure auth and payments, caching, CDN, and real-time notifications

### Key Differentiators

- **Buildable & Extensible:** Designed as a modern, modular codebase that can be customized for specific markets or niches
- **Full-Stack Reference Architecture:** Serves as both a production-ready platform and a comprehensive reference for large-scale e-commerce systems
- **Modern Tech Stack:** Built with current best practices — containerized, cloud-native, and API-first
- **MVP-First Approach:** Phased delivery from MVP to production-ready, enabling iterative learning and market validation

## Target Users

### Primary Users

#### Persona 1: Maria — The Mobile-First Shopper
- **Profile:** 22-year-old college student / young professional in Metro Manila
- **Context:** Shops primarily on mobile during commute and breaks; price-conscious, loves flash deals and free shipping
- **Motivation:** Find affordable products quickly, compare prices, and get reliable delivery
- **Pain Points:** Unreliable sellers, slow delivery, complicated checkout, limited payment options (prefers e-wallets and COD)
- **Success Vision:** A fast, trustworthy shopping experience with easy checkout, real-time order tracking, and great deals

#### Persona 2: Rina — The Small Business Seller
- **Profile:** 34-year-old entrepreneur running a small clothing business from home in Cebu
- **Context:** Manages inventory manually, fulfills orders via local couriers, active on social media for marketing
- **Motivation:** Reach more customers beyond her local area, grow sales, and streamline order management
- **Pain Points:** High commission fees on existing platforms, complex listing processes, lack of clear sales analytics
- **Success Vision:** An intuitive seller dashboard where she can list products easily, track orders, and see which products sell best

### Secondary Users

#### Persona 3: Jay — The Platform Administrator
- **Profile:** 28-year-old operations team member responsible for marketplace health
- **Context:** Monitors platform activity, reviews flagged products, manages seller applications and disputes
- **Motivation:** Keep the marketplace safe, trustworthy, and running smoothly
- **Pain Points:** Manual moderation processes, lack of real-time analytics, difficulty spotting fraudulent listings
- **Success Vision:** A comprehensive admin dashboard with real-time metrics, automated flagging, and efficient user/seller management tools

### User Journey

#### Buyer Journey (Maria)
1. **Discovery:** Finds Somago through app store or social media ads
2. **Onboarding:** Signs up with phone number, browses trending products and categories
3. **Core Usage:** Searches for products, adds to cart, applies vouchers, checks out via e-wallet or COD
4. **Success Moment:** Receives order on time, leaves a review, earns loyalty points
5. **Long-term:** Returns regularly for flash sales, builds a wishlist, follows favorite sellers

#### Seller Journey (Rina)
1. **Discovery:** Hears about Somago from fellow sellers or online ads
2. **Onboarding:** Registers as seller, sets up shop profile, lists first products with photos and descriptions
3. **Core Usage:** Manages daily orders, updates inventory, runs promotions, checks sales dashboard
4. **Success Moment:** Sees first sales spike after a flash sale campaign
5. **Long-term:** Grows product catalog, uses analytics to optimize pricing, expands to new categories

## Success Metrics

### User Success Metrics

**Buyer Success:**
- Buyers can find and purchase a product in under 5 minutes (search-to-checkout)
- Order delivery tracking is accurate and updated in real-time
- 80%+ of buyers rate their shopping experience 4+ stars
- Cart abandonment rate below 30%

**Seller Success:**
- Sellers can list a new product in under 3 minutes
- Orders are fulfilled and shipped within 24 hours of placement
- Sellers see sales analytics that help them optimize pricing and inventory
- 70%+ of sellers remain active after 3 months

### Business Objectives

**3-Month (MVP Launch):**
- Platform functional with core buyer and seller flows
- 100+ registered sellers with active product listings
- 1,000+ registered buyers
- Successful end-to-end transactions processed

**12-Month (Growth Phase):**
- 10,000+ monthly active buyers
- 1,000+ active sellers
- 95%+ platform uptime
- Revenue generated through seller commission fees (5-10% per transaction)

**Revenue Model:**
- Seller commission per successful transaction (5-10%)
- Featured listing / promoted products (future)
- Platform ads (future)

### Key Performance Indicators

| KPI | Target | Measurement |
|-----|--------|-------------|
| Monthly Active Users (MAU) | 10K+ by month 12 | Analytics dashboard |
| Gross Merchandise Value (GMV) | Growing 20% MoM | Transaction totals |
| Conversion Rate | 3-5% | Visitors to purchasers |
| Average Order Value (AOV) | Trending upward | Revenue / orders |
| Seller Retention (90-day) | 70%+ | Active sellers / total |
| Buyer Retention (30-day) | 40%+ | Returning buyers |
| Order Fulfillment Rate | 95%+ | Fulfilled / total orders |
| Platform Uptime | 99.5%+ | Infrastructure monitoring |
| App Store Rating | 4.0+ stars | App store reviews |
| Customer Support Resolution | < 24 hours | Support ticket tracking |

## MVP Scope

### Core Features

**Buyer Features (Web + Mobile):**
- User registration/login (email, phone, social auth)
- User profile and address management
- Product browsing with categories and subcategories
- Product search with filters (price, rating, category, location)
- Product detail pages with images, descriptions, variants
- Product reviews and ratings
- Shopping cart with quantity management
- Wishlist / saved items
- Checkout flow with order summary
- Multiple payment methods (credit/debit cards, e-wallets, COD)
- Order tracking with real-time status updates
- Push notifications (order updates, promotions)
- Order history and reorder

**Seller Features (Web + Mobile):**
- Seller registration and verification
- Seller dashboard with overview metrics
- Product listing creation (photos, descriptions, pricing, variants, stock)
- Inventory management with stock tracking
- Order management (view, confirm, ship, complete)
- Sales analytics and reports (revenue, top products, order trends)
- Shop profile customization

**Admin Features (Web):**
- Admin dashboard with platform-wide metrics
- User management (view, suspend, ban buyers/sellers)
- Seller application review and approval
- Product moderation (flagged items, content review)
- Order monitoring and dispute management
- Platform analytics (GMV, active users, transaction volume)

**Technical MVP:**
- Microservices-ready architecture (modular monolith to start, split later)
- JWT-based authentication with role-based access control
- RESTful API layer
- Image upload and CDN delivery
- Real-time notifications (WebSocket / push)
- Payment gateway integration
- Database with optimized queries and indexing
- Redis caching for frequently accessed data
- Responsive web app + native mobile apps (iOS & Android)

### Out of Scope for MVP

- Live chat between buyer and seller
- Flash sales / time-limited deals engine
- Voucher and coupon system
- Affiliate / referral program
- Seller ads and promoted listings
- Multi-language / multi-currency support
- AI-powered product recommendations
- Logistics / shipping partner integration (manual tracking for MVP)
- In-app wallet / Somago Pay
- Gamification (coins, rewards, daily check-in)
- Seller tiers and premium plans

### MVP Success Criteria

- All three user roles (buyer, seller, admin) can complete their core flows end-to-end
- A buyer can discover, purchase, and track an order successfully
- A seller can list products, receive orders, and fulfill them
- An admin can monitor platform activity and moderate content
- Payment processing works for at least 2 methods (e-wallet + COD)
- Platform handles 1,000+ concurrent users without degradation
- Mobile apps published to App Store and Google Play
- 99%+ uptime during first month of launch

### Future Vision

**Phase 2 — Growth (Months 4-8):**
- Live chat / messaging between buyers and sellers
- Voucher and coupon system
- Flash sales and daily deals engine
- Shipping partner API integration (J&T, LBC, Grab Express)
- In-app wallet (Somago Pay)
- Product recommendations based on browsing history

**Phase 3 — Scale (Months 9-14):**
- AI-powered search and recommendations
- Seller advertising platform (promoted listings)
- Multi-language and multi-currency support
- Affiliate and referral program
- Gamification (coins, rewards, loyalty program)
- Advanced analytics and seller insights

**Phase 4 — Ecosystem (12+ Months):**
- Somago Mall (verified brand stores)
- Somago Express (integrated logistics)
- API marketplace for third-party integrations
- Seller financing and business tools
- Social commerce features (live selling, feed)
