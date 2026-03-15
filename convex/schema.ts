import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("buyer"), v.literal("seller"), v.literal("admin")),
    avatar: v.optional(v.string()),
    phone: v.optional(v.string()),
    addresses: v.optional(
      v.array(
        v.object({
          label: v.string(),
          fullName: v.string(),
          phone: v.string(),
          addressLine1: v.string(),
          addressLine2: v.optional(v.string()),
          city: v.string(),
          province: v.string(),
          postalCode: v.string(),
          isDefault: v.boolean(),
        })
      )
    ),
    shopProfile: v.optional(
      v.object({
        shopName: v.string(),
        description: v.optional(v.string()),
        logo: v.optional(v.id("_storage")),
        logoUrl: v.optional(v.string()),
        bannerUrl: v.optional(v.string()),
        shippingPolicy: v.optional(v.string()),
      })
    ),
    // Mall & Subscription
    mallStatus: v.optional(
      v.union(
        v.literal("none"),
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
    subscriptionPlan: v.optional(
      v.union(
        v.literal("free"),
        v.literal("premium"),
        v.literal("enterprise")
      )
    ),
    subscriptionExpiresAt: v.optional(v.number()),
    commissionRate: v.optional(v.number()),
    sellerStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("suspended")
      )
    ),
    sellerIdDocument: v.optional(v.id("_storage")),
    businessDetails: v.optional(
      v.object({
        businessName: v.optional(v.string()),
        businessType: v.optional(v.string()),
      })
    ),
    coins: v.optional(v.number()),
    strikeCount: v.optional(v.number()),
    balance: v.optional(v.number()),
    referralCode: v.optional(v.string()),
    loyaltyPoints: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),
    chatAutoReply: v.optional(v.object({ enabled: v.boolean(), message: v.string() })),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_sellerStatus", ["sellerStatus"])
    .index("by_referralCode", ["referralCode"]),

  categories: defineTable({
    name: v.string(),
    parentId: v.optional(v.id("categories")),
    icon: v.optional(v.string()),
    order: v.number(),
  }).index("by_parentId", ["parentId"]),

  products: defineTable({
    sellerId: v.id("users"),
    name: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    variants: v.optional(
      v.array(
        v.object({
          name: v.string(),
          options: v.array(
            v.object({
              label: v.string(),
              price: v.optional(v.number()),
              stock: v.number(),
            })
          ),
        })
      )
    ),
    images: v.array(v.id("_storage")),
    imageUrl: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    stock: v.number(),
    soldCount: v.number(),
    rating: v.number(),
    reviewCount: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("active"),
      v.literal("flagged"),
      v.literal("removed")
    ),
    createdAt: v.number(),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .searchIndex("search_products", {
      searchField: "name",
      filterFields: ["categoryId", "status"],
    }),

  orders: defineTable({
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        productImage: v.optional(v.id("_storage")),
        variantLabel: v.optional(v.string()),
        quantity: v.number(),
        unitPrice: v.number(),
      })
    ),
    totalAmount: v.number(),
    shippingFee: v.optional(v.number()),
    voucherDiscount: v.optional(v.number()),
    voucherCode: v.optional(v.string()),
    finalTotal: v.optional(v.number()),
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      province: v.string(),
      postalCode: v.string(),
    }),
    paymentMethod: v.union(
      v.literal("cod"),
      v.literal("gcash"),
      v.literal("maya"),
      v.literal("card"),
      v.literal("balance")
    ),
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    orderStatus: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("packed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    tax: v.optional(v.number()),
    trackingNumber: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_orderStatus", ["orderStatus"])
    .index("by_createdAt", ["createdAt"]),

  wishlist: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_productId", ["userId", "productId"]),

  cart: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    variantIndex: v.optional(v.number()),
    quantity: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_productId", ["userId", "productId"]),

  reviews: defineTable({
    buyerId: v.id("users"),
    productId: v.id("products"),
    orderId: v.id("orders"),
    rating: v.number(),
    text: v.optional(v.string()),
    photos: v.optional(v.array(v.id("_storage"))),
    videoUrl: v.optional(v.string()),
    isVerified: v.boolean(),
    isFlagged: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_productId", ["productId"])
    .index("by_buyerId", ["buyerId"])
    .index("by_orderId", ["orderId"]),

  disputes: defineTable({
    orderId: v.id("orders"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    issueType: v.union(
      v.literal("damaged"),
      v.literal("wrong_item"),
      v.literal("not_received")
    ),
    description: v.optional(v.string()),
    evidence: v.optional(v.array(v.id("_storage"))),
    status: v.union(
      v.literal("open"),
      v.literal("seller_responded"),
      v.literal("escalated"),
      v.literal("resolved"),
      v.literal("rejected")
    ),
    sellerResponse: v.optional(
      v.object({
        type: v.union(v.literal("replace"), v.literal("refund")),
        message: v.optional(v.string()),
      })
    ),
    resolution: v.optional(
      v.object({
        type: v.union(v.literal("refund"), v.literal("replacement"), v.literal("rejected")),
        amount: v.optional(v.number()),
        reason: v.optional(v.string()),
        resolvedBy: v.optional(v.id("users")),
      })
    ),
    escalatedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("order_update"),
      v.literal("new_order"),
      v.literal("dispute_update"),
      v.literal("promotion"),
      v.literal("seller_approved"),
      v.literal("system")
    ),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  auditLog: defineTable({
    adminId: v.id("users"),
    action: v.string(),
    targetType: v.union(
      v.literal("user"),
      v.literal("product"),
      v.literal("order"),
      v.literal("dispute"),
      v.literal("review")
    ),
    targetId: v.string(),
    details: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_adminId", ["adminId"])
    .index("by_targetType", ["targetType"])
    .index("by_createdAt", ["createdAt"]),

  vouchers: defineTable({
    code: v.string(),
    type: v.union(v.literal("fixed"), v.literal("percentage")),
    value: v.number(), // amount in pesos or percentage (1-100)
    minOrderAmount: v.optional(v.number()),
    maxDiscount: v.optional(v.number()), // cap for percentage vouchers
    usageLimit: v.optional(v.number()), // total times voucher can be used
    usedCount: v.number(),
    sellerId: v.optional(v.id("users")), // null = platform-wide, set = seller-specific
    isActive: v.boolean(),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_sellerId", ["sellerId"])
    .index("by_isActive", ["isActive"]),

  voucherUsage: defineTable({
    voucherId: v.id("vouchers"),
    userId: v.id("users"),
    orderId: v.id("orders"),
    discount: v.number(),
    createdAt: v.number(),
  })
    .index("by_voucherId", ["voucherId"])
    .index("by_userId", ["userId"]),

  flashSales: defineTable({
    productId: v.id("products"),
    salePrice: v.number(),
    originalPrice: v.number(),
    startAt: v.number(),
    endAt: v.number(),
    stockLimit: v.optional(v.number()),
    soldCount: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_isActive", ["isActive"])
    .index("by_productId", ["productId"]),

  conversations: defineTable({
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    productId: v.optional(v.id("products")),
    lastMessageAt: v.number(),
    lastMessagePreview: v.string(),
    createdAt: v.number(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_participants", ["buyerId", "sellerId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    text: v.string(),
    imageId: v.optional(v.id("_storage")),
    isAutoReply: v.optional(v.boolean()),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_conversationId", ["conversationId"]),

  follows: defineTable({
    followerId: v.id("users"),
    sellerId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_followerId", ["followerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_pair", ["followerId", "sellerId"]),

  priceAlerts: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    targetPrice: v.number(),
    originalPrice: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_productId", ["productId"]),

  productQuestions: defineTable({
    productId: v.id("products"),
    askerId: v.id("users"),
    question: v.string(),
    answer: v.optional(v.string()),
    answeredBy: v.optional(v.id("users")),
    answeredAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_productId", ["productId"]),

  paymentIntents: defineTable({
    orderId: v.id("orders"),
    provider: v.union(v.literal("stripe"), v.literal("paymongo")),
    externalId: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_externalId", ["externalId"]),

  referrals: defineTable({
    referrerId: v.id("users"),
    referredId: v.id("users"),
    referralCode: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed")),
    rewardGiven: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_referrerId", ["referrerId"])
    .index("by_referredId", ["referredId"])
    .index("by_referralCode", ["referralCode"]),

  pointTransactions: defineTable({
    userId: v.id("users"),
    points: v.number(),
    type: v.union(v.literal("earned"), v.literal("redeemed"), v.literal("expired")),
    description: v.string(),
    orderId: v.optional(v.id("orders")),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  promotedListings: defineTable({
    sellerId: v.id("users"),
    productId: v.id("products"),
    budget: v.number(),
    spent: v.number(),
    costPerClick: v.number(),
    clicks: v.number(),
    impressions: v.number(),
    isActive: v.boolean(),
    startAt: v.number(),
    endAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_productId", ["productId"])
    .index("by_isActive", ["isActive"]),

  shipments: defineTable({
    orderId: v.id("orders"),
    carrier: v.union(v.literal("jt_express"), v.literal("lbc"), v.literal("grab_express"), v.literal("manual")),
    trackingNumber: v.string(),
    status: v.union(v.literal("created"), v.literal("picked_up"), v.literal("in_transit"), v.literal("out_for_delivery"), v.literal("delivered"), v.literal("failed")),
    estimatedDelivery: v.optional(v.number()),
    events: v.array(v.object({
      status: v.string(),
      location: v.optional(v.string()),
      timestamp: v.number(),
    })),
    createdAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_trackingNumber", ["trackingNumber"]),

  returns: defineTable({
    orderId: v.id("orders"),
    buyerId: v.id("users"),
    sellerId: v.id("users"),
    reason: v.string(),
    status: v.union(v.literal("requested"), v.literal("approved"), v.literal("shipped_back"), v.literal("received"), v.literal("refunded"), v.literal("rejected")),
    returnTrackingNumber: v.optional(v.string()),
    refundAmount: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"]),

  payouts: defineTable({
    sellerId: v.id("users"),
    amount: v.number(),
    commission: v.number(),
    netAmount: v.number(),
    status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
    periodStart: v.number(),
    periodEnd: v.number(),
    ordersIncluded: v.number(),
    createdAt: v.number(),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"]),

  fraudFlags: defineTable({
    targetType: v.union(v.literal("user"), v.literal("order"), v.literal("review"), v.literal("product")),
    targetId: v.string(),
    reason: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"), v.literal("dismissed")),
    detectedBy: v.union(v.literal("system"), v.literal("admin"), v.literal("user_report")),
    resolvedBy: v.optional(v.id("users")),
    resolvedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_targetType", ["targetType"])
    .index("by_severity", ["severity"]),

  supportTickets: defineTable({
    userId: v.id("users"),
    subject: v.string(),
    category: v.union(v.literal("order"), v.literal("payment"), v.literal("account"), v.literal("product"), v.literal("other")),
    status: v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    orderId: v.optional(v.id("orders")),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  ticketMessages: defineTable({
    ticketId: v.id("supportTickets"),
    senderId: v.id("users"),
    message: v.string(),
    isStaff: v.boolean(),
    createdAt: v.number(),
  }).index("by_ticketId", ["ticketId"]),

  rateLimits: defineTable({
    userId: v.id("users"),
    action: v.string(),
    count: v.number(),
    windowStart: v.number(),
  })
    .index("by_userId_action", ["userId", "action"]),

  posts: defineTable({
    userId: v.id("users"),
    productId: v.optional(v.id("products")),
    text: v.string(),
    imageUrl: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    likeCount: v.number(),
    commentCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_createdAt", ["createdAt"]),

  postLikes: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_postId", ["postId"])
    .index("by_userId_postId", ["userId", "postId"]),

  postComments: defineTable({
    postId: v.id("posts"),
    userId: v.id("users"),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_postId", ["postId"]),

  siteContent: defineTable({
    key: v.string(),
    type: v.union(v.literal("banner"), v.literal("announcement"), v.literal("section")),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_type", ["type"]),

  liveRooms: defineTable({
    sellerId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    featuredProducts: v.array(v.id("products")),
    status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("ended")),
    viewerCount: v.number(),
    scheduledAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"]),

  liveMessages: defineTable({
    roomId: v.id("liveRooms"),
    userId: v.id("users"),
    text: v.string(),
    type: v.union(v.literal("chat"), v.literal("purchase"), v.literal("system")),
    createdAt: v.number(),
  }).index("by_roomId", ["roomId"]),

  dailyCheckIns: defineTable({
    userId: v.id("users"),
    date: v.string(),
    coinsEarned: v.number(),
    streak: v.number(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),

  spinHistory: defineTable({
    userId: v.id("users"),
    prize: v.string(),
    prizeType: v.union(v.literal("coins"), v.literal("voucher"), v.literal("points"), v.literal("nothing")),
    prizeValue: v.number(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // ── Seller Subscription Payments ─────────────────────────
  subscriptionPayments: defineTable({
    sellerId: v.id("users"),
    plan: v.union(v.literal("premium"), v.literal("enterprise")),
    amount: v.number(),
    currency: v.string(),
    status: v.union(v.literal("active"), v.literal("expired"), v.literal("cancelled")),
    startsAt: v.number(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"]),

  // ── Mall Applications ────────────────────────────────────
  mallApplications: defineTable({
    sellerId: v.id("users"),
    brandName: v.string(),
    brandDescription: v.string(),
    businessRegistration: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    adminNotes: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_status", ["status"]),

  // ── API Keys ─────────────────────────────────────────────
  apiKeys: defineTable({
    sellerId: v.id("users"),
    name: v.string(),
    keyHash: v.string(),
    keyPrefix: v.string(),
    permissions: v.array(v.string()),
    lastUsedAt: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_sellerId", ["sellerId"])
    .index("by_keyHash", ["keyHash"]),
});
