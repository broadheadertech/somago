import { mutation } from "./_generated/server";

export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingProduct = await ctx.db.query("products").first();
    if (existingProduct) {
      throw new Error("Database already seeded! Clear data first if you want to re-seed.");
    }

    // ── 1. Create test users ──────────────────────────────────────
    const adminId = await ctx.db.insert("users", {
      clerkId: "seed_admin_001",
      email: "admin@somago.test",
      name: "Jay Admin",
      role: "admin",
      createdAt: Date.now(),
    });

    const sellerId = await ctx.db.insert("users", {
      clerkId: "seed_seller_001",
      email: "rina@somago.test",
      name: "Rina's Shop",
      role: "seller",
      sellerStatus: "approved",
      shopProfile: {
        shopName: "Rina's Handmade",
        description: "Handmade clothing and accessories from Cebu",
      },
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    });

    const seller2Id = await ctx.db.insert("users", {
      clerkId: "seed_seller_002",
      email: "techshop@somago.test",
      name: "TechZone PH",
      role: "seller",
      sellerStatus: "approved",
      shopProfile: {
        shopName: "TechZone PH",
        description: "Your trusted tech accessories shop in Metro Manila",
      },
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    });

    const buyerId = await ctx.db.insert("users", {
      clerkId: "seed_buyer_001",
      email: "maria@somago.test",
      name: "Maria Santos",
      role: "buyer",
      addresses: [
        {
          label: "Home",
          fullName: "Maria Santos",
          phone: "+639171234567",
          addressLine1: "123 Rizal Street",
          city: "Quezon City",
          province: "Metro Manila",
          postalCode: "1100",
          isDefault: true,
        },
      ],
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    });

    // ── 2. Create categories ──────────────────────────────────────
    const categories: Record<string, any> = {};

    const catData = [
      { name: "Electronics", icon: "📱", order: 1 },
      { name: "Fashion", icon: "👗", order: 2 },
      { name: "Home & Living", icon: "🏠", order: 3 },
      { name: "Health & Beauty", icon: "💄", order: 4 },
      { name: "Sports & Outdoors", icon: "⚽", order: 5 },
      { name: "Food & Beverages", icon: "🍔", order: 6 },
      { name: "Toys & Games", icon: "🎮", order: 7 },
      { name: "Automotive", icon: "🚗", order: 8 },
      { name: "Books & Stationery", icon: "📚", order: 9 },
      { name: "Pets", icon: "🐾", order: 10 },
    ];

    for (const cat of catData) {
      const id = await ctx.db.insert("categories", {
        name: cat.name,
        icon: cat.icon,
        order: cat.order,
      });
      categories[cat.name] = id;
    }

    const electronicsId = categories["Electronics"];
    const fashionId = categories["Fashion"];
    const homeId = categories["Home & Living"];
    const healthId = categories["Health & Beauty"];
    const sportsId = categories["Sports & Outdoors"];

    // Subcategories
    const subcats: Record<string, string[]> = {
      Electronics: ["Phones & Tablets", "Laptops & Computers", "Audio", "Cameras", "Accessories"],
      Fashion: ["Women's Clothing", "Men's Clothing", "Shoes", "Bags", "Accessories"],
      "Home & Living": ["Furniture", "Kitchen", "Decor", "Bedding", "Tools"],
      "Health & Beauty": ["Skincare", "Makeup", "Hair Care", "Supplements", "Personal Care"],
      "Sports & Outdoors": ["Exercise Equipment", "Sportswear", "Outdoor Gear", "Team Sports"],
    };

    for (const [parent, subs] of Object.entries(subcats)) {
      for (let i = 0; i < subs.length; i++) {
        await ctx.db.insert("categories", {
          name: subs[i],
          parentId: categories[parent],
          order: i + 1,
        });
      }
    }

    // ── 3. Create products ────────────────────────────────────────
    const products = [
      // Rina's products (Fashion)
      {
        sellerId,
        name: "Hand-Embroidered Filipiniana Blouse",
        description: "Beautiful hand-embroidered blouse made with traditional Filipino patterns. Perfect for formal events and cultural celebrations. Made from premium piña-jusi fabric.\n\nAvailable in sizes S, M, L, XL.\n\nCare: Hand wash only, do not bleach.",
        categoryId: fashionId,
        price: 1850,
        originalPrice: 2200,
        stock: 25,
        soldCount: 142,
        rating: 4.7,
        reviewCount: 38,
      },
      {
        sellerId,
        name: "Handwoven Abaca Tote Bag",
        description: "Eco-friendly tote bag handwoven from natural abaca fiber. Sturdy enough for everyday use, stylish enough for any occasion.\n\nDimensions: 35cm x 30cm x 12cm\nWeight: 200g",
        categoryId: fashionId,
        price: 650,
        stock: 40,
        soldCount: 89,
        rating: 4.5,
        reviewCount: 22,
      },
      {
        sellerId,
        name: "Beaded Statement Necklace",
        description: "Handcrafted beaded necklace featuring semi-precious stones and freshwater pearls. Each piece is unique.\n\nLength: 45cm with 5cm extender chain",
        categoryId: fashionId,
        price: 480,
        originalPrice: 580,
        stock: 15,
        soldCount: 67,
        rating: 4.8,
        reviewCount: 19,
      },
      {
        sellerId,
        name: "Cotton Pajama Set - Tropical Print",
        description: "Soft 100% cotton pajama set with fun tropical print. Comfortable for lounging and sleeping.\n\nSet includes: Top + Bottom\nMaterial: 100% Cotton\nSizes available: S, M, L",
        categoryId: fashionId,
        price: 550,
        stock: 60,
        soldCount: 203,
        rating: 4.6,
        reviewCount: 51,
      },

      // TechZone products (Electronics)
      {
        sellerId: seller2Id,
        name: "USB-C Fast Charging Cable (2m)",
        description: "Premium braided USB-C cable with fast charging support up to 65W. Compatible with all USB-C devices including phones, tablets, and laptops.\n\n- Length: 2 meters\n- Material: Nylon braided\n- Supports data transfer up to 480Mbps\n- 10,000+ bend lifespan",
        categoryId: electronicsId,
        price: 299,
        originalPrice: 450,
        stock: 200,
        soldCount: 1523,
        rating: 4.4,
        reviewCount: 342,
      },
      {
        sellerId: seller2Id,
        name: "Wireless Bluetooth Earbuds TWS-500",
        description: "True wireless stereo earbuds with active noise cancellation. 30-hour total battery life with charging case.\n\n- Bluetooth 5.3\n- ANC (Active Noise Cancellation)\n- IPX5 water resistant\n- Touch controls\n- Built-in microphone",
        categoryId: electronicsId,
        price: 1299,
        originalPrice: 1899,
        stock: 45,
        soldCount: 567,
        rating: 4.3,
        reviewCount: 128,
      },
      {
        sellerId: seller2Id,
        name: "Laptop Stand - Adjustable Aluminum",
        description: "Ergonomic aluminum laptop stand with adjustable height and angle. Keeps your laptop cool and improves posture.\n\n- Compatible with 10-17 inch laptops\n- 6 adjustable angles\n- Foldable and portable\n- Non-slip silicone pads",
        categoryId: electronicsId,
        price: 899,
        stock: 30,
        soldCount: 234,
        rating: 4.6,
        reviewCount: 67,
      },
      {
        sellerId: seller2Id,
        name: "Phone Ring Light - 10 inch LED",
        description: "Professional 10-inch ring light with phone holder and tripod. Perfect for vloggers, online sellers, and video calls.\n\n- 3 light modes (warm, cool, natural)\n- 10 brightness levels\n- 160cm adjustable tripod\n- USB powered",
        categoryId: electronicsId,
        price: 599,
        originalPrice: 799,
        stock: 50,
        soldCount: 445,
        rating: 4.2,
        reviewCount: 93,
      },
      {
        sellerId: seller2Id,
        name: "Portable Bluetooth Speaker Waterproof",
        description: "Compact waterproof Bluetooth speaker with powerful bass. Take it to the beach, pool, or shower.\n\n- IPX7 waterproof\n- 12-hour battery life\n- Bluetooth 5.0\n- Built-in microphone for calls\n- Carabiner clip included",
        categoryId: electronicsId,
        price: 749,
        stock: 35,
        soldCount: 312,
        rating: 4.5,
        reviewCount: 78,
      },

      // More categories
      {
        sellerId,
        name: "Coconut Oil - Extra Virgin 500ml",
        description: "Cold-pressed extra virgin coconut oil from fresh Quezon province coconuts. Perfect for cooking, skincare, and hair care.\n\n- 100% pure, no additives\n- Cold-pressed extraction\n- Glass bottle packaging",
        categoryId: healthId,
        price: 250,
        stock: 100,
        soldCount: 890,
        rating: 4.9,
        reviewCount: 156,
      },
      {
        sellerId: seller2Id,
        name: "Yoga Mat - Non-Slip 6mm",
        description: "Premium non-slip yoga mat made from eco-friendly TPE material. Perfect for yoga, pilates, and home workouts.\n\n- Dimensions: 183cm x 61cm x 6mm\n- Material: TPE (eco-friendly)\n- Double-sided non-slip texture\n- Includes carrying strap",
        categoryId: sportsId,
        price: 899,
        originalPrice: 1200,
        stock: 40,
        soldCount: 178,
        rating: 4.7,
        reviewCount: 45,
      },
      {
        sellerId,
        name: "Rattan Desk Organizer",
        description: "Handwoven rattan desk organizer with multiple compartments. Keep your workspace tidy in style.\n\n- 4 compartments\n- Dimensions: 25cm x 15cm x 12cm\n- Handmade from natural rattan",
        categoryId: homeId,
        price: 380,
        stock: 20,
        soldCount: 56,
        rating: 4.4,
        reviewCount: 14,
      },
    ];

    const productIds = [];
    for (const product of products) {
      const id = await ctx.db.insert("products", {
        ...product,
        images: [],
        variants: undefined,
        status: "active",
        createdAt: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
      });
      productIds.push(id);
    }

    // ── 4. Create sample reviews ──────────────────────────────────
    const reviewTexts = [
      "Great quality! Exactly as described. Will buy again.",
      "Super fast delivery. Love it!",
      "Good value for money. Recommended!",
      "Perfect fit for my laptop. Very sturdy.",
      "The seller was very responsive. Product is amazing!",
      "Arrived earlier than expected. Quality is top-notch.",
      "Beautiful craftsmanship. My friends are jealous!",
    ];

    // Add 2-3 reviews per product
    for (let i = 0; i < Math.min(productIds.length, 7); i++) {
      // Create a fake order for the review
      const orderId = await ctx.db.insert("orders", {
        buyerId,
        sellerId: i < 4 ? sellerId : seller2Id,
        items: [{
          productId: productIds[i],
          productName: products[i].name,
          quantity: 1,
          unitPrice: products[i].price,
        }],
        totalAmount: products[i].price,
        shippingAddress: {
          fullName: "Maria Santos",
          phone: "+639171234567",
          addressLine1: "123 Rizal Street",
          city: "Quezon City",
          province: "Metro Manila",
          postalCode: "1100",
        },
        paymentMethod: "cod",
        paymentStatus: "paid",
        orderStatus: "delivered",
        createdAt: Date.now() - (20 - i) * 24 * 60 * 60 * 1000,
      });

      await ctx.db.insert("reviews", {
        buyerId,
        productId: productIds[i],
        orderId,
        rating: 4 + Math.round(Math.random()),
        text: reviewTexts[i],
        isVerified: true,
        createdAt: Date.now() - (15 - i) * 24 * 60 * 60 * 1000,
      });
    }

    // ── 5. Create sample active orders ────────────────────────────
    const activeOrder1 = await ctx.db.insert("orders", {
      buyerId,
      sellerId,
      items: [
        {
          productId: productIds[0],
          productName: products[0].name,
          quantity: 1,
          unitPrice: products[0].price,
        },
        {
          productId: productIds[1],
          productName: products[1].name,
          quantity: 2,
          unitPrice: products[1].price,
        },
      ],
      totalAmount: products[0].price + products[1].price * 2,
      shippingAddress: {
        fullName: "Maria Santos",
        phone: "+639171234567",
        addressLine1: "123 Rizal Street",
        city: "Quezon City",
        province: "Metro Manila",
        postalCode: "1100",
      },
      paymentMethod: "gcash",
      paymentStatus: "paid",
      orderStatus: "shipped",
      trackingNumber: "JT2026031500123",
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    });

    const activeOrder2 = await ctx.db.insert("orders", {
      buyerId,
      sellerId: seller2Id,
      items: [
        {
          productId: productIds[4],
          productName: products[4].name,
          quantity: 3,
          unitPrice: products[4].price,
        },
      ],
      totalAmount: products[4].price * 3,
      shippingAddress: {
        fullName: "Maria Santos",
        phone: "+639171234567",
        addressLine1: "123 Rizal Street",
        city: "Quezon City",
        province: "Metro Manila",
        postalCode: "1100",
      },
      paymentMethod: "cod",
      paymentStatus: "pending",
      orderStatus: "confirmed",
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    });

    // ── 6. Create sample notifications ────────────────────────────
    await ctx.db.insert("notifications", {
      userId: buyerId,
      type: "order_update",
      title: "Order Shipped!",
      body: "Your order has been shipped! Tracking: JT2026031500123",
      data: { orderId: activeOrder1 },
      isRead: false,
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("notifications", {
      userId: sellerId,
      type: "new_order",
      title: "New Order!",
      body: `You received a new order for ₱${(products[0].price + products[1].price * 2).toLocaleString()}`,
      data: { orderId: activeOrder1 },
      isRead: false,
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    });

    await ctx.db.insert("notifications", {
      userId: seller2Id,
      type: "new_order",
      title: "New Order!",
      body: `You received a new order for ₱${(products[4].price * 3).toLocaleString()}`,
      data: { orderId: activeOrder2 },
      isRead: false,
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    });

    return {
      message: "Seed complete!",
      created: {
        users: 4,
        categories: Object.keys(categories).length + Object.values(subcats).flat().length,
        products: products.length,
        orders: 7 + 2,
        reviews: 7,
        notifications: 3,
      },
    };
  },
});
