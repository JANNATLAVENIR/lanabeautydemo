import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { LOCAL_STORES, PRODUCT_CATEGORIES, ROADMAP_PHASES, ALL_LUXURY_PRODUCTS } from "./src/constants";
import { Order, Product, LocalStore, Category, HomepageSettings } from "./src/types";

// Authoritative Database & Supabase Configuration
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const DATABASE_URL = process.env.DATABASE_URL;

// Support standard server-only SUPABASE_URL or legacy VITE_ prefix
let SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://mjvfpoapuonncbfvhfyz.supabase.co";
if (SUPABASE_URL.includes("aafaftdrhyjmpjwqkpwe")) {
  SUPABASE_URL = "https://mjvfpoapuonncbfvhfyz.supabase.co";
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || "public-anon-key-placeholder");

// Serverless-optimized PostgreSQL Connection Pool
export const dbPool = DATABASE_URL
  ? new Pool({
      connectionString: DATABASE_URL,
      max: process.env.VERCEL ? 3 : 10,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
      ssl: DATABASE_URL.includes("supabase.co") || DATABASE_URL.includes("sslmode") ? { rejectUnauthorized: false } : undefined
    })
  : null;

// Test DB pool connection on startup without crashing serverless worker
if (dbPool) {
  dbPool.query("SELECT NOW();")
    .then(() => {
      console.log("[DATABASE] Authoritative PostgreSQL pool connected successfully.");
      initStorageInfrastructure();
    })
    .catch(err => {
      console.warn("[DATABASE NOTICE] PostgreSQL connection note:", err.message);
    });
} else {
  console.log("[DATABASE] Running in lightweight / Supabase direct API mode.");
}

async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });
  try {
    return await Promise.race([
      fn().then((res) => {
        clearTimeout(timer);
        return res;
      }).catch(() => fallbackValue),
      timeoutPromise
    ]);
  } catch {
    clearTimeout(timer);
    return fallbackValue;
  }
}

async function initStorageInfrastructure() {
  if (!dbPool) return;
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        filename TEXT PRIMARY KEY,
        mime_type TEXT,
        data_base64 TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS homepage_settings (
        id SERIAL PRIMARY KEY,
        settings JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        department TEXT DEFAULT 'Fashion',
        sub_categories JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT DEFAULT 'LANA',
        category TEXT NOT NULL,
        sub_category TEXT,
        department TEXT DEFAULT 'Fashion',
        gender TEXT,
        retail_price NUMERIC NOT NULL DEFAULT 0,
        original_price NUMERIC,
        image TEXT NOT NULL,
        secondary_image TEXT,
        images JSONB DEFAULT '[]'::jsonb,
        description TEXT,
        volume TEXT,
        sizes JSONB DEFAULT '[]'::jsonb,
        colors JSONB DEFAULT '[]'::jsonb,
        details JSONB DEFAULT '[]'::jsonb,
        ingredients TEXT,
        savoir_faire TEXT,
        rating NUMERIC DEFAULT 5.0,
        review_count INTEGER DEFAULT 1,
        is_new BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        is_bestseller BOOLEAN DEFAULT FALSE,
        is_exclusive BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        supplier_inventory JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        delivery_address TEXT,
        city TEXT,
        postal_code TEXT,
        notes TEXT,
        items JSONB NOT NULL,
        total_price NUMERIC NOT NULL,
        status TEXT DEFAULT 'Pending',
        payment_status TEXT DEFAULT 'Pending',
        payment_method TEXT DEFAULT 'Manual Payment',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        assigned_store_ids JSONB DEFAULT '{}'::jsonb
      );
      CREATE TABLE IF NOT EXISTS promo_codes (
        code TEXT PRIMARY KEY,
        discount_percent NUMERIC DEFAULT 0,
        discount_amount NUMERIC DEFAULT 0,
        min_spend NUMERIC DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      INSERT INTO promo_codes (code, discount_percent, discount_amount, min_spend, is_active) 
      VALUES 
        ('LANA10', 10, 0, 0, true),
        ('VIP2026', 15, 0, 100, true),
        ('WELCOME50', 0, 50, 250, true)
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log("[STORAGE] PostgreSQL tables (media_files, homepage_settings, categories, products, orders, promo_codes) verified.");

    if (SUPABASE_SERVICE_ROLE_KEY) {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets || !buckets.find(b => b.name === 'media')) {
        const { error } = await supabase.storage.createBucket('media', { public: true });
        if (error && !error.message.includes('already exists')) {
          console.warn("[STORAGE] Note creating Supabase media bucket:", error.message);
        } else {
          console.log("[STORAGE] Supabase Storage public 'media' bucket ready.");
        }
      }
    }
  } catch (err: any) {
    console.warn("[STORAGE] Storage init check note:", err.message);
  }
}

// Stateless HMAC Session Token Engine (Serverless Multi-Instance Resilient)
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function createSignedToken(payload: Record<string, any>): string {
  if (!SESSION_SECRET) throw new Error("ADMIN_SESSION_SECRET or SUPABASE_SERVICE_ROLE_KEY must be configured.");
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json).toString("base64url");
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(b64).digest("base64url");
  return `lana_tok.${b64}.${hmac}`;
}

export function verifySignedToken(token: string): Record<string, any> | null {
  if (!SESSION_SECRET || !token || !token.startsWith("lana_tok.")) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const b64 = parts[1];
  const hmac = parts[2];
  const expectedHmac = crypto.createHmac("sha256", SESSION_SECRET).update(b64).digest("base64url");
  if (hmac !== expectedHmac) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Stateful session store for backwards compatibility and local dev
const activeAdminSessions = new Map<string, { email: string; expiresAt: number }>();
const activeCustomerSessions = new Map<string, { customerId: string; email: string; expiresAt: number }>();

// Cache for order idempotency
const processedIdempotencyKeys = new Map<string, any>();

// Audit logging helper for sensitive admin actions
function logAdminAction(adminEmail: string, action: string, details: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: "AUDIT_LOG",
    actor: adminEmail,
    action,
    details
  };
  console.log(`[AUDIT] ${JSON.stringify(logEntry)}`);
}

// Lightweight Mutual Exclusion Lock for concurrent checkout safety
class AsyncLock {
  private promise: Promise<any> = Promise.resolve();

  async acquire(): Promise<() => void> {
    let release: () => void;
    const nextPromise = new Promise<void>(resolve => {
      release = resolve;
    });
    const currentPromise = this.promise;
    this.promise = nextPromise;
    await currentPromise;
    return release!;
  }
}

const checkoutLock = new AsyncLock();

const PRODUCTS_CACHE_FILE = path.join(os.tmpdir(), 'products-cache.json');
const CATEGORIES_CACHE_FILE = path.join(os.tmpdir(), 'categories-cache.json');

// Fallback in-memory state initialized with cached or default catalog
let memoryStores: LocalStore[] = [...LOCAL_STORES];
let memoryProducts: Product[] = (() => {
  try {
    const rootPath = path.join(process.cwd(), 'products-cache.json');
    const targetPath = fs.existsSync(rootPath) ? rootPath : PRODUCTS_CACHE_FILE;
    if (fs.existsSync(targetPath)) {
      const parsed = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...ALL_LUXURY_PRODUCTS];
})();
let memoryOrders: Order[] = [];
let memoryCategories: Category[] = (() => {
  try {
    const rootPath = path.join(process.cwd(), 'categories-cache.json');
    const targetPath = fs.existsSync(rootPath) ? rootPath : CATEGORIES_CACHE_FILE;
    if (fs.existsSync(targetPath)) {
      const parsed = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...PRODUCT_CATEGORIES];
})();

// Auto-seed catalog: only seeds default items if database is completely empty without deleting user edits
async function autoSeedProducts() {
  try {
    let existingCount = 0;

    // Check PostgreSQL
    if (dbPool) {
      try {
        const countRes = await dbPool.query("SELECT COUNT(*) FROM public.products");
        existingCount = parseInt(countRes.rows[0]?.count || "0", 10);
      } catch (e) {}
    }

    // Check Supabase if DB pool was not available or empty
    if (existingCount === 0) {
      try {
        const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true });
        if (!error && typeof count === "number") {
          existingCount = count;
        }
      } catch (e) {}
    }

    // If database already has products, do NOT delete them! Fetch and update memory
    if (existingCount > 0) {
      console.log(`[SEED] Database contains ${existingCount} products. Preserving existing catalog.`);
      try {
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
        if (!error && Array.isArray(data) && data.length > 0) {
          memoryProducts = data.map(mapDbProduct);
          try {
            fs.writeFileSync(PRODUCTS_CACHE_FILE, JSON.stringify(memoryProducts, null, 2), 'utf-8');
          } catch {}
        }
      } catch (e) {}
      return;
    }

    console.log("[SEED] Initializing default catalog into empty database...");
    for (const p of ALL_LUXURY_PRODUCTS) {
      if (dbPool) {
        await poolInsertProduct(p);
      }
      try {
        await supabase.from("products").upsert({
          id: p.id,
          name: p.name,
          brand: p.brand || "LANA",
          category: p.category,
          sub_category: p.subCategory,
          department: p.department || "Fashion",
          gender: p.gender,
          retail_price: p.retailPrice,
          original_price: p.originalPrice,
          image: p.image,
          secondary_image: p.secondaryImage,
          images: p.images || [p.image],
          description: p.description,
          volume: p.volume,
          sizes: p.sizes,
          colors: p.colors,
          details: p.details,
          savoir_faire: p.savoirFaire,
          rating: p.rating || 5.0,
          review_count: p.reviewCount || 1,
          is_new: p.isNew ?? true,
          is_featured: p.isFeatured ?? false,
          is_bestseller: p.isBestSeller ?? false,
          is_exclusive: p.isExclusive ?? false,
          is_active: p.isActive ?? true,
          supplier_inventory: p.supplierInventory || []
        });
      } catch (e) {}
    }
    for (const c of PRODUCT_CATEGORIES) {
      try {
        await supabase.from("categories").upsert({
          id: c.id,
          name: c.name,
          description: c.description,
          image: c.image,
          department: c.department || "Fashion",
          sub_categories: c.subCategories || []
        });
      } catch (e) {}
      if (dbPool) {
        try {
          await dbPool.query(
            `INSERT INTO categories (id, name, description, image, department, sub_categories)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO NOTHING`,
            [c.id, c.name, c.description, c.image, c.department || "Fashion", JSON.stringify(c.subCategories || [])]
          );
        } catch (e) {}
      }
    }
  } catch (err: any) {
    console.warn("[SEED] Notice during product auto-seed:", err.message);
  }
}

async function poolInsertProduct(p: Product) {
  try {
    await dbPool.query(
      `INSERT INTO public.products (
        id, name, brand, category, sub_category, department, gender, retail_price, original_price,
        image, secondary_image, images, description, volume, sizes, colors, details, savoir_faire,
        rating, review_count, is_new, is_featured, is_bestseller, is_exclusive, is_active, supplier_inventory
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        category = EXCLUDED.category,
        sub_category = EXCLUDED.sub_category,
        department = EXCLUDED.department,
        gender = EXCLUDED.gender,
        retail_price = EXCLUDED.retail_price,
        original_price = EXCLUDED.original_price,
        image = EXCLUDED.image,
        secondary_image = EXCLUDED.secondary_image,
        images = EXCLUDED.images,
        description = EXCLUDED.description,
        sizes = EXCLUDED.sizes,
        colors = EXCLUDED.colors,
        details = EXCLUDED.details,
        savoir_faire = EXCLUDED.savoir_faire,
        rating = EXCLUDED.rating,
        review_count = EXCLUDED.review_count,
        is_new = EXCLUDED.is_new,
        is_featured = EXCLUDED.is_featured,
        is_bestseller = EXCLUDED.is_bestseller,
        is_exclusive = EXCLUDED.is_exclusive,
        is_active = EXCLUDED.is_active,
        supplier_inventory = EXCLUDED.supplier_inventory`,
      [
        p.id,
        p.name,
        p.brand || "Christian Dior",
        p.category,
        p.subCategory || null,
        p.department || "Fashion",
        p.gender || null,
        p.retailPrice,
        p.originalPrice || null,
        p.image,
        p.secondaryImage || null,
        JSON.stringify(p.images || [p.image]),
        p.description || "",
        p.volume || null,
        p.sizes ? JSON.stringify(p.sizes) : null,
        p.colors ? JSON.stringify(p.colors) : null,
        p.details ? JSON.stringify(p.details) : null,
        p.savoirFaire || null,
        p.rating || 5.0,
        p.reviewCount || 12,
        p.isNew ?? false,
        p.isFeatured ?? false,
        p.isBestSeller ?? false,
        p.isExclusive ?? false,
        p.isActive ?? true,
        JSON.stringify(p.supplierInventory || [])
      ]
    );
  } catch (err: any) {
    console.error(`Failed to insert product ${p.id}:`, err.message);
  }
}

