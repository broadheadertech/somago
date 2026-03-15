import { mutation } from "./_generated/server";

const PRODUCT_IMAGES: Record<string, string[]> = {
  "Hand-Embroidered Filipiniana Blouse": [
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1558171813-01ed3d751c0e?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&h=400&fit=crop",
  ],
  "Handwoven Abaca Tote Bag": [
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
  ],
  "Beaded Statement Necklace": [
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1515562141589-67f0d727b750?w=400&h=400&fit=crop",
  ],
  "Cotton Pajama Set - Tropical Print": [
    "https://images.unsplash.com/photo-1616627577385-5c0c4dab3d23?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=400&fit=crop",
  ],
  "USB-C Fast Charging Cable (2m)": [
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&h=400&fit=crop",
  ],
  "Wireless Bluetooth Earbuds TWS-500": [
    "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&h=400&fit=crop",
  ],
  "Laptop Stand - Adjustable Aluminum": [
    "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
  ],
  "Phone Ring Light - 10 inch LED": [
    "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400&h=400&fit=crop",
  ],
  "Portable Bluetooth Speaker Waterproof": [
    "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1589003077984-894e133dabab?w=400&h=400&fit=crop",
  ],
  "Coconut Oil - Extra Virgin 500ml": [
    "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
  ],
  "Yoga Mat - Non-Slip 6mm": [
    "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",
    "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=400&h=400&fit=crop",
  ],
  "Rattan Desk Organizer": [
    "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=400&h=400&fit=crop",
  ],
};

export const addImages = mutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    let updated = 0;

    for (const product of products) {
      const urls = PRODUCT_IMAGES[product.name];
      if (urls) {
        await ctx.db.patch(product._id, {
          imageUrl: urls[0],
          imageUrls: urls,
        });
        updated++;
      }
    }

    return { updated, total: products.length };
  },
});
