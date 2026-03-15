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
        shippingPolicy: v.optional(v.string()),
      })
    ),
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
    strikeCount: v.optional(v.number()),
    balance: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"])
    .index("by_sellerStatus", ["sellerStatus"]),

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
      v.literal("card")
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
    trackingNumber: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_buyerId", ["buyerId"])
    .index("by_sellerId", ["sellerId"])
    .index("by_orderStatus", ["orderStatus"])
    .index("by_createdAt", ["createdAt"]),

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
});