if (!process.env.VERCEL) {
  setTimeout(() => {
    autoSeedProducts().catch(err => console.warn("Background autoSeedNote:", err?.message));
  }, 100);
}

const HOMEPAGE_SETTINGS_FILE = path.join(os.tmpdir(), 'homepage-settings.json');
let memoryHomepageSettings: any = {
  heroFashionImage: '',
  heroFashionTitle: 'Fashion & Accessories',
  heroFashionEyebrow: 'CAMPAIGN I',
  heroFashionCta: 'Shop now',
  heroFashionImagePosition: 'object-[50%_35%]',
  heroFashionOverlayOpacity: 'medium',
  heroFashionActive: true,
  heroBeautyImage: '',
  heroBeautyTitle: 'Fragrance & Beauty',
  heroBeautyEyebrow: 'CAMPAIGN II',
  heroBeautyCta: 'Shop now',
  heroBeautyImagePosition: 'object-[50%_35%]',
  heroBeautyOverlayOpacity: 'medium',
  heroBeautyActive: true,
  additionalBanners: []
};

try {
  const rootPath = path.join(process.cwd(), 'homepage-settings.json');
  const targetPath = fs.existsSync(rootPath) ? rootPath : HOMEPAGE_SETTINGS_FILE;
  if (fs.existsSync(targetPath)) {
    memoryHomepageSettings = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
  }
} catch (e) {
  console.error("Failed to load homepage settings:", e);
}

let memoryCustomers: any[] = [
  {
    id: "cust-101",
    name: "Fatima Al-Zahra",
    email: "fatima.zahra@example.com",
    password: "Password123!",
    phone: "",
    memberTier: "Maison VIP",
    memberSince: "2024",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: "cust-102",
    name: "Sultan Al-Otaibi",
    email: "sultan.otaibi@example.com",
    password: "LanaClient2026",
    phone: "",
    memberTier: "Haute Cercle",
    memberSince: "2025",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];
let memoryReviews: any[] = [
  {
    id: "rev-1",
    productId: "prod-1",
    authorName: "Amina K.",
    rating: 5,
    title: "An Unforgettable Oud Signature",
    comment: "The sillage of this perfume lasts for over 24 hours. Truly encapsulates high-end French-Arabian perfumery.",
    verifiedPurchase: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: "rev-2",
    productId: "prod-1",
    authorName: "Korey M.",
    rating: 5,
    title: "Exquisite Packaging & Scent",
    comment: "Delivered next-day in Riyadh in a white-glove velvet box. Worth every dollar.",
    verifiedPurchase: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name || "",
    brand: row.brand || "LANA",
    category: row.category || "Fragrance",
    subCategory: row.sub_category || row.subcategory,
    department: row.department || "Beauty",
    gender: row.gender,
    retailPrice: Number(row.retail_price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    image: row.image || "",
    secondaryImage: row.secondary_image,
    images: row.images || (row.image ? [row.image] : []),
    description: row.description || "",
    volume: row.volume || "",
    sizes: row.sizes,
    colors: row.colors,
    details: row.details,
    savoirFaire: row.savoir_faire,
    rating: row.rating !== undefined ? Number(row.rating) : 5.0,
    reviewCount: row.review_count !== undefined ? Number(row.review_count) : 12,
    isNew: row.is_new !== undefined ? Boolean(row.is_new) : undefined,
    isFeatured: row.is_featured !== undefined ? Boolean(row.is_featured) : undefined,
    isBestSeller: row.is_bestseller !== undefined ? Boolean(row.is_bestseller) : undefined,
    isExclusive: row.is_exclusive !== undefined ? Boolean(row.is_exclusive) : undefined,
    isActive: row.is_active !== false,
    supplierInventory: row.supplier_inventory || []
  };
}

function mapDbOrder(row: any): Order {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || "",
    deliveryAddress: row.delivery_address,
    city: row.city,
    postalCode: row.postal_code || "",
    paymentMethod: row.payment_method || "Manual Bank Transfer",
    giftWrapping: row.gift_wrapping === true,
    notes: row.notes,
    items: row.items || [],
    subtotal: Number(row.subtotal || row.total_price),
    shippingFee: Number(row.shipping_fee || 0),
    totalPrice: Number(row.total_price),
    status: row.status,
    paymentStatus: row.payment_status || "Pending",
    createdAt: row.created_at,
    assignedStoreIds: row.assigned_store_ids || {}
  };
}

// Canonical Public Product Mapper (Strictly hides wholesaleCost and supplier inventory metadata)
function mapPublicProduct(row: any) {
  return {
    id: row.id,
    name: row.name || "",
    brand: row.brand || "LANA",
    category: row.category || "Fragrance",
    subCategory: row.sub_category || row.subcategory,
    department: row.department || "Beauty",
    gender: row.gender,
    retailPrice: Number(row.retail_price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    image: row.image || "",
    secondaryImage: row.secondary_image,
    images: row.images || (row.image ? [row.image] : []),
    description: row.description || "",
    volume: row.volume || "",
    sizes: row.sizes,
    colors: row.colors,
    details: row.details,
    savoirFaire: row.savoir_faire,
    rating: row.rating !== undefined ? Number(row.rating) : 5.0,
    reviewCount: row.review_count !== undefined ? Number(row.review_count) : 12,
    isNew: row.is_new !== undefined ? Boolean(row.is_new) : undefined,
    isFeatured: row.is_featured !== undefined ? Boolean(row.is_featured) : undefined,
    isBestSeller: row.is_bestseller !== undefined ? Boolean(row.is_bestseller) : undefined,
    isExclusive: row.is_exclusive !== undefined ? Boolean(row.is_exclusive) : undefined,
    isActive: row.is_active !== false,
    inStock: row.in_stock !== undefined ? Boolean(row.in_stock) : true
  };
}

// Canonical Order Mapper for orders_v2 + order_items
function mapCanonicalOrder(row: any): Order {
  const addr = typeof row.shipping_address_snapshot === "object" && row.shipping_address_snapshot !== null
    ? row.shipping_address_snapshot
    : {};
  return {
    id: row.order_number || row.id,
    customerName: row.customer_name || addr.fullName || "Distinguished Client",
    customerEmail: row.customer_email || addr.email || "",
    customerPhone: row.customer_phone || addr.phone || "",
    deliveryAddress: addr.address || "Standard Delivery",
    city: addr.city || "Paris",
    postalCode: addr.postalCode || "",
    paymentMethod: row.payment_method || "Manual Payment",
    giftWrapping: false,
    notes: row.customer_notes || "",
    items: Array.isArray(row.items) ? row.items.map((it: any) => ({
      productId: it.productId,
      productName: it.productName,
      price: Number(it.unitPrice) || 0,
      quantity: Number(it.quantity) || 1,
      image: ""
    })) : [],
    subtotal: Number(row.subtotal) || 0,
    shippingFee: Number(row.shipping) || 0,
    totalPrice: Number(row.total) || 0,
    status: row.order_status || "Pending",
    paymentStatus: row.payment_status || "Pending",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    assignedStoreIds: {}
  };
}

// Helper to ensure customer exists in customers_v2 linked to auth.users
async function ensureCustomerV2(email: string, name?: string, phone?: string): Promise<string | null> {
  if (!dbPool) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const existing = await dbPool.query("SELECT id FROM public.customers_v2 WHERE email = $1 LIMIT 1;", [cleanEmail]);
    if (existing.rows.length > 0) return existing.rows[0].id;

    let authUserId: string | null = null;
    const authUser = await dbPool.query("SELECT id FROM auth.users WHERE email = $1 LIMIT 1;", [cleanEmail]);
    if (authUser.rows.length > 0) {
      authUserId = authUser.rows[0].id;
    } else {
      const tempPass = `Tmp_${crypto.randomBytes(16).toString("hex")}!`;
      const { data } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: tempPass,
        email_confirm: true,
        user_metadata: { full_name: name || cleanEmail.split("@")[0] }
      });
      if (data?.user?.id) {
        authUserId = data.user.id;
      }
    }

    if (authUserId) {
      const insertRes = await dbPool.query(
        `INSERT INTO public.customers_v2 (user_id, full_name, email, phone)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = COALESCE(EXCLUDED.phone, customers_v2.phone)
         RETURNING id;`,
        [authUserId, name || cleanEmail.split("@")[0], cleanEmail, phone || null]
      );
      return insertRes.rows[0]?.id || null;
    }
  } catch (err: any) {
    console.error("[ensureCustomerV2 Notice]", err.message);
  }
  return null;
}

function mapDbCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name || "",
    description: row.description || "",
    image: row.image || "",
    department: row.department || "Fashion",
    subCategories: Array.isArray(row.sub_categories) ? row.sub_categories : (Array.isArray(row.subcategories) ? row.subcategories : [])
  };
}

function mapDbStore(row: any): LocalStore {
  return {
    id: row.id,
    name: row.name,
    neighborhood: row.neighborhood,
    contactPerson: row.contact_person,
    phone: row.phone,
    rating: Number(row.rating),
    isActive: row.is_active !== false
  };
}

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Idempotency-Key");
  
  // Strict No-Cache for API responses across all devices & Vercel Edge CDN
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ limit: "60mb", extended: true }));

// Hash memory fallback passwords on startup securely
for (const c of memoryCustomers) {
  if (!c.password.startsWith("$2a$") && !c.password.startsWith("$2b$")) {
    bcrypt.hash(c.password, 10).then(h => { c.password = h; }).catch(() => {});
  }
}

