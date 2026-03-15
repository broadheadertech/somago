/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as apiKeys from "../apiKeys.js";
import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as chat from "../chat.js";
import type * as disputes from "../disputes.js";
import type * as email from "../email.js";
import type * as files from "../files.js";
import type * as flashSales from "../flashSales.js";
import type * as follows from "../follows.js";
import type * as fraud from "../fraud.js";
import type * as gamification from "../gamification.js";
import type * as health from "../health.js";
import type * as live from "../live.js";
import type * as loyalty from "../loyalty.js";
import type * as mall from "../mall.js";
import type * as notifications from "../notifications.js";
import type * as orders from "../orders.js";
import type * as payouts from "../payouts.js";
import type * as posts from "../posts.js";
import type * as priceAlerts from "../priceAlerts.js";
import type * as products from "../products.js";
import type * as promotions from "../promotions.js";
import type * as questions from "../questions.js";
import type * as rateLimit from "../rateLimit.js";
import type * as referrals from "../referrals.js";
import type * as returns from "../returns.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as seedImages from "../seedImages.js";
import type * as shipments from "../shipments.js";
import type * as siteContent from "../siteContent.js";
import type * as subscriptions from "../subscriptions.js";
import type * as support from "../support.js";
import type * as users from "../users.js";
import type * as utils from "../utils.js";
import type * as vouchers from "../vouchers.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  apiKeys: typeof apiKeys;
  auditLog: typeof auditLog;
  auth: typeof auth;
  cart: typeof cart;
  categories: typeof categories;
  chat: typeof chat;
  disputes: typeof disputes;
  email: typeof email;
  files: typeof files;
  flashSales: typeof flashSales;
  follows: typeof follows;
  fraud: typeof fraud;
  gamification: typeof gamification;
  health: typeof health;
  live: typeof live;
  loyalty: typeof loyalty;
  mall: typeof mall;
  notifications: typeof notifications;
  orders: typeof orders;
  payouts: typeof payouts;
  posts: typeof posts;
  priceAlerts: typeof priceAlerts;
  products: typeof products;
  promotions: typeof promotions;
  questions: typeof questions;
  rateLimit: typeof rateLimit;
  referrals: typeof referrals;
  returns: typeof returns;
  reviews: typeof reviews;
  seed: typeof seed;
  seedImages: typeof seedImages;
  shipments: typeof shipments;
  siteContent: typeof siteContent;
  subscriptions: typeof subscriptions;
  support: typeof support;
  users: typeof users;
  utils: typeof utils;
  vouchers: typeof vouchers;
  wishlist: typeof wishlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
