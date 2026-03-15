// Shipping fee calculator for Philippine logistics
// Based on typical J&T / LBC / Flash Express rates

export type ShippingZone = "metro_manila" | "luzon" | "visayas" | "mindanao";

const ZONE_BASE_RATES: Record<ShippingZone, number> = {
  metro_manila: 50,
  luzon: 80,
  visayas: 100,
  mindanao: 120,
};

const PER_KG_RATE: Record<ShippingZone, number> = {
  metro_manila: 15,
  luzon: 20,
  visayas: 30,
  mindanao: 35,
};

const FREE_SHIPPING_THRESHOLD = 999; // Free shipping for orders above ₱999

// Province to zone mapping
const PROVINCE_ZONES: Record<string, ShippingZone> = {
  // Metro Manila
  "metro manila": "metro_manila",
  "ncr": "metro_manila",
  "manila": "metro_manila",
  "quezon city": "metro_manila",
  "makati": "metro_manila",
  "pasig": "metro_manila",
  "taguig": "metro_manila",
  "mandaluyong": "metro_manila",
  "pasay": "metro_manila",
  "paranaque": "metro_manila",
  "muntinlupa": "metro_manila",
  "las pinas": "metro_manila",
  "marikina": "metro_manila",
  "caloocan": "metro_manila",
  "valenzuela": "metro_manila",
  "malabon": "metro_manila",
  "navotas": "metro_manila",
  "san juan": "metro_manila",
  "pateros": "metro_manila",
  // Luzon
  "bulacan": "luzon",
  "pampanga": "luzon",
  "cavite": "luzon",
  "laguna": "luzon",
  "batangas": "luzon",
  "rizal": "luzon",
  "nueva ecija": "luzon",
  "pangasinan": "luzon",
  "zambales": "luzon",
  "tarlac": "luzon",
  "benguet": "luzon",
  "ilocos norte": "luzon",
  "ilocos sur": "luzon",
  "la union": "luzon",
  "cagayan": "luzon",
  "isabela": "luzon",
  "bataan": "luzon",
  "aurora": "luzon",
  "quezon": "luzon",
  "camarines sur": "luzon",
  "camarines norte": "luzon",
  "albay": "luzon",
  "sorsogon": "luzon",
  // Visayas
  "cebu": "visayas",
  "iloilo": "visayas",
  "negros occidental": "visayas",
  "negros oriental": "visayas",
  "bohol": "visayas",
  "leyte": "visayas",
  "samar": "visayas",
  "eastern samar": "visayas",
  "aklan": "visayas",
  "antique": "visayas",
  "capiz": "visayas",
  "guimaras": "visayas",
  "biliran": "visayas",
  "southern leyte": "visayas",
  "siquijor": "visayas",
  // Mindanao
  "davao del sur": "mindanao",
  "davao del norte": "mindanao",
  "davao": "mindanao",
  "misamis oriental": "mindanao",
  "misamis occidental": "mindanao",
  "bukidnon": "mindanao",
  "zamboanga del sur": "mindanao",
  "zamboanga del norte": "mindanao",
  "south cotabato": "mindanao",
  "north cotabato": "mindanao",
  "sultan kudarat": "mindanao",
  "lanao del norte": "mindanao",
  "lanao del sur": "mindanao",
  "agusan del norte": "mindanao",
  "agusan del sur": "mindanao",
  "surigao del norte": "mindanao",
  "surigao del sur": "mindanao",
  "maguindanao": "mindanao",
  "basilan": "mindanao",
  "sulu": "mindanao",
  "tawi-tawi": "mindanao",
  "compostela valley": "mindanao",
  "sarangani": "mindanao",
  "general santos": "mindanao",
  "cagayan de oro": "mindanao",
};

export function getZoneFromProvince(province: string): ShippingZone {
  const normalized = province.toLowerCase().trim();
  return PROVINCE_ZONES[normalized] ?? "luzon"; // Default to luzon
}

export function calculateShippingFee(
  province: string,
  orderAmount: number,
  itemCount: number = 1
): { fee: number; zone: ShippingZone; isFreeShipping: boolean; estimatedDays: string } {
  const zone = getZoneFromProvince(province);

  // Free shipping for large orders
  if (orderAmount >= FREE_SHIPPING_THRESHOLD) {
    return {
      fee: 0,
      zone,
      isFreeShipping: true,
      estimatedDays: zone === "metro_manila" ? "1-2" : zone === "luzon" ? "2-4" : "3-5",
    };
  }

  // Base rate + per-item surcharge (approximating weight)
  const baseRate = ZONE_BASE_RATES[zone];
  const additionalItems = Math.max(0, itemCount - 1);
  const fee = baseRate + additionalItems * PER_KG_RATE[zone];

  const estimatedDays =
    zone === "metro_manila" ? "1-2" : zone === "luzon" ? "2-4" : zone === "visayas" ? "3-5" : "5-7";

  return { fee, zone, isFreeShipping: false, estimatedDays };
}

export function formatZoneName(zone: ShippingZone): string {
  const names: Record<ShippingZone, string> = {
    metro_manila: "Metro Manila",
    luzon: "Luzon",
    visayas: "Visayas",
    mindanao: "Mindanao",
  };
  return names[zone];
}