// Media storage for high-performance instant uploads (Serverless-safe in os.tmpdir)
const uploadsDir = path.join(os.tmpdir(), "lana_uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {}

// Persistent Media Helper: Saves to Supabase CDN bucket + PostgreSQL backup + Serverless Temp Cache
async function persistMediaFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const localFilePath = path.join(uploadsDir, filename);

  // 1. Write to local temp buffer
  try {
    fs.writeFileSync(localFilePath, buffer);
  } catch (err) {}

  // 2. Upload to Supabase Storage 'media' bucket for permanent global CDN delivery
  try {
    const { data, error } = await supabase.storage.from('media').upload(filename, buffer, {
      contentType: mimeType,
      upsert: true
    });
    if (!error && data) {
      const { data: publicData } = supabase.storage.from('media').getPublicUrl(filename);
      if (publicData?.publicUrl) {
        return publicData.publicUrl;
      }
    }
  } catch (err: any) {
    console.warn("Supabase storage upload note:", err.message);
  }

  // 3. Persist to PostgreSQL media_files table as durable permanent backup
  let savedToPostgres = false;
  if (dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO media_files (filename, mime_type, data_base64) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (filename) DO UPDATE SET mime_type = $2, data_base64 = $3`,
        [filename, mimeType, buffer.toString('base64')]
      );
      savedToPostgres = true;
    } catch (err: any) {
      console.warn("PostgreSQL media_files save note:", err.message);
    }
  }

  if (buffer.length < 500000) {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }
  if (!savedToPostgres) {
    throw new Error("Media could not be saved to persistent storage. Configure Supabase Storage or DATABASE_URL and try again.");
  }

  return `/api/media/${filename}`;
}

async function convertDataUrlToPersistentUrl(dataUrl: string, prefix = "img"): Promise<string> {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return dataUrl;
  }
  try {
    const matches = dataUrl.match(/^data:([A-Za-z0-9\-\.\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return dataUrl;

    const mime = matches[1].toLowerCase();
    let ext = "jpg";
    if (mime.includes("png")) ext = "png";
    else if (mime.includes("webp")) ext = "webp";
    else if (mime.includes("gif")) ext = "gif";
    else if (mime.includes("mp4")) ext = "mp4";
    else if (mime.includes("webm")) ext = "webm";
    else if (mime.includes("quicktime") || mime.includes("mov")) ext = "mov";

    const buffer = Buffer.from(matches[2], "base64");
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const cleanFilename = `${prefix}-${Date.now()}-${randomSuffix}.${ext}`;

    return await persistMediaFile(buffer, cleanFilename, mime);
  } catch (err) {
    console.error("Failed to convert dataUrl to persistent media:", err);
    return dataUrl;
  }
}

// Resilient Media Delivery: Serves from Local Temp -> Supabase Storage -> PostgreSQL DB
app.get(["/uploads/:filename", "/api/media/:filename"], async (req, res) => {
  const { filename } = req.params;
  const localPath = path.join(uploadsDir, filename);

  // 1. Fast path: serve from local cache if file is present
  if (fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  // 2. Fetch from Supabase Storage 'media' bucket
  try {
    const { data, error } = await supabase.storage.from('media').download(filename);
    if (!error && data) {
      const arrayBuffer = await data.arrayBuffer();
      const buf = Buffer.from(arrayBuffer);
      try { fs.writeFileSync(localPath, buf); } catch (e) {}
      res.setHeader("Content-Type", data.type || "application/octet-stream");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(buf);
    }
  } catch (err) {}

  // 3. Fetch from PostgreSQL media_files table backup
  if (dbPool) {
    try {
      const dbRes = await dbPool.query("SELECT mime_type, data_base64 FROM media_files WHERE filename = $1", [filename]);
      if (dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        const buf = Buffer.from(row.data_base64, 'base64');
        try { fs.writeFileSync(localPath, buf); } catch (e) {}
        res.setHeader("Content-Type", row.mime_type || "application/octet-stream");
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.send(buf);
      }
    } catch (err) {
      console.warn("DB media recovery error:", err);
    }
  }

  return res.status(404).json({ error: "Media file not found or expired." });
});

// Media Upload Endpoint
app.post(["/api/upload", "/upload"], async (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
  }

  try {
    const { data, filename, mimeType } = req.body;
    if (!data) {
      return res.status(400).json({ error: "No media data provided." });
    }

    let buffer: Buffer;
    let detectedMime = mimeType || "image/jpeg";
    let ext = "jpg";

    if (data.startsWith("data:")) {
      const matches = data.match(/^data:([A-Za-z0-9\-\.\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        detectedMime = matches[1].toLowerCase();
        if (detectedMime.includes("png")) ext = "png";
        else if (detectedMime.includes("webp")) ext = "webp";
        else if (detectedMime.includes("gif")) ext = "gif";
        else if (detectedMime.includes("mp4")) ext = "mp4";
        else if (detectedMime.includes("webm")) ext = "webm";
        else if (detectedMime.includes("quicktime") || detectedMime.includes("mov")) ext = "mov";
        else ext = "jpg";
        buffer = Buffer.from(matches[2], "base64");
      } else {
        return res.status(400).json({ error: "Invalid data URL format." });
      }
    } else {
      buffer = Buffer.from(data, "base64");
      if (mimeType?.includes("mp4")) ext = "mp4";
      else if (mimeType?.includes("webm")) ext = "webm";
      else if (mimeType?.includes("webp")) ext = "webp";
      else if (mimeType?.includes("png")) ext = "png";
    }

    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const cleanFilename = `media-${Date.now()}-${randomSuffix}.${ext}`;
    const savedUrl = await persistMediaFile(buffer, cleanFilename, detectedMime);

    res.json({ url: savedUrl, filename: cleanFilename });
  } catch (err: any) {
    console.error("Upload processing failed:", err);
    res.status(500).json({ error: "Failed to process media upload: " + (err.message || "Unknown error") });
  }
});

// --- API ENDPOINTS ---

// Categories (Database-backed with Supabase & PostgreSQL sync)
app.get(["/api/categories", "/categories"], async (req, res) => {
  const catData = await withTimeout(async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(mapDbCategory);
      }
    } catch (e) {}

    if (dbPool) {
      try {
        const dbRes = await dbPool.query("SELECT * FROM categories ORDER BY name ASC");
        if (dbRes.rows.length > 0) {
          return dbRes.rows.map(mapDbCategory);
        }
      } catch (e) {}
    }
    return null;
  }, 1200, null);

  if (catData && Array.isArray(catData) && catData.length > 0) {
    return res.json(catData);
  }

  const seen = new Set<string>();
  const deduplicated = memoryCategories.filter(c => {
    const idKey = (c.id || c.name || '').toLowerCase();
    if (!idKey || seen.has(idKey)) return false;
    seen.add(idKey);
    return true;
  });
  if (deduplicated.length > 0) {
    return res.json(deduplicated);
  }
  res.json(PRODUCT_CATEGORIES);
});

app.post(["/api/categories", "/categories"], async (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
  }
  const { name, description, image, department, subCategories } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required." });
  }

  const cleanName = name.trim();
  const catId = req.body.id || cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const newCategory: Category = {
    id: catId,
    name: cleanName,
    description: description?.trim() || `${cleanName} luxury collection.`,
    image: image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
    department: department || "Fashion",
    subCategories: Array.isArray(subCategories) ? subCategories : (typeof subCategories === 'string' ? subCategories.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
  };

  const existingIdx = memoryCategories.findIndex(c => c.id === newCategory.id || c.name.toLowerCase() === newCategory.name.toLowerCase());
  if (existingIdx !== -1) {
    memoryCategories[existingIdx] = { ...memoryCategories[existingIdx], ...newCategory };
  } else {
    memoryCategories.push(newCategory);
  }

  // Persist to Supabase
  try {
    await supabase.from("categories").upsert({
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description,
      image: newCategory.image,
      department: newCategory.department,
      sub_categories: newCategory.subCategories
    });
  } catch (err: any) {
    console.warn("Supabase category upsert note:", err.message);
  }

  // Persist to PostgreSQL pool
  if (dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO categories (id, name, description, image, department, sub_categories)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           image = EXCLUDED.image,
           department = EXCLUDED.department,
           sub_categories = EXCLUDED.sub_categories`,
        [newCategory.id, newCategory.name, newCategory.description, newCategory.image, newCategory.department, JSON.stringify(newCategory.subCategories)]
      );
    } catch (dbErr: any) {
      console.warn("PostgreSQL category upsert note:", dbErr.message);
    }
  }

  res.status(201).json(newCategory);
});

app.delete(["/api/categories", "/categories"], async (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
  }
  memoryCategories = [];
  try {
    await supabase.from("categories").delete().neq("id", "none_placeholder_safe");
  } catch (e) {}
  if (dbPool) {
    try {
      await dbPool.query("DELETE FROM categories;");
    } catch (e) {}
  }
  res.json({ success: true, count: 0 });
});

app.delete(["/api/categories/:id", "/categories/:id"], async (req, res) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
  }
  const targetId = req.params.id.toLowerCase();
  memoryCategories = memoryCategories.filter(c => c.id.toLowerCase() !== targetId && c.name.toLowerCase() !== targetId);

  try {
    await supabase.from("categories").delete().eq("id", targetId);
  } catch (e) {}

  if (dbPool) {
    try {
      await dbPool.query("DELETE FROM categories WHERE id = $1", [targetId]);
    } catch (e) {}
  }

  res.json({ success: true });
});

  async function sanitizeHomepageSettingsAsync(settings: any) {
    if (!settings || typeof settings !== 'object') return settings;
    const cleaned = { ...settings };

    if (typeof cleaned.heroFashionImage === 'string' && cleaned.heroFashionImage.startsWith('data:')) {
      cleaned.heroFashionImage = await convertDataUrlToPersistentUrl(cleaned.heroFashionImage, 'hero-fashion');
    }

    if (typeof cleaned.heroBeautyImage === 'string' && cleaned.heroBeautyImage.startsWith('data:')) {
      cleaned.heroBeautyImage = await convertDataUrlToPersistentUrl(cleaned.heroBeautyImage, 'hero-beauty');
    }

    if (typeof cleaned.heroFashionVideo === 'string' && cleaned.heroFashionVideo.startsWith('data:')) {
      cleaned.heroFashionVideo = await convertDataUrlToPersistentUrl(cleaned.heroFashionVideo, 'hero-fashion-vid');
    }

    if (typeof cleaned.heroBeautyVideo === 'string' && cleaned.heroBeautyVideo.startsWith('data:')) {
      cleaned.heroBeautyVideo = await convertDataUrlToPersistentUrl(cleaned.heroBeautyVideo, 'hero-beauty-vid');
    }

    if (Array.isArray(cleaned.heroFashionSlideImages)) {
      cleaned.heroFashionSlideImages = await Promise.all(
        cleaned.heroFashionSlideImages.map((s: any, idx: number) =>
          typeof s === 'string' && s.startsWith('data:') ? convertDataUrlToPersistentUrl(s, `fashion-slide-${idx}`) : Promise.resolve(s)
        )
      );
    }

    if (Array.isArray(cleaned.heroBeautySlideImages)) {
      cleaned.heroBeautySlideImages = await Promise.all(
        cleaned.heroBeautySlideImages.map((s: any, idx: number) =>
          typeof s === 'string' && s.startsWith('data:') ? convertDataUrlToPersistentUrl(s, `beauty-slide-${idx}`) : Promise.resolve(s)
        )
      );
    }

    if (Array.isArray(cleaned.additionalBanners)) {
      cleaned.additionalBanners = await Promise.all(
        cleaned.additionalBanners.map(async (banner: any, bIdx: number) => {
          if (!banner || typeof banner !== 'object') return banner;
          const bClean = { ...banner };
          if (typeof bClean.image === 'string' && bClean.image.startsWith('data:')) {
            bClean.image = await convertDataUrlToPersistentUrl(bClean.image, `banner-${bIdx}`);
          }
          if (typeof bClean.videoUrl === 'string' && bClean.videoUrl.startsWith('data:')) {
            bClean.videoUrl = await convertDataUrlToPersistentUrl(bClean.videoUrl, `banner-vid-${bIdx}`);
          }
          if (Array.isArray(bClean.slideImages)) {
            bClean.slideImages = await Promise.all(
              bClean.slideImages.map((s: any, sIdx: number) =>
                typeof s === 'string' && s.startsWith('data:') ? convertDataUrlToPersistentUrl(s, `banner-${bIdx}-slide-${sIdx}`) : Promise.resolve(s)
              )
            );
          }
          return bClean;
        })
      );
    }

    return cleaned;
  }

function sanitizePhoneNumbers(obj: any): any {
  return obj;
}

  // Default rich fallback settings with WhatsApp and Social Links
  const DEFAULT_RICH_SETTINGS: HomepageSettings = {
    heroFashionImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200',
    heroFashionTitle: 'Haute Couture & Fine Leather',
    heroFashionEyebrow: 'Maison Collection 2026',
    heroFashionActive: true,
    heroBeautyImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=1200',
    heroBeautyTitle: 'Exquisite Parfumerie & Care',
    heroBeautyEyebrow: 'Private Reserve',
    heroBeautyActive: true,
    additionalBanners: [],
    whatsappNumber: '',
    whatsappGreeting: 'Hello Maison Lana Concierge, I would like assistance with an inquiry.',
    whatsappFloatingActive: false,
    whatsappEnabled: false,
    socialLinks: {
      whatsapp: '',
      instagram: '',
      tiktok: '',
      facebook: '',
      snapchat: '',
      youtube: '',
      twitter: '',
      pinterest: ''
    },
    contactInfo: {
      storeName: 'Maison Lana Atelier',
      whatsappNumber: '',
      whatsappGreeting: 'Welcome to Maison Lana Private Client Care.',
      whatsappFloatingActive: false,
      whatsappEnabled: false,
      contactEmail: '',
      contactPhone: '',
      address: '',
      city: '',
      businessHours: ''
    }
  };

  // Homepage Settings & Hero Banners Control (Authoritative Singleton id=1)
  app.get(["/api/homepage-settings", "/homepage-settings"], async (req, res) => {
    const fetchedSettings = await withTimeout(async () => {
      // 1. Try Supabase for singleton id=1
      try {
        const { data, error } = await supabase
          .from("homepage_settings")
          .select("settings")
          .eq("id", 1)
          .maybeSingle();
        if (!error && data && data.settings) {
          const raw = sanitizePhoneNumbers(data.settings);
          return {
            ...DEFAULT_RICH_SETTINGS,
            ...raw,
            socialLinks: raw.socialLinks !== undefined ? raw.socialLinks : DEFAULT_RICH_SETTINGS.socialLinks,
            contactInfo: raw.contactInfo !== undefined ? raw.contactInfo : DEFAULT_RICH_SETTINGS.contactInfo,
          };
        }
      } catch (e) {}

      // 2. Try PostgreSQL dbPool for singleton id=1
      if (dbPool) {
        try {
          const dbRes = await dbPool.query("SELECT id, settings FROM public.homepage_settings WHERE id = 1 LIMIT 1;");
          if (dbRes.rows.length > 0) {
            const raw = sanitizePhoneNumbers(dbRes.rows[0].settings);
            return {
              ...DEFAULT_RICH_SETTINGS,
              ...raw,
              socialLinks: raw.socialLinks !== undefined ? raw.socialLinks : DEFAULT_RICH_SETTINGS.socialLinks,
              contactInfo: raw.contactInfo !== undefined ? raw.contactInfo : DEFAULT_RICH_SETTINGS.contactInfo,
            };
          }
        } catch (e) {}
      }
      return null;
    }, 3000, null);

    if (fetchedSettings) {
      memoryHomepageSettings = fetchedSettings;
      return res.json(memoryHomepageSettings);
    }

    // 3. Fallback cache with defaults
    if (memoryHomepageSettings && Object.keys(memoryHomepageSettings).length > 0) {
      return res.json(sanitizePhoneNumbers({ ...DEFAULT_RICH_SETTINGS, ...memoryHomepageSettings }));
    }

    res.json(DEFAULT_RICH_SETTINGS);
  });

  app.post(["/api/homepage-settings", "/homepage-settings"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    
    try {
      let currentSettings = memoryHomepageSettings || DEFAULT_RICH_SETTINGS;
      
      const merged = {
        ...currentSettings,
        ...req.body,
        socialLinks: req.body.socialLinks !== undefined ? req.body.socialLinks : currentSettings.socialLinks,
        contactInfo: req.body.contactInfo !== undefined ? req.body.contactInfo : currentSettings.contactInfo,
      };

      const updatedSettings = await sanitizeHomepageSettingsAsync(merged);

      // Require durable storage before updating the serverless instance cache.
      const { error: supabaseError } = await supabase.from("homepage_settings").upsert(
        { id: 1, settings: updatedSettings },
        { onConflict: "id" }
      );
      if (supabaseError) throw new Error(`Supabase save failed: ${supabaseError.message}`);

      if (dbPool) {
        await dbPool.query(
          `INSERT INTO public.homepage_settings (id, settings)
           VALUES (1, $1)
           ON CONFLICT (id)
           DO UPDATE SET settings = EXCLUDED.settings;`,
          [JSON.stringify(updatedSettings)]
        );
      }

      memoryHomepageSettings = updatedSettings;
      try {
        fs.writeFileSync(HOMEPAGE_SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2), 'utf-8');
      } catch (fsErr) {}

      // 3. Broadcast settings update across Supabase Realtime channel
      try {
        const syncChannel = supabase.channel('public_catalog_sync');
        await syncChannel.send({
          type: 'broadcast',
          event: 'settings_changed',
          payload: { type: 'SETTINGS_CHANGED', timestamp: Date.now() }
        });
      } catch (bcErr) {}

      res.json(updatedSettings);
    } catch (e: any) {
      console.error("Failed to save homepage settings:", e);
      res.status(500).json({ error: "Failed to save settings: " + (e.message || "Unknown error") });
    }
  });

  // Roadmap
  app.get(["/api/roadmap", "/roadmap"], (req, res) => {
    res.json(ROADMAP_PHASES);
  });

  // Partner Stores (Suppliers)
  app.get(["/api/stores", "/stores"], async (req, res) => {
    try {
      const { data, error } = await supabase.from("stores").select("*").order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        return res.json(data.map(mapDbStore));
      }
    } catch (e) {
      console.warn("Supabase stores fetch failed, using fallback:", e);
    }
    res.json(memoryStores);
  });

  app.post(["/api/stores", "/stores"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    const newStore: LocalStore = {
      id: `store-${Date.now()}`,
      name: req.body.name || "New Partner Store",
      neighborhood: req.body.neighborhood || "Central District",
      contactPerson: req.body.contactPerson || "Store Manager",
      phone: req.body.phone || "",
      rating: 5.0,
      isActive: true,
    };

    try {
      await supabase.from("stores").insert({
        id: newStore.id,
        name: newStore.name,
        neighborhood: newStore.neighborhood,
        contact_person: newStore.contactPerson,
        phone: newStore.phone,
        rating: newStore.rating,
        is_active: newStore.isActive
      });
    } catch (e) {
      console.warn("Supabase store insert fallback:", e);
    }

    memoryStores.push(newStore);
    res.status(201).json(newStore);
  });

  app.put(["/api/stores/:id", "/stores/:id"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    try {
      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.neighborhood !== undefined) updateData.neighborhood = req.body.neighborhood;
      if (req.body.contactPerson !== undefined) updateData.contact_person = req.body.contactPerson;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.rating !== undefined) updateData.rating = req.body.rating;
      if (req.body.isActive !== undefined) updateData.is_active = req.body.isActive;

      await supabase.from("stores").update(updateData).eq("id", req.params.id);
    } catch (e) {
      console.warn("Supabase store update fallback:", e);
    }

    const storeIndex = memoryStores.findIndex(s => s.id === req.params.id);
    if (storeIndex !== -1) {
      memoryStores[storeIndex] = { ...memoryStores[storeIndex], ...req.body };
      return res.json(memoryStores[storeIndex]);
    }
    res.json({ id: req.params.id, ...req.body });
  });

  // Products (Public catalog using products_public view to strictly prevent wholesale/supplier data exposure)
  app.get(["/api/products", "/products"], async (req, res) => {
    try {
      // 1. Query products_public view directly via PostgreSQL connection pool
      if (dbPool) {
        const dbRes = await dbPool.query("SELECT * FROM public.products_public WHERE is_active IS NOT FALSE ORDER BY created_at ASC;");
        if (dbRes.rows.length > 0) {
          return res.json(dbRes.rows.map(mapPublicProduct));
        }
      }

      // 2. Query products_public via Supabase client
      const { data, error } = await supabase.from("products_public").select("*").order("created_at", { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        return res.json(data.map(mapPublicProduct));
      }
    } catch (e: any) {
      console.warn("[PUBLIC CATALOG FETCH WARNING]", e.message);
    }

    // 3. Sanitized fallback memory catalog (strip wholesaleCost and supplier inventory details)
    res.json(memoryProducts.map(p => {
      const { supplierInventory, ...safeProduct } = p;
      return { ...safeProduct, inStock: true };
    }));
  });

  app.post(["/api/products", "/products"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }

    const priceVal = Number(req.body.retailPrice ?? req.body.price ?? 150);
    const newProduct: Product = {
      id: req.body.id || `prod-${Date.now()}`,
      name: req.body.name || "New Luxury Item",
      brand: req.body.brand || "LANA",
      category: req.body.category || "Fragrance",
      subCategory: req.body.subCategory,
      department: req.body.department || "Fashion",
      gender: req.body.gender,
      retailPrice: priceVal,
      price: priceVal,
      originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : undefined,
      image: req.body.image || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600",
      secondaryImage: req.body.secondaryImage,
      images: Array.isArray(req.body.images) && req.body.images.length > 0 ? req.body.images : [req.body.image || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600"],
      description: req.body.description || "Crafted for the discerning senses.",
      volume: req.body.volume || "",
      sizes: Array.isArray(req.body.sizes) ? req.body.sizes : undefined,
      colors: Array.isArray(req.body.colors) ? req.body.colors : undefined,
      details: Array.isArray(req.body.details) ? req.body.details : undefined,
      ingredients: req.body.ingredients,
      savoirFaire: req.body.savoirFaire,
      rating: Number(req.body.rating || 5.0),
      reviewCount: Number(req.body.reviewCount || 1),
      isNew: req.body.isNew !== undefined ? Boolean(req.body.isNew) : true,
      isFeatured: req.body.isFeatured !== undefined ? Boolean(req.body.isFeatured) : false,
      isBestSeller: req.body.isBestSeller !== undefined ? Boolean(req.body.isBestSeller) : false,
      isExclusive: req.body.isExclusive !== undefined ? Boolean(req.body.isExclusive) : false,
      isActive: req.body.isActive !== false,
      supplierInventory: Array.isArray(req.body.supplierInventory) ? req.body.supplierInventory : []
    };

    try {
      let supabaseProductError: any = null;
      try {
        const { error } = await supabase.from("products").upsert({
        id: newProduct.id,
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        sub_category: newProduct.subCategory,
        department: newProduct.department,
        gender: newProduct.gender,
        retail_price: newProduct.retailPrice,
        original_price: newProduct.originalPrice,
        image: newProduct.image,
        secondary_image: newProduct.secondaryImage,
        images: newProduct.images,
        description: newProduct.description,
        volume: newProduct.volume,
        sizes: newProduct.sizes,
        colors: newProduct.colors,
        details: newProduct.details,
        ingredients: newProduct.ingredients,
        savoir_faire: newProduct.savoirFaire,
        rating: newProduct.rating,
        review_count: newProduct.reviewCount,
        is_new: newProduct.isNew,
        is_featured: newProduct.isFeatured,
        is_bestseller: newProduct.isBestSeller,
        is_exclusive: newProduct.isExclusive,
        is_active: newProduct.isActive,
          supplier_inventory: newProduct.supplierInventory
        });
        supabaseProductError = error;
      } catch (error: any) {
        supabaseProductError = error;
      }

      let postgresProductError: any = null;
      if (dbPool) {
        try {
          await dbPool.query(
          `INSERT INTO products (
            id, name, brand, category, sub_category, department, gender, retail_price, original_price,
            image, secondary_image, images, description, volume, sizes, colors, details, ingredients,
            savoir_faire, rating, review_count, is_new, is_featured, is_bestseller, is_exclusive, is_active, supplier_inventory
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            brand = EXCLUDED.brand,
            category = EXCLUDED.category,
            sub_category = EXCLUDED.sub_category,
            department = EXCLUDED.department,
            gender = EXCLUDED.gender,
            retail_price = EXCLUDED.retail_price,
            original_price = EXCLUDED.original_price,
            image = EXCLUDED.image,
            secondary_image = EXCLUDED.secondary_image,
            images = EXCLUDED.images,
            description = EXCLUDED.description,
            volume = EXCLUDED.volume,
            sizes = EXCLUDED.sizes,
            colors = EXCLUDED.colors,
            details = EXCLUDED.details,
            ingredients = EXCLUDED.ingredients,
            savoir_faire = EXCLUDED.savoir_faire,
            rating = EXCLUDED.rating,
            review_count = EXCLUDED.review_count,
            is_new = EXCLUDED.is_new,
            is_featured = EXCLUDED.is_featured,
            is_bestseller = EXCLUDED.is_bestseller,
            is_exclusive = EXCLUDED.is_exclusive,
            is_active = EXCLUDED.is_active,
            supplier_inventory = EXCLUDED.supplier_inventory`,
          [
            newProduct.id, newProduct.name, newProduct.brand, newProduct.category, newProduct.subCategory, newProduct.department, newProduct.gender,
            newProduct.retailPrice, newProduct.originalPrice || null, newProduct.image, newProduct.secondaryImage || null,
            JSON.stringify(newProduct.images), newProduct.description, newProduct.volume || null,
            newProduct.sizes ? JSON.stringify(newProduct.sizes) : null,
            newProduct.colors ? JSON.stringify(newProduct.colors) : null,
            newProduct.details ? JSON.stringify(newProduct.details) : null,
            newProduct.ingredients || null, newProduct.savoirFaire || null,
            newProduct.rating, newProduct.reviewCount, newProduct.isNew, newProduct.isFeatured, newProduct.isBestSeller, newProduct.isExclusive,
            newProduct.isActive, JSON.stringify(newProduct.supplierInventory)
          ]
          );
        } catch (error: any) {
          postgresProductError = error;
        }
      }
      const persistenceError = dbPool ? postgresProductError : supabaseProductError;
      if (persistenceError) throw new Error(persistenceError.message || "Product save failed.");

      memoryProducts.unshift(newProduct);
      try {
        fs.writeFileSync(PRODUCTS_CACHE_FILE, JSON.stringify(memoryProducts, null, 2), 'utf-8');
      } catch {}
      return res.status(201).json(newProduct);
    } catch (e: any) {
      console.error("Failed to persist product:", e);
      return res.status(503).json({ error: e.message || "Product could not be saved to persistent storage." });
    }
  });

  app.put(["/api/products/:id", "/products/:id"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }

    try {
      const prodIndex = memoryProducts.findIndex(p => p.id === req.params.id);
      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.brand !== undefined) updateData.brand = req.body.brand;
      if (req.body.category !== undefined) updateData.category = req.body.category;
      if (req.body.subCategory !== undefined) updateData.sub_category = req.body.subCategory;
      if (req.body.department !== undefined) updateData.department = req.body.department;
      if (req.body.gender !== undefined) updateData.gender = req.body.gender;
      if (req.body.retailPrice !== undefined) updateData.retail_price = Number(req.body.retailPrice);
      if (req.body.price !== undefined && req.body.retailPrice === undefined) updateData.retail_price = Number(req.body.price);
      if (req.body.originalPrice !== undefined) updateData.original_price = Number(req.body.originalPrice);
      if (req.body.image !== undefined) updateData.image = req.body.image;
      if (req.body.secondaryImage !== undefined) updateData.secondary_image = req.body.secondaryImage;
      if (req.body.images !== undefined) updateData.images = req.body.images;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.volume !== undefined) updateData.volume = req.body.volume;
      if (req.body.sizes !== undefined) updateData.sizes = req.body.sizes;
      if (req.body.colors !== undefined) updateData.colors = req.body.colors;
      if (req.body.details !== undefined) updateData.details = req.body.details;
      if (req.body.ingredients !== undefined) updateData.ingredients = req.body.ingredients;
      if (req.body.savoirFaire !== undefined) updateData.savoir_faire = req.body.savoirFaire;
      if (req.body.rating !== undefined) updateData.rating = Number(req.body.rating);
      if (req.body.reviewCount !== undefined) updateData.review_count = Number(req.body.reviewCount);
      if (req.body.isNew !== undefined) updateData.is_new = Boolean(req.body.isNew);
      if (req.body.isFeatured !== undefined) updateData.is_featured = Boolean(req.body.isFeatured);
      if (req.body.isBestSeller !== undefined) updateData.is_bestseller = Boolean(req.body.isBestSeller);
      if (req.body.isExclusive !== undefined) updateData.is_exclusive = Boolean(req.body.isExclusive);
      if (req.body.isActive !== undefined) updateData.is_active = req.body.isActive;
      if (req.body.supplierInventory !== undefined) updateData.supplier_inventory = req.body.supplierInventory;

      let supabaseUpdateError: any = null;
      let supabaseUpdated = false;
      try {
        const { data, error } = await supabase
          .from("products")
          .update(updateData)
          .eq("id", req.params.id)
          .select("id");
        supabaseUpdateError = error;
        supabaseUpdated = Array.isArray(data) && data.length > 0;
      } catch (error: any) {
        supabaseUpdateError = error;
      }

      let postgresUpdateError: any = null;
      let postgresUpdated = false;
      if (dbPool) {
        try {
          const result = await dbPool.query(
          `UPDATE products SET
            name = COALESCE($1, name),
            brand = COALESCE($2, brand),
            category = COALESCE($3, category),
            sub_category = COALESCE($4, sub_category),
            department = COALESCE($5, department),
            retail_price = COALESCE($6, retail_price),
            image = COALESCE($7, image),
            description = COALESCE($8, description),
            volume = COALESCE($9, volume),
            is_active = COALESCE($10, is_active)
          WHERE id = $11`,
          [
            req.body.name || null, req.body.brand || null, req.body.category || null, req.body.subCategory || null,
            req.body.department || null, req.body.retailPrice ? Number(req.body.retailPrice) : null,
            req.body.image || null, req.body.description || null, req.body.volume || null,
            req.body.isActive !== undefined ? req.body.isActive : null, req.params.id
          ]
          );
            postgresUpdated = (result.rowCount || 0) > 0;
        } catch (error: any) {
          postgresUpdateError = error;
        }
      }
        const persistenceError = dbPool
          ? postgresUpdateError || (!postgresUpdated ? new Error("Product was not found in the shared PostgreSQL catalog.") : null)
          : supabaseUpdateError || (!supabaseUpdated ? new Error("Product was not found in the shared Supabase catalog.") : null);
      if (persistenceError) throw new Error(persistenceError.message || "Product update failed.");

      if (prodIndex !== -1) {
        memoryProducts[prodIndex] = { ...memoryProducts[prodIndex], ...req.body };
      }
      try {
        fs.writeFileSync(PRODUCTS_CACHE_FILE, JSON.stringify(memoryProducts, null, 2), 'utf-8');
      } catch {}
      return res.json(prodIndex !== -1 ? memoryProducts[prodIndex] : { id: req.params.id, ...req.body });
    } catch (e: any) {
      console.error("Failed to persist product update:", e);
      return res.status(503).json({ error: e.message || "Product update could not be saved to persistent storage." });
    }
  });

  app.delete(["/api/products/:id", "/products/:id"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    try {
      await supabase.from("products").delete().eq("id", req.params.id);
      if (dbPool) {
        await dbPool.query("DELETE FROM public.products WHERE id = $1", [req.params.id]);
      }
    } catch (e: any) {
      console.warn("Product delete database sync fallback:", e.message);
    }

    memoryProducts = memoryProducts.filter(p => p.id !== req.params.id);
    try {
      fs.writeFileSync(PRODUCTS_CACHE_FILE, JSON.stringify(memoryProducts, null, 2), 'utf-8');
    } catch {}
    res.json({ success: true });
  });

  app.delete(["/api/products", "/products"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    try {
      await supabase.from("products").delete().neq("id", "none_placeholder_safe_delete");
      if (dbPool) {
        await dbPool.query("DELETE FROM public.products;");
      }
    } catch (e: any) {
      console.warn("Delete all products error:", e.message);
    }
    memoryProducts = [];
    res.json({ success: true, count: 0 });
  });

  app.post(["/api/admin/clear-catalog", "/admin/clear-catalog"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    try {
      await Promise.all([
        supabase.from("products").delete().neq("id", "none_placeholder_safe_delete"),
        supabase.from("categories").delete().neq("id", "none_placeholder_safe_delete")
      ]);
      if (dbPool) {
        await Promise.all([
          dbPool.query("DELETE FROM public.products;"),
          dbPool.query("DELETE FROM public.categories;")
        ]);
      }
    } catch (e: any) {
      console.warn("Clear catalog db warning:", e.message);
    }
    memoryProducts = [];
    memoryCategories = [];
    res.json({ success: true, message: "All products and categories cleared successfully." });
  });

  // Orders Engine (Admin Protected Global Ledger - querying canonical orders_v2 & order_items)
  app.get(["/api/orders", "/orders"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required to view full order ledger." });
    }

    if (dbPool) {
      try {
        const q = `
          SELECT 
            o.id,
            o.order_number,
            o.subtotal,
            o.discount,
            o.shipping,
            o.total,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.shipping_address_snapshot,
            o.customer_notes,
            o.created_at,
            c.full_name AS customer_name,
            c.email AS customer_email,
            c.phone AS customer_phone,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', i.id,
                  'productId', i.product_id,
                  'productName', i.product_name,
                  'sku', i.sku,
                  'unitPrice', i.unit_price,
                  'quantity', i.quantity,
                  'lineTotal', i.line_total
                )
              ) FILTER (WHERE i.id IS NOT NULL), '[]'::json
            ) AS items
          FROM public.orders_v2 o
          LEFT JOIN public.customers_v2 c ON c.id = o.customer_id
          LEFT JOIN public.order_items i ON i.order_id = o.id
          GROUP BY o.id, c.id
          ORDER BY o.created_at DESC;
        `;
        const dbRes = await dbPool.query(q);
        return res.json(dbRes.rows.map(mapCanonicalOrder));
      } catch (e: any) {
        console.warn("Database canonical orders fetch error:", e.message);
      }
    }
    res.json(memoryOrders);
  });

  app.get(["/api/orders/:id", "/orders/:id"], async (req, res) => {
    const cleanId = req.params.id.trim();
    const isAdmin = isAuthorizedAdmin(req);
    const custSession = getAuthenticatedCustomer(req);

    if (!isAdmin && !custSession) {
      return res.status(401).json({ error: "Authentication required to access order details." });
    }

    if (dbPool) {
      try {
        const q = `
          SELECT 
            o.id,
            o.order_number,
            o.subtotal,
            o.discount,
            o.shipping,
            o.total,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.shipping_address_snapshot,
            o.customer_notes,
            o.created_at,
            c.full_name AS customer_name,
            c.email AS customer_email,
            c.phone AS customer_phone,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', i.id,
                  'productId', i.product_id,
                  'productName', i.product_name,
                  'sku', i.sku,
                  'unitPrice', i.unit_price,
                  'quantity', i.quantity,
                  'lineTotal', i.line_total
                )
              ) FILTER (WHERE i.id IS NOT NULL), '[]'::json
            ) AS items
          FROM public.orders_v2 o
          LEFT JOIN public.customers_v2 c ON c.id = o.customer_id
          LEFT JOIN public.order_items i ON i.order_id = o.id
          WHERE o.id::text = $1 OR o.order_number ILIKE $1
          GROUP BY o.id, c.id
          LIMIT 1;
        `;
        const dbRes = await dbPool.query(q, [cleanId]);
        if (dbRes.rows.length > 0) {
          const order = mapCanonicalOrder(dbRes.rows[0]);
          if (!isAdmin) {
            const isOwner = custSession && (
              order.customerEmail.toLowerCase() === custSession.email.toLowerCase()
            );
            if (!isOwner) {
              return res.status(403).json({ error: "Access Denied: You do not have permission to view this order." });
            }
          }
          return res.json(order);
        }
      } catch (e: any) {
        console.warn("Database order lookup error:", e.message);
      }
    }

    const foundOrder = memoryOrders.find(o => o.id === cleanId || o.id === `ORD-${cleanId}`);
    if (!foundOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (!isAdmin) {
      const isOwner = custSession && foundOrder.customerEmail?.toLowerCase() === custSession.email.toLowerCase();
      if (!isOwner) {
        return res.status(403).json({ error: "Access Denied: You do not have permission to view this order." });
      }
    }
    return res.json(foundOrder);
  });

  // Submit Order via Secure Checkout: Atomic Single-Client PostgreSQL Transaction
  app.post(["/api/orders", "/orders"], async (req, res) => {
    const rawIdempotencyKey = req.headers["x-idempotency-key"] || req.body.idempotencyKey;
    const cleanIdemKey = rawIdempotencyKey ? String(rawIdempotencyKey).trim() : "";

    // 1. Authoritative Database-backed Idempotency Cache Check
    if (cleanIdemKey && dbPool) {
      try {
        const dbIdem = await dbPool.query(
          "SELECT response_status, response_body FROM public.idempotency_keys WHERE key = $1 LIMIT 1;",
          [cleanIdemKey]
        );
        if (dbIdem.rows.length > 0 && dbIdem.rows[0].response_status > 0) {
          res.setHeader("X-Idempotent-Replay", "true");
          return res.status(dbIdem.rows[0].response_status).json(dbIdem.rows[0].response_body);
        }
      } catch (e: any) {
        console.warn("[IDEMPOTENCY] Fast check notice:", e.message);
      }
    }

    const { customerName, customerPhone, customerEmail, deliveryAddress, city, notes, items, giftWrapping, postalCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    if (!dbPool) {
      return res.status(500).json({ error: "Database service unavailable." });
    }

    // Resolve customer identity for canonical customers_v2 linkage
    const customerSession = getAuthenticatedCustomer(req);
    const emailToUse = (customerSession?.email || customerEmail || "guest@maisonlana.test").trim().toLowerCase();
    const nameToUse = customerName || "Distinguished Client";
    const phoneToUse = customerPhone || "";

    const customerId = await ensureCustomerV2(emailToUse, nameToUse, phoneToUse);
    if (!customerId) {
      return res.status(500).json({ error: "Could not establish verified customer account record." });
    }

    // Group and consolidate items to avoid deadlock and lock rows in deterministic order
    const productQuantities = new Map<string, number>();
    for (const it of items) {
      const pId = it.productId || it.id;
      if (!pId) continue;
      const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
      productQuantities.set(pId, (productQuantities.get(pId) || 0) + qty);
    }

    if (productQuantities.size === 0) {
      return res.status(400).json({ error: "Invalid item configuration in cart." });
    }

    const sortedProductIds = Array.from(productQuantities.keys()).sort();

    // Acquire single PostgreSQL client from pool for the entire checkout transaction
    const client = await dbPool.connect();

    try {
      await client.query("BEGIN;");

      // Idempotency reservation inside transaction
      if (cleanIdemKey) {
        const idemRes = await client.query(
          `INSERT INTO public.idempotency_keys (key, order_id, response_status, response_body)
           VALUES ($1, '00000000-0000-0000-0000-000000000000', 0, '{}'::jsonb)
           ON CONFLICT (key) DO NOTHING
           RETURNING key;`,
          [cleanIdemKey]
        );
        if (idemRes.rows.length === 0) {
          const existingKey = await client.query(
            "SELECT response_status, response_body FROM public.idempotency_keys WHERE key = $1;",
            [cleanIdemKey]
          );
          if (existingKey.rows.length > 0 && existingKey.rows[0].response_status > 0) {
            await client.query("ROLLBACK;");
            res.setHeader("X-Idempotent-Replay", "true");
            return res.status(existingKey.rows[0].response_status).json(existingKey.rows[0].response_body);
          }
          throw new Error("Concurrent checkout request with this idempotency key is already in progress.");
        }
      }

      // Lock product rows using SELECT ... FOR UPDATE (ordered by ID)
      const lockedProducts = new Map<string, any>();
      for (const pId of sortedProductIds) {
        const prodRes = await client.query(
          "SELECT id, name, category, image, retail_price, supplier_inventory FROM public.products WHERE id = $1 FOR UPDATE;",
          [pId]
        );
        if (prodRes.rows.length === 0) {
          throw new Error(`Product not found: ${pId}`);
        }
        lockedProducts.set(pId, prodRes.rows[0]);
      }

      // Verify sufficient stock and compute updated supplier_inventory
      const updatedInventories = new Map<string, any[]>();
      for (const [pId, reqQty] of productQuantities.entries()) {
        const prodRow = lockedProducts.get(pId);
        const inventory: any[] = Array.isArray(prodRow.supplier_inventory) ? prodRow.supplier_inventory : [];
        const totalStock = inventory.reduce((sum: number, entry: any) => sum + (Number(entry.stock) || 0), 0);

        if (totalStock < reqQty) {
          throw new Error(`Insufficient stock for ${prodRow.name}. Requested: ${reqQty}, Available: ${totalStock}`);
        }

        let remainingToDeduct = reqQty;
        const newInventory = inventory.map((entry: any) => {
          const curStock = Number(entry.stock) || 0;
          if (remainingToDeduct <= 0 || curStock <= 0) return entry;
          const deduct = Math.min(curStock, remainingToDeduct);
          remainingToDeduct -= deduct;
          return { ...entry, stock: curStock - deduct };
        });

        updatedInventories.set(pId, newInventory);
      }

      // Calculate financial amounts using integer cents
      let subtotalCents = 0;
      const validatedItems: any[] = [];

      for (const it of items) {
        const pId = it.productId || it.id;
        const prodRow = lockedProducts.get(pId);
        const unitPriceCents = Math.round(Number(prodRow.retail_price) * 100);
        const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
        const lineTotalCents = unitPriceCents * qty;
        subtotalCents += lineTotalCents;

        validatedItems.push({
          productId: pId,
          productName: prodRow.name,
          category: prodRow.category,
          sku: it.sku || `SKU-${pId.substring(0, 8).toUpperCase()}`,
          unitPrice: (unitPriceCents / 100).toFixed(2),
          quantity: qty,
          lineTotal: (lineTotalCents / 100).toFixed(2),
          image: prodRow.image,
          selectedSize: it.size || it.selectedSize || "",
          selectedColor: it.color || it.selectedColor || ""
        });
      }

      // Discount calculation (integer cents)
      let discountCents = 0;
      if (req.body.promoCode) {
        const promoRes = await client.query(
          "SELECT discount_percent, discount_amount, is_active, expires_at FROM public.promo_codes WHERE code = $1 LIMIT 1;",
          [String(req.body.promoCode).trim().toUpperCase()]
        );
        if (promoRes.rows.length > 0 && promoRes.rows[0].is_active) {
          const promo = promoRes.rows[0];
          if (!promo.expires_at || new Date(promo.expires_at).getTime() > Date.now()) {
            if (promo.discount_percent) {
              discountCents = Math.round(subtotalCents * (Number(promo.discount_percent) / 100));
            } else if (promo.discount_amount) {
              discountCents = Math.round(Number(promo.discount_amount) * 100);
            }
          }
        }
      }
      discountCents = Math.min(subtotalCents, Math.max(0, discountCents));

      const shippingCents = subtotalCents >= 20000 ? 0 : 2500; // Complimentary delivery over $200
      const totalCents = subtotalCents - discountCents + shippingCents;

      const subtotalStr = (subtotalCents / 100).toFixed(2);
      const discountStr = (discountCents / 100).toFixed(2);
      const shippingStr = (shippingCents / 100).toFixed(2);
      const totalStr = (totalCents / 100).toFixed(2);

      // Order Reference
      const orderNum = crypto.randomInt(100000, 999999);
      const orderNumber = `LANA-${orderNum}`;

      const addressSnapshot = {
        fullName: nameToUse,
        email: emailToUse,
        phone: phoneToUse,
        address: deliveryAddress || "Standard Delivery",
        city: city || "Paris",
        postalCode: postalCode || "",
        country: req.body.country || "France"
      };

      // Create canonical orders_v2 record
      const orderInsertRes = await client.query(
        `INSERT INTO public.orders_v2 (
          customer_id, order_number, subtotal, discount, shipping, total,
          payment_method, payment_status, order_status, shipping_address_snapshot, customer_notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, order_number, created_at;`,
        [
          customerId,
          orderNumber,
          subtotalStr,
          discountStr,
          shippingStr,
          totalStr,
          "Manual Payment",
          "pending",
          "Pending",
          JSON.stringify(addressSnapshot),
          notes || null
        ]
      );
      const createdOrderId = orderInsertRes.rows[0].id;

      // Create canonical order_items records
      for (const it of validatedItems) {
        await client.query(
          `INSERT INTO public.order_items (
            order_id, product_id, product_name, sku, unit_price, quantity, line_total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [
            createdOrderId,
            it.productId,
            it.productName,
            it.sku,
            it.unitPrice,
            it.quantity,
            it.lineTotal
          ]
        );
      }

      // Apply inventory decrement directly on products.supplier_inventory
      for (const [pId, newInv] of updatedInventories.entries()) {
        await client.query(
          "UPDATE public.products SET supplier_inventory = $1 WHERE id = $2;",
          [JSON.stringify(newInv), pId]
        );
      }

      // Format WhatsApp Concierge Link
      const itemListText = validatedItems
        .map(i => `• ${i.productName} (${i.quantity}x) — $${i.lineTotal}`)
        .join("\n");
      const whatsappMessage = `Hi Maison Lana Concierge! I'm ${nameToUse}. I've registered order *#${orderNumber}*.\n\n*Order Summary:*\n${itemListText}\n\n*Total Due:* $${totalStr}\n*Payment Status:* PENDING\n*Payment Method:* Manual Payment\n*Delivery City:* ${city || "Paris"}\n*Address:* ${deliveryAddress || "Standard Delivery"}\n\nI am contacting you to complete my manual payment. Please provide banking details.`;
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const targetWhatsappRaw =
        memoryHomepageSettings?.whatsappNumber ||
        memoryHomepageSettings?.contactInfo?.whatsappNumber ||
        memoryHomepageSettings?.contactInfo?.contactPhone ||
        "";
      const cleanTargetPhone = String(targetWhatsappRaw).replace(/[^0-9]/g, "");
      const whatsappUrl = cleanTargetPhone ? `https://wa.me/${cleanTargetPhone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;

      // Canonical Order Object matching frontend interface
      const canonicalOrder: Order = {
        id: orderNumber,
        customerName: nameToUse,
        customerEmail: emailToUse,
        customerPhone: phoneToUse,
        deliveryAddress: addressSnapshot.address,
        city: addressSnapshot.city,
        postalCode: addressSnapshot.postalCode,
        paymentMethod: "Manual Payment",
        giftWrapping: !!giftWrapping,
        notes: notes || "",
        items: validatedItems.map(it => ({
          productId: it.productId,
          productName: it.productName,
          category: it.category,
          price: Number(it.unitPrice),
          quantity: it.quantity,
          image: it.image,
          selectedSize: it.selectedSize,
          selectedColor: it.selectedColor,
          selectedStoreId: ""
        })),
        subtotal: Number(subtotalStr),
        shippingFee: Number(shippingStr),
        totalPrice: Number(totalStr),
        status: "Pending",
        paymentStatus: "Pending",
        createdAt: orderInsertRes.rows[0].created_at,
        assignedStoreIds: {}
      };

      // Keep fast memory store in sync
      memoryOrders.unshift(canonicalOrder);

      const responsePayload = {
        success: true,
        orderId: orderNumber,
        orderNumber: orderNumber,
        order: canonicalOrder,
        whatsappUrl
      };

      // Record idempotency result in idempotency_keys
      if (cleanIdemKey) {
        await client.query(
          `INSERT INTO public.idempotency_keys (key, order_id, response_status, response_body)
           VALUES ($1, $2, 201, $3)
           ON CONFLICT (key) DO UPDATE
           SET order_id = EXCLUDED.order_id,
               response_status = EXCLUDED.response_status,
               response_body = EXCLUDED.response_body;`,
          [cleanIdemKey, createdOrderId, JSON.stringify(responsePayload)]
        );
        processedIdempotencyKeys.set(cleanIdemKey, responsePayload);
      }

      // Commit transaction
      await client.query("COMMIT;");
      console.log(`[ORDER] Canonical order ${orderNumber} (${createdOrderId}) successfully committed.`);
      return res.status(201).json(responsePayload);

    } catch (err: any) {
      await client.query("ROLLBACK;");
      console.error("[CHECKOUT TRANSACTION ROLLBACK]", err.message);
      return res.status(400).json({ error: err.message || "Checkout transaction failed." });
    } finally {
      client.release();
    }
  });

  // Update order status (Admin Protected with strict state machine)
  app.put(["/api/orders/:id", "/orders/:id"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin credentials required." });
    }

    const cleanId = req.params.id.trim();
    const { status, paymentStatus, adminNotes } = req.body;

    if (dbPool) {
      try {
        const updateRes = await dbPool.query(
          `UPDATE public.orders_v2
           SET order_status = COALESCE($1, order_status),
               payment_status = COALESCE($2, payment_status),
               admin_notes = COALESCE($3, admin_notes),
               updated_at = NOW()
           WHERE id::text = $4 OR order_number ILIKE $4
           RETURNING *;`,
          [status || null, paymentStatus || null, adminNotes || null, cleanId]
        );
        if (updateRes.rows.length > 0) {
          const updatedRow = updateRes.rows[0];
          const memIdx = memoryOrders.findIndex(o => o.id === cleanId || o.id === updatedRow.order_number);
          if (memIdx !== -1) {
            if (status) memoryOrders[memIdx].status = status;
            if (paymentStatus) memoryOrders[memIdx].paymentStatus = paymentStatus;
          }
          return res.json({ success: true, order: mapCanonicalOrder(updatedRow) });
        }
      } catch (e: any) {
        console.warn("Database order update error:", e.message);
      }
    }

    const memOrder = memoryOrders.find(o => o.id === cleanId || o.id === `ORD-${cleanId}`);
    if (memOrder) {
      if (status) memOrder.status = status;
      if (paymentStatus) memOrder.paymentStatus = paymentStatus;
      return res.json({ success: true, order: memOrder });
    }

    return res.status(404).json({ error: "Order not found" });
  });

  // Admin Login Endpoint (Stateless HMAC Token Issuance with Cryptographic Integrity)
  app.post(["/api/admin/login", "/admin/login"], async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || "lanamarketplacehq@gmail.com").trim().toLowerCase();
    const configuredAdminPass = process.env.ADMIN_PASSWORD;
    if (!SESSION_SECRET) {
      return res.status(503).json({ error: "Admin authentication is not configured. Set ADMIN_SESSION_SECRET." });
    }
    if (!dbPool && !configuredAdminPass) {
      return res.status(503).json({ error: "Admin login is not configured. Set ADMIN_PASSWORD." });
    }

    let isAuthenticated = false;

    try {
      if (dbPool) {
        const dbRes = await dbPool.query("SELECT password_hash FROM admin_users WHERE email = $1 LIMIT 1", [cleanEmail]);
        if (dbRes.rows.length > 0) {
          isAuthenticated = await bcrypt.compare(cleanPassword, dbRes.rows[0].password_hash);
        }
      }
    } catch (e) {
      console.warn("Admin DB login query note:", e);
    }

    // Direct environment password check fallback
    if (!isAuthenticated && cleanEmail === configuredAdminEmail) {
      if (configuredAdminPass && cleanPassword === configuredAdminPass) isAuthenticated = true;
    }

    if (isAuthenticated) {
      const token = createSignedToken({
        role: "admin",
        email: cleanEmail,
        exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days valid
      });

      // Keep in-memory copy for legacy compatibility
      activeAdminSessions.set(token, {
        email: cleanEmail,
        expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7
      });

      console.log(`[AUTH] Admin session authenticated for ${cleanEmail}.`);
      logAdminAction(cleanEmail, "ADMIN_LOGIN_SUCCESS", { timestamp: new Date().toISOString() });
      return res.json({ success: true, token, email: cleanEmail });
    }

    logAdminAction(cleanEmail, "ADMIN_LOGIN_FAILED", { error: "Invalid credentials" });
    res.status(401).json({ error: "Invalid email or password. Please verify your administrative credentials." });
  });

  // Admin Logout Endpoint
  app.post(["/api/admin/logout", "/admin/logout"], (req, res) => {
    const authHeader = req.headers["authorization"] || "";
    const adminKey = req.headers["x-admin-key"] || "";
    let token = "";

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else {
      token = String(adminKey).trim();
    }

    if (token && activeAdminSessions.has(token)) {
      const session = activeAdminSessions.get(token);
      activeAdminSessions.delete(token);
      logAdminAction(session?.email || "unknown", "ADMIN_LOGOUT", { success: true });
    }

    res.json({ success: true, message: "Admin session invalidated successfully." });
  });

  // Helper to verify Admin authorization header (Supports both stateless signed tokens & legacy sessions)
  function isAuthorizedAdmin(req: express.Request): boolean {
    const authHeader = req.headers["authorization"] || "";
    const adminKey = req.headers["x-admin-key"] || "";
    
    let token = "";
    // 1. Check Authorization: Bearer <token>
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    } else if (adminKey) {
      token = String(adminKey).trim();
    }

    if (!token) return false;

    // 1. Check stateless cryptographic signed token (Serverless Lambdas)
    const verified = verifySignedToken(token);
    if (verified && verified.role === "admin") {
      return true;
    }

    // 2. Check in-memory stateful session table (Local dev)
    const session = activeAdminSessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      return true;
    }

    return false;
  }

  // Admin Session Verification Endpoint
  app.get(["/api/admin/verify", "/admin/verify"], (req, res) => {
    if (isAuthorizedAdmin(req)) {
      const authHeader = req.headers["authorization"] || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : "";
      const verified = verifySignedToken(token);
      const email = verified?.email || process.env.ADMIN_EMAIL || "lanamarketplacehq@gmail.com";
      return res.json({ authenticated: true, email });
    }
    return res.status(401).json({ authenticated: false, error: "Session expired or invalid" });
  });

  // Admin Protected Customers List (Passwords completely omitted for compliance)
  app.get(["/api/customers", "/customers"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required to view customer vault." });
    }

    let allCustomers = [...memoryCustomers];

    try {
      const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        const dbCustomers = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone || "",
          memberTier: c.member_tier || "Privilège",
          memberSince: c.member_since || "2026",
          createdAt: c.created_at
        }));

        // Merge memory and DB customers, removing duplicates (favoring database entries)
        const memoryEmails = new Set(memoryCustomers.map(c => c.email.toLowerCase()));
        const uniqueDb = dbCustomers.filter(c => !memoryEmails.has(c.email.toLowerCase()));
        allCustomers = [...memoryCustomers, ...uniqueDb];
      }
    } catch (e) {
      console.warn("Supabase customers fetch failed, using fallback:", e);
    }

    // Sanitize and sort by registration date descending
    const sanitizedCustomers = allCustomers.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || "",
      memberTier: c.memberTier || c.member_tier || "Privilège",
      memberSince: c.memberSince || c.member_since || "2026",
      createdAt: c.createdAt || c.created_at
    }));

    sanitizedCustomers.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json(sanitizedCustomers);
  });

  // Helper to retrieve and verify customer session from token (Serverless Resilient)
  function getAuthenticatedCustomer(req: express.Request) {
    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();

      // 1. Check stateless cryptographic signed token
      const verified = verifySignedToken(token);
      if (verified && (verified.role === "customer" || verified.customerId)) {
        return {
          customerId: verified.customerId,
          email: verified.email,
          expiresAt: verified.exp || Date.now() + 1000 * 60 * 60 * 24 * 30
        };
      }

      // 2. Check in-memory store
      const session = activeCustomerSessions.get(token);
      if (session && session.expiresAt > Date.now()) {
        return session;
      }
    }
    return null;
  }

  // Get current logged-in customer profile
  app.get(["/api/customers/me", "/customers/me"], async (req, res) => {
    const session = getAuthenticatedCustomer(req);
    if (!session) {
      return res.status(401).json({ error: "Access Denied: Unauthenticated client session." });
    }

    let profile: any = null;
    try {
      const { data } = await supabase.from("customers").select("*").eq("id", session.customerId).limit(1).maybeSingle();
      if (data) {
        profile = {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          memberTier: data.member_tier || "Privilège",
          memberSince: data.member_since || "2026",
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.warn("Supabase fetch profile failed:", e);
    }

    if (!profile) {
      const mem = memoryCustomers.find(c => c.id === session.customerId);
      if (mem) {
        profile = {
          id: mem.id,
          name: mem.name,
          email: mem.email,
          phone: mem.phone,
          memberTier: mem.memberTier || "Privilège",
          memberSince: mem.memberSince || "2026",
          createdAt: mem.createdAt
        };
      }
    }

    if (!profile) {
      return res.status(404).json({ error: "Client profile not found." });
    }

    res.json(profile);
  });

  // Get order history for authenticated customer only (Isolated Personal Data Access via orders_v2)
  app.get(["/api/customers/me/orders", "/customers/me/orders"], async (req, res) => {
    const session = getAuthenticatedCustomer(req);
    if (!session) {
      return res.status(401).json({ error: "Access Denied: Unauthenticated client session." });
    }

    if (dbPool) {
      try {
        const q = `
          SELECT 
            o.id,
            o.order_number,
            o.subtotal,
            o.discount,
            o.shipping,
            o.total,
            o.payment_method,
            o.payment_status,
            o.order_status,
            o.shipping_address_snapshot,
            o.customer_notes,
            o.created_at,
            c.full_name AS customer_name,
            c.email AS customer_email,
            c.phone AS customer_phone,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', i.id,
                  'productId', i.product_id,
                  'productName', i.product_name,
                  'sku', i.sku,
                  'unitPrice', i.unit_price,
                  'quantity', i.quantity,
                  'lineTotal', i.line_total
                )
              ) FILTER (WHERE i.id IS NOT NULL), '[]'::json
            ) AS items
          FROM public.orders_v2 o
          JOIN public.customers_v2 c ON c.id = o.customer_id
          LEFT JOIN public.order_items i ON i.order_id = o.id
          WHERE c.email = $1 OR c.id::text = $2
          GROUP BY o.id, c.id
          ORDER BY o.created_at DESC;
        `;
        const dbRes = await dbPool.query(q, [session.email.toLowerCase(), session.customerId]);
        if (dbRes.rows.length > 0) {
          return res.json(dbRes.rows.map(mapCanonicalOrder));
        }
      } catch (e: any) {
        console.warn("Database customer orders query fallback:", e.message);
      }
    }

    const memOrders = memoryOrders.filter(
      o => o.customerEmail?.toLowerCase() === session.email.toLowerCase()
    );
    res.json(memOrders);
  });

  // Customer Login Endpoint (Isolated Personal Data Access with secure password hash checking)
  app.post(["/api/customers/login", "/customers/login"], async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    let foundCustomer: any = null;

    try {
      const { data } = await supabase.from("customers").select("*").eq("email", cleanEmail).limit(1).maybeSingle();
      if (data) {
        let isMatch = false;
        // Verify hashed vs plain password
        if (data.password.startsWith("$2a$") || data.password.startsWith("$2b$")) {
          isMatch = await bcrypt.compare(password, data.password);
        } else {
          // Legacy plaintext fallback
          isMatch = (data.password === password || data.password_plain === password);
          if (isMatch) {
            // Upgrade legacy password to hash securely on-the-fly!
            try {
              const upgradedHash = await bcrypt.hash(password, 10);
              await supabase.from("customers").update({
                password: upgradedHash,
                password_plain: null
              }).eq("id", data.id);
              console.log(`Successfully upgraded customer ${data.email} to modern secure bcrypt hashing.`);
            } catch (upgradeErr) {
              console.error("Failed to upgrade legacy customer password:", upgradeErr);
            }
          }
        }

        if (isMatch) {
          foundCustomer = {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phone,
            memberTier: data.member_tier || "Privilège",
            memberSince: data.member_since || "2026",
            createdAt: data.created_at
          };
        }
      }
    } catch (e) {
      console.warn("Supabase login check failed, checking fallback:", e);
    }

    if (!foundCustomer) {
      const mem = memoryCustomers.find(c => c.email.toLowerCase() === cleanEmail);
      if (mem) {
        let isMatch = false;
        if (mem.password.startsWith("$2a$") || mem.password.startsWith("$2b$")) {
          isMatch = await bcrypt.compare(password, mem.password);
        } else {
          isMatch = mem.password === password;
          if (isMatch) {
            // Secure the memory fallback too
            mem.password = await bcrypt.hash(password, 10);
          }
        }

        if (isMatch) {
          foundCustomer = {
            id: mem.id,
            name: mem.name,
            email: mem.email,
            phone: mem.phone,
            memberTier: mem.memberTier || "Privilège",
            memberSince: mem.memberSince || "2026",
            createdAt: mem.createdAt
          };
        }
      }
    }

    if (!foundCustomer) {
      return res.status(401).json({ error: "Invalid email or password. Please verify your credentials." });
    }

    // Generate secure stateless customer token with cryptographic signature
    const token = createSignedToken({
      role: "customer",
      customerId: foundCustomer.id,
      email: foundCustomer.email,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
    });
    activeCustomerSessions.set(token, {
      customerId: foundCustomer.id,
      email: foundCustomer.email,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30
    });

    res.json({ success: true, token, customer: foundCustomer });
  });

  app.post(["/api/customers/register", "/customers/register"], async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Hash the customer password using cryptographically secure bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newCust = {
      id: `cust-${Date.now()}`,
      name: name || cleanEmail.split("@")[0],
      email: cleanEmail,
      password: hashedPassword,
      phone: phone || "",
      memberTier: "Privilège",
      memberSince: new Date().getFullYear().toString(),
      createdAt: new Date().toISOString()
    };

    // Ensure user in Supabase auth and canonical customers_v2
    if (dbPool) {
      const v2Id = await ensureCustomerV2(cleanEmail, newCust.name, newCust.phone);
      if (v2Id) {
        newCust.id = v2Id;
      }
    }

    try {
      await supabase.from("customers").insert({
        id: newCust.id,
        name: newCust.name,
        email: newCust.email,
        password: newCust.password,
        password_plain: null, // Always write null to completely clear any plaintext password representation
        phone: newCust.phone,
        member_tier: newCust.memberTier,
        member_since: newCust.memberSince,
        created_at: newCust.createdAt
      });
      console.log(`Registered customer ${newCust.email} saved securely (hashed) to Supabase.`);
    } catch (e) {
      console.warn("Supabase customer register note:", e);
    }

    memoryCustomers.unshift(newCust);

    // Sanitize response - NEVER send passwords or hashes back to client state
    const sanitizedCustomer = {
      id: newCust.id,
      name: newCust.name,
      email: newCust.email,
      phone: newCust.phone,
      memberTier: newCust.memberTier,
      memberSince: newCust.memberSince,
      createdAt: newCust.createdAt
    };

    // Generate secure stateless customer token with cryptographic signature
    const token = createSignedToken({
      role: "customer",
      customerId: newCust.id,
      email: newCust.email,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
    });
    activeCustomerSessions.set(token, {
      customerId: newCust.id,
      email: newCust.email,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30
    });

    res.status(201).json({ success: true, token, customer: sanitizedCustomer });
  });

  // Customer Logout Endpoint
  app.post(["/api/customers/logout", "/customers/logout"], (req, res) => {
    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      activeCustomerSessions.delete(token);
    }
    res.json({ success: true, message: "Client session invalidated successfully." });
  });

  // Stateful password reset token store
  const activeResetTokens = new Map<string, { email: string; expiresAt: number }>();

  // Enumeration-resistant Forgot Password Endpoint
  app.post(["/api/customers/forgot-password", "/customers/forgot-password"], async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify if account exists (checks both Supabase and memory fallback)
    let exists = false;
    try {
      const { data } = await supabase.from("customers").select("id").eq("email", cleanEmail).limit(1).maybeSingle();
      if (data) exists = true;
    } catch (e) {
      exists = memoryCustomers.some(c => c.email.toLowerCase() === cleanEmail);
    }

    if (exists) {
      // Create cryptographically robust single-use token (expires in 1 hour) using cryptographic randomness
      const resetToken = "reset_" + crypto.randomBytes(32).toString("hex");
      activeResetTokens.set(resetToken, {
        email: cleanEmail,
        expiresAt: Date.now() + 1000 * 60 * 60 // 1 hour
      });

      console.log(`[RESET] Password reset token generated for ${cleanEmail}: ${resetToken}`);
    }

    // Always return success to prevent account enumeration / username discovery
    res.json({
      success: true,
      message: "If an account exists with this email address, password reset instructions have been dispatched."
    });
  });

  // Token-validated Reset Password Endpoint (single-use, expires, secure bcrypt hashing)
  app.post(["/api/customers/reset-password", "/customers/reset-password"], async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    const session = activeResetTokens.get(token);
    if (!session || session.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired reset token. Please request a new link." });
    }

    // Token is single-use, delete it immediately
    activeResetTokens.delete(token);

    // Cryptographically secure hashing
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
      // Update in Supabase
      const { error } = await supabase
        .from("customers")
        .update({ password: hashedPassword, password_plain: null })
        .eq("email", session.email);

      if (error) throw error;
      console.log(`[RESET] Successfully reset password via token for ${session.email} in Supabase.`);
    } catch (e) {
      console.warn("Supabase password reset failed, updating in-memory fallback:", e);
    }

    // Update in memory fallback
    const mem = memoryCustomers.find(c => c.email.toLowerCase() === session.email.toLowerCase());
    if (mem) {
      mem.password = hashedPassword;
    }

    res.json({ success: true, message: "Your password has been successfully updated." });
  });

  // Product Reviews API
  app.get(["/api/reviews/:productId", "/reviews/:productId"], async (req, res) => {
    const { productId } = req.params;
    try {
      const { data, error } = await supabase.from("reviews").select("*").eq("product_id", productId).order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json(data.map((r: any) => ({
          id: r.id,
          productId: r.product_id,
          authorName: r.author_name,
          rating: Number(r.rating),
          title: r.title,
          comment: r.comment,
          verifiedPurchase: r.verified_purchase !== false,
          createdAt: r.created_at
        })));
      }
    } catch (e) {
      console.warn("Supabase reviews fetch failed, using fallback:", e);
    }

    const filtered = memoryReviews.filter(r => r.productId === productId);
    res.json(filtered);
  });

  app.post(["/api/reviews", "/reviews"], async (req, res) => {
    const { productId, authorName, rating, title, comment } = req.body;
    if (!productId || !comment) {
      return res.status(400).json({ error: "Product ID and comment required" });
    }

    const newRev = {
      id: `rev-${Date.now()}`,
      productId,
      authorName: authorName || "Anonymous Patron",
      rating: Number(rating) || 5,
      title: title || "Exquisite Experience",
      comment,
      verifiedPurchase: true,
      createdAt: new Date().toISOString()
    };

    try {
      await supabase.from("reviews").insert({
        id: newRev.id,
        product_id: newRev.productId,
        author_name: newRev.authorName,
        rating: newRev.rating,
        title: newRev.title,
        comment: newRev.comment,
        verified_purchase: newRev.verifiedPurchase,
        created_at: newRev.createdAt
      });
      console.log(`New review for ${productId} saved to Supabase reviews table`);
    } catch (e) {
      console.warn("Supabase review insert fallback:", e);
    }

    memoryReviews.unshift(newRev);
    res.status(201).json(newRev);
  });

  // --- PROMO CODES ENGINE ---
  app.get(["/api/promo-codes", "/promo-codes"], async (req, res) => {
    try {
      const dbRes = await dbPool.query("SELECT * FROM promo_codes ORDER BY created_at DESC");
      res.json(dbRes.rows);
    } catch (err: any) {
      console.warn("Failed to fetch promo codes from DB:", err.message);
      res.json([
        { code: "LANA10", discount_percent: 10, discount_amount: 0, min_spend: 0, is_active: true },
        { code: "VIP2026", discount_percent: 15, discount_amount: 0, min_spend: 100, is_active: true },
        { code: "WELCOME50", discount_percent: 0, discount_amount: 50, min_spend: 250, is_active: true }
      ]);
    }
  });

  app.post(["/api/promo-codes/validate", "/promo-codes/validate"], async (req, res) => {
    const { code, subtotal } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, error: "Please provide a valid promo code." });
    }

    const cleanCode = code.trim().toUpperCase();
    const orderSubtotal = Number(subtotal) || 0;

    try {
      const dbRes = await dbPool.query("SELECT * FROM promo_codes WHERE UPPER(code) = $1", [cleanCode]);
      let promo = dbRes.rows[0];

      if (!promo) {
        // In-memory fallback
        if (cleanCode === "LANA10") {
          promo = { code: "LANA10", discount_percent: 10, discount_amount: 0, min_spend: 0, is_active: true };
        } else if (cleanCode === "VIP2026") {
          promo = { code: "VIP2026", discount_percent: 15, discount_amount: 0, min_spend: 100, is_active: true };
        } else if (cleanCode === "WELCOME50") {
          promo = { code: "WELCOME50", discount_percent: 0, discount_amount: 50, min_spend: 250, is_active: true };
        }
      }

      if (!promo || !promo.is_active) {
        return res.status(404).json({ valid: false, error: "Invalid or expired promo code." });
      }

      if (promo.min_spend && orderSubtotal < Number(promo.min_spend)) {
        return res.status(400).json({
          valid: false,
          error: `This promo code requires a minimum order of $${Number(promo.min_spend)} USD.`
        });
      }

      let calculatedDiscount = 0;
      if (Number(promo.discount_percent) > 0) {
        calculatedDiscount = (orderSubtotal * Number(promo.discount_percent)) / 100;
      } else if (Number(promo.discount_amount) > 0) {
        calculatedDiscount = Math.min(orderSubtotal, Number(promo.discount_amount));
      }

      return res.json({
        valid: true,
        code: promo.code,
        discountPercent: Number(promo.discount_percent) || 0,
        discountAmount: Number(promo.discount_amount) || 0,
        calculatedDiscount: Math.round(calculatedDiscount * 100) / 100,
        message: Number(promo.discount_percent) > 0 
          ? `${Number(promo.discount_percent)}% discount applied successfully!` 
          : `$${Number(promo.discount_amount)} discount applied successfully!`
      });
    } catch (err: any) {
      console.error("Promo validation error:", err);
      return res.status(500).json({ valid: false, error: "Failed to validate promo code." });
    }
  });

  app.post(["/api/promo-codes", "/promo-codes"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }

    const { code, discountPercent, discountAmount, minSpend, isActive } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Promo code name is required." });
    }

    const cleanCode = code.trim().toUpperCase();
    try {
      await dbPool.query(
        `INSERT INTO promo_codes (code, discount_percent, discount_amount, min_spend, is_active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO UPDATE SET 
           discount_percent = $2, 
           discount_amount = $3, 
           min_spend = $4, 
           is_active = $5`,
        [cleanCode, Number(discountPercent) || 0, Number(discountAmount) || 0, Number(minSpend) || 0, isActive !== false]
      );
      res.status(201).json({ success: true, code: cleanCode });
    } catch (err: any) {
      console.error("Failed to save promo code:", err);
      res.status(500).json({ error: "Failed to save promo code to database." });
    }
  });

  app.delete(["/api/promo-codes/:code", "/promo-codes/:code"], async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }

    const cleanCode = req.params.code.trim().toUpperCase();
    try {
      await dbPool.query("DELETE FROM promo_codes WHERE UPPER(code) = $1", [cleanCode]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Failed to delete promo code:", err);
      res.status(500).json({ error: "Failed to delete promo code." });
    }
  });

  // Live Supabase status verification endpoint
  app.get(["/api/supabase/status", "/supabase/status"], async (req, res) => {
    try {
      const { count: productCount, error: pError } = await supabase.from("products").select("*", { count: "exact", head: true });
      const { count: orderCount, error: oError } = await supabase.from("orders_v2").select("*", { count: "exact", head: true });
      const { count: storeCount, error: sError } = await supabase.from("stores").select("*", { count: "exact", head: true });

      if (pError || oError || sError) {
        return res.json({
          connected: false,
          error: pError || oError || sError,
          supabaseUrl: SUPABASE_URL
        });
      }

      res.json({
        connected: true,
        projectUrl: SUPABASE_URL,
        tables: {
          products: productCount,
          orders: orderCount,
          stores: storeCount
        }
      });
    } catch (err: any) {
      res.status(500).json({ connected: false, error: err.message });
    }
  });

  // Health check endpoints (Supports both /api/health and /health)
  app.get(["/api/health", "/health"], (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  async function startDevServer() {
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
      try {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
          server: { 
            middlewareMode: true,
            hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
          },
          appType: "spa",
        });
        app.use(vite.middlewares);
      } catch (e) {
        console.warn("Vite dev server init skipped:", e);
      }
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    // Only bind port in local development, never in Vercel Serverless environment
    if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
      const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });

      server.on("error", (err: any) => {
        console.error("Server listen error:", err);
      });
    }
  }

  // Only start local dev server when NOT running inside Vercel Serverless
  if (!process.env.VERCEL) {
    startDevServer();
  }

  export default app;
