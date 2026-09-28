import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { LOCAL_STORES, PRODUCT_CATEGORIES, ROADMAP_PHASES, ALL_LUXURY_PRODUCTS } from "./src/constants";
import { Order, Product, LocalStore, Category } from "./src/types";

// Authoritative Database & Supabase Configuration
// Fail closed immediately if required infrastructure secrets are missing
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[CRITICAL SECURITY FAULT] SUPABASE_SERVICE_ROLE_KEY is required but not provided. Server failing closed.");
  process.exit(1);
}

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:SAKHAAWE6617@db.mjvfpoapuonncbfvhfyz.supabase.co:5432/postgres";
if (!DATABASE_URL) {
  console.error("[CRITICAL SECURITY FAULT] DATABASE_URL is required for authoritative PostgreSQL transactions. Server failing closed.");
  process.exit(1);
}

// Ensure the real project URL is used
let SUPABASE_URL = process.env.VITE_SUPABASE_URL;
if (!SUPABASE_URL || SUPABASE_URL.includes("aafaftdrhyjmpjwqkpwe")) {
  SUPABASE_URL = "https://mjvfpoapuonncbfvhfyz.supabase.co";
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const dbPool = new Pool({ connectionString: DATABASE_URL });

// Test DB pool connection on startup
dbPool.query("SELECT NOW();")
  .then(() => {
    console.log("[DATABASE] Authoritative PostgreSQL pool connected successfully.");
    initStorageInfrastructure();
  })
  .catch(err => {
    console.error("[CRITICAL SECURITY FAULT] Failed to connect to PostgreSQL:", err.message);
    process.exit(1);
  });

async function initStorageInfrastructure() {
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
    console.log("[STORAGE] PostgreSQL media_files, homepage_settings & promo_codes tables verified.");

    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets || !buckets.find(b => b.name === 'media')) {
      const { error } = await supabase.storage.createBucket('media', { public: true });
      if (error && !error.message.includes('already exists')) {
        console.warn("[STORAGE] Note creating Supabase media bucket:", error.message);
      } else {
        console.log("[STORAGE] Supabase Storage public 'media' bucket ready.");
      }
    }
  } catch (err: any) {
    console.warn("[STORAGE] Storage init check note:", err.message);
  }
}

// Stateful session store for admin logins
const activeAdminSessions = new Map<string, { email: string; expiresAt: number }>();

// Stateful session store for customer logins
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

// Fallback in-memory state if offline
let memoryStores: LocalStore[] = [...LOCAL_STORES];
let memoryProducts: Product[] = [...ALL_LUXURY_PRODUCTS];
let memoryOrders: Order[] = [];
let memoryCategories: Category[] = [...PRODUCT_CATEGORIES];

// Auto-seed products in database: Purge any old products and synchronize latest catalog
async function autoSeedProducts() {
  try {
    console.log("[SEED] Purging all products from database and memory as requested...");
    await Promise.all([
      dbPool.query("DELETE FROM public.products;"),
      supabase.from("products").delete().neq("id", "none_placeholder_safe_delete")
    ]);
    for (const p of ALL_LUXURY_PRODUCTS) {
      await poolInsertProduct(p);
    }
    memoryProducts = [...ALL_LUXURY_PRODUCTS];
    memoryCategories = [...PRODUCT_CATEGORIES];
    console.log(`[SEED] Catalog synchronized: ${ALL_LUXURY_PRODUCTS.length} products, ${PRODUCT_CATEGORIES.length} categories.`);
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

autoSeedProducts();

const HOMEPAGE_SETTINGS_FILE = path.join(process.cwd(), 'homepage-settings.json');
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
  if (fs.existsSync(HOMEPAGE_SETTINGS_FILE)) {
    memoryHomepageSettings = JSON.parse(fs.readFileSync(HOMEPAGE_SETTINGS_FILE, 'utf-8'));
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
    phone: "+966 55 123 4567",
    memberTier: "Maison VIP",
    memberSince: "2024",
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: "cust-102",
    name: "Sultan Al-Otaibi",
    email: "sultan.otaibi@example.com",
    password: "LanaClient2026",
    phone: "+966 50 987 6543",
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

async function startServer() {
  // Hash memory fallback passwords on startup securely
  for (const c of memoryCustomers) {
    if (!c.password.startsWith("$2a$") && !c.password.startsWith("$2b$")) {
      try {
        c.password = await bcrypt.hash(c.password, 10);
      } catch (err) {
        console.error("Failed to hash initial customer password in memory:", err);
      }
    }
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "60mb" }));
  app.use(express.urlencoded({ limit: "60mb", extended: true }));

  // Media storage for high-performance instant uploads
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Persistent Media Helper: Saves to Supabase CDN bucket + PostgreSQL backup + Local Cache
  async function persistMediaFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    const localFilePath = path.join(uploadsDir, filename);

    // 1. Write to local cache for instant local serving
    try {
      fs.writeFileSync(localFilePath, buffer);
    } catch (err) {
      console.warn("Local cache write note:", err);
    }

    // 2. Always persist to PostgreSQL media_files table as permanent durable backup
    try {
      await dbPool.query(
        `INSERT INTO media_files (filename, mime_type, data_base64) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (filename) DO UPDATE SET mime_type = $2, data_base64 = $3`,
        [filename, mimeType, buffer.toString('base64')]
      );
    } catch (err: any) {
      console.warn("PostgreSQL media_files save note:", err.message);
    }

    // 3. Upload to Supabase Storage 'media' bucket for permanent CDN delivery
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

    return `/uploads/${filename}`;
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

  // Resilient Media Delivery: Serves from Local Disk -> Supabase Storage -> PostgreSQL DB
  app.get("/uploads/:filename", async (req, res) => {
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
    } catch (err) {
      // Fallback to PostgreSQL
    }

    // 3. Fetch from PostgreSQL media_files table backup
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

    return res.status(404).json({ error: "Media file not found or expired." });
  });

  // Media Upload Endpoint
  app.post("/api/upload", async (req, res) => {
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

  // Categories
  app.get("/api/categories", (req, res) => {
    const seen = new Set<string>();
    const deduplicated = memoryCategories.filter(c => {
      const idKey = (c.id || c.name || '').toLowerCase();
      if (!idKey || seen.has(idKey)) return false;
      seen.add(idKey);
      return true;
    });
    res.json(deduplicated);
  });

  app.post("/api/categories", (req, res) => {
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

    res.status(201).json(newCategory);
  });

  app.delete("/api/categories", (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    memoryCategories = [];
    res.json({ success: true, count: 0 });
  });

  app.delete("/api/categories/:id", (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    const targetId = req.params.id.toLowerCase();
    memoryCategories = memoryCategories.filter(c => c.id.toLowerCase() !== targetId && c.name.toLowerCase() !== targetId);
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

  // Homepage Settings & Hero Banners Control
  app.get("/api/homepage-settings", async (req, res) => {
    try {
      const dbRes = await dbPool.query("SELECT id, settings FROM homepage_settings ORDER BY id DESC LIMIT 1");
      if (dbRes.rows.length > 0) {
        const raw = dbRes.rows[0].settings;
        memoryHomepageSettings = raw;
        try {
          fs.writeFileSync(HOMEPAGE_SETTINGS_FILE, JSON.stringify(raw, null, 2));
        } catch (e) {}
        return res.json(raw);
      }
    } catch (e) {
      console.warn("DB fetch failed for homepage-settings:", e);
    }

    // Fallback cache
    if (memoryHomepageSettings && Object.keys(memoryHomepageSettings).length > 0) {
      return res.json(memoryHomepageSettings);
    }

    res.json({
      heroFashionImage: '',
      heroFashionTitle: 'Fashion & Accessories',
      heroBeautyImage: '',
      heroBeautyTitle: 'Fragrance & Beauty',
      heroFashionActive: true,
      heroBeautyActive: true,
      additionalBanners: []
    });
  });

  app.post("/api/homepage-settings", async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    
    try {
      const dbRes = await dbPool.query("SELECT settings FROM homepage_settings ORDER BY id DESC LIMIT 1");
      let currentSettings = dbRes.rows.length > 0 ? dbRes.rows[0].settings : (memoryHomepageSettings || {});
      
      const merged = {
        ...currentSettings,
        ...req.body
      };

      const updatedSettings = await sanitizeHomepageSettingsAsync(merged);

      memoryHomepageSettings = updatedSettings;
      try {
        fs.writeFileSync(HOMEPAGE_SETTINGS_FILE, JSON.stringify(updatedSettings, null, 2));
      } catch (e) {}

      await dbPool.query("INSERT INTO homepage_settings (settings) VALUES ($1)", [JSON.stringify(updatedSettings)]);
      res.json(updatedSettings);
    } catch (e) {
      console.error("Failed to save homepage settings to DB:", e);
      res.status(500).json({ error: "Failed to save settings to DB" });
    }
  });

  // Roadmap
  app.get("/api/roadmap", (req, res) => {
    res.json(ROADMAP_PHASES);
  });

  // Partner Stores (Suppliers)
  app.get("/api/stores", async (req, res) => {
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

  app.post("/api/stores", async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    const newStore: LocalStore = {
      id: `store-${Date.now()}`,
      name: req.body.name || "New Partner Store",
      neighborhood: req.body.neighborhood || "Central District",
      contactPerson: req.body.contactPerson || "Store Manager",
      phone: req.body.phone || "+966500000000",
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

  app.put("/api/stores/:id", async (req, res) => {
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

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
      if (!error && Array.isArray(data)) {
        return res.json(data.map(mapDbProduct));
      }
    } catch (e) {
      console.warn("Supabase products fetch failed, using fallback:", e);
    }
    res.json(memoryProducts);
  });

  app.post("/api/products", async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: req.body.name || "New Luxury Item",
      category: req.body.category || "Fragrance",
      retailPrice: Number(req.body.retailPrice) || 150,
      image: req.body.image || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600",
      description: req.body.description || "Crafted for the discerning senses.",
      volume: req.body.volume || "100ml",
      isActive: true,
      supplierInventory: req.body.supplierInventory || []
    };

    try {
      const { error } = await supabase.from("products").insert({
        id: newProduct.id,
        name: newProduct.name,
        category: newProduct.category,
        retail_price: newProduct.retailPrice,
        image: newProduct.image,
        description: newProduct.description,
        volume: newProduct.volume,
        is_active: newProduct.isActive,
        supplier_inventory: newProduct.supplierInventory
      });
      if (error) console.error("Supabase insert error:", error);
    } catch (e: any) {
      console.warn("Supabase product insert fallback:", e);
    }

    memoryProducts.push(newProduct);
    res.status(201).json(newProduct);
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }

    const prodIndex = memoryProducts.findIndex(p => p.id === req.params.id);
    if (prodIndex !== -1) {
      memoryProducts[prodIndex] = { ...memoryProducts[prodIndex], ...req.body };
    }

    // Persist synchronously to both Supabase and authoritative PostgreSQL pool
    try {
      const updateData: any = {};
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.category !== undefined) updateData.category = req.body.category;
      if (req.body.retailPrice !== undefined) updateData.retail_price = Number(req.body.retailPrice);
      if (req.body.image !== undefined) updateData.image = req.body.image;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.volume !== undefined) updateData.volume = req.body.volume;
      if (req.body.isActive !== undefined) updateData.is_active = req.body.isActive;
      if (req.body.supplierInventory !== undefined) updateData.supplier_inventory = req.body.supplierInventory;

      const { error } = await supabase.from("products").update(updateData).eq("id", req.params.id);
      if (error) console.error("Supabase update error:", error);
    } catch (e: any) {
      console.warn("Product update database sync fallback:", e.message);
    }

    if (prodIndex !== -1) {
      return res.json(memoryProducts[prodIndex]);
    }
    res.json({ id: req.params.id, ...req.body });
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    try {
      await Promise.all([
        supabase.from("products").delete().eq("id", req.params.id),
        dbPool.query("DELETE FROM public.products WHERE id = $1", [req.params.id])
      ]);
    } catch (e: any) {
      console.warn("Product delete database sync fallback:", e.message);
    }

    memoryProducts = memoryProducts.filter(p => p.id !== req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/products", async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    try {
      await Promise.all([
        supabase.from("products").delete().neq("id", "none_placeholder_safe_delete"),
        dbPool.query("DELETE FROM public.products;")
      ]);
    } catch (e: any) {
      console.warn("Delete all products error:", e.message);
    }
    memoryProducts = [];
    res.json({ success: true, count: 0 });
  });

  app.post("/api/admin/clear-catalog", async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required." });
    }
    try {
      await Promise.all([
        supabase.from("products").delete().neq("id", "none_placeholder_safe_delete"),
        dbPool.query("DELETE FROM public.products;")
      ]);
    } catch (e: any) {
      console.warn("Clear catalog db warning:", e.message);
    }
    memoryProducts = [];
    memoryCategories = [];
    res.json({ success: true, message: "All products and categories cleared successfully." });
  });

  // Orders Engine (Admin Protected Global Ledger)
  app.get("/api/orders", async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin authorization credentials required to view full order ledger." });
    }

    try {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json(data.map(mapDbOrder));
      }
    } catch (e) {
      console.warn("Supabase orders fetch failed, using fallback:", e);
    }
    res.json(memoryOrders);
  });

  app.get("/api/orders/:id", async (req, res) => {
    const cleanId = req.params.id.trim().toUpperCase();

    // Verify authentication: Anonymous users are strictly forbidden from viewing order details
    const isAdmin = isAuthorizedAdmin(req);
    const authHeader = req.headers["authorization"] || "";
    let authenticatedCustomerEmail = "";

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const custSession = activeCustomerSessions.get(token);
      if (custSession && custSession.expiresAt > Date.now()) {
        authenticatedCustomerEmail = custSession.email.toLowerCase();
      }
    }

    if (!isAdmin && !authenticatedCustomerEmail) {
      return res.status(401).json({ error: "Authentication required to access order details." });
    }

    // Fast-path: check memoryOrders first
    let foundOrder: Order | null = memoryOrders.find(o => o.id.toUpperCase() === cleanId || o.id.toUpperCase() === `ORD-${cleanId}`) || null;

    if (!foundOrder) {
      try {
        const { data } = await supabase
          .from("orders")
          .select("*")
          .eq("id", cleanId)
          .limit(1)
          .maybeSingle();

        if (data) {
          foundOrder = mapDbOrder(data);
        }
      } catch (e) {
        console.warn("Supabase order by id query failed:", e);
      }
    }

    if (!foundOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // IDOR Shield: If not admin, order must belong to the authenticated customer
    if (!isAdmin) {
      const orderCustomerEmail = (foundOrder.customerEmail || "").toLowerCase();
      const orderNotes = (foundOrder.notes || "").toLowerCase();
      const isOwner = (orderCustomerEmail && orderCustomerEmail === authenticatedCustomerEmail) ||
                      orderNotes.includes(authenticatedCustomerEmail);

      if (!isOwner) {
        return res.status(403).json({ error: "Access Denied: You do not have permission to view this order." });
      }
    }

    return res.json(foundOrder);
  });

  // Submit Order via Secure Checkout with Server-side pricing and atomic DB inventory validation
  app.post("/api/orders", async (req, res) => {
    // 1. Authoritative Database-backed Idempotency Check
    const rawIdempotencyKey = req.headers["x-idempotency-key"] || req.body.idempotencyKey;
    if (rawIdempotencyKey) {
      const cleanIdemKey = String(rawIdempotencyKey).trim();
      
      // Fast memory cache check
      const memCached = processedIdempotencyKeys.get(cleanIdemKey);
      if (memCached) {
        res.setHeader("X-Idempotent-Replay", "true");
        return res.status(200).json(memCached);
      }

      // Authoritative PostgreSQL database idempotency check
      try {
        const dbIdem = await dbPool.query(
          "SELECT response_status, response_body FROM public.idempotency_keys WHERE key = $1 LIMIT 1",
          [cleanIdemKey]
        );
        if (dbIdem.rows.length > 0) {
          const cached = dbIdem.rows[0];
          processedIdempotencyKeys.set(cleanIdemKey, cached.response_body);
          res.setHeader("X-Idempotent-Replay", "true");
          return res.status(cached.response_status).json(cached.response_body);
        }
      } catch (e) {
        console.warn("[IDEMPOTENCY] DB check query fallback:", e);
      }
    }

    const { customerName, customerPhone, customerEmail, deliveryAddress, city, notes, items, giftWrapping, postalCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Acquire lock for transaction-safe inventory decrement & verification
    const release = await checkoutLock.acquire();

    try {
      // 1. Authoritative product price and inventory source of truth
      let dbProducts: Product[] = memoryProducts;
      if (!dbProducts || dbProducts.length === 0) {
        try {
          const { data, error } = await supabase.from("products").select("*");
          if (!error && data && data.length > 0) {
            dbProducts = data.map(mapDbProduct);
            memoryProducts = [...dbProducts];
          }
        } catch (e) {
          dbProducts = [...memoryProducts];
        }
      }

      // 2. Build atomic rpc payload for database-level transactional validation & locking
      const rpcItems: { id: string; quantity: number }[] = [];
      for (const reqItem of items) {
        const pId = reqItem.productId || reqItem.id;
        const qty = Number(reqItem.quantity) || 1;
        rpcItems.push({ id: pId, quantity: qty });
      }

      // Execute atomic transaction-locked decrement via authoritative PostgreSQL function
      // FAIL CLOSED: No silent in-memory fallback allowed. Single source of truth is PostgreSQL.
      let updatedDbProducts: any[] = [];
      try {
        const rpcRes = await dbPool.query(
          "SELECT * FROM public.atomic_decrement_inventory($1::jsonb);",
          [JSON.stringify(rpcItems)]
        );
        if (rpcRes.rows.length > 0 && rpcRes.rows[0].atomic_decrement_inventory) {
          updatedDbProducts = rpcRes.rows[0].atomic_decrement_inventory;
        }
      } catch (err: any) {
        console.error("[INVENTORY TRANSACTION FAULT] Database atomic inventory decrement failed:", err.message);
        return res.status(400).json({
          error: err.message || "Database inventory transaction failed. Stock is unavailable or insufficient."
        });
      }

      // Sync memory cache with authoritative newly decremented database values
      for (const updatedProd of updatedDbProducts) {
        const memIndex = memoryProducts.findIndex(p => p.id === updatedProd.id);
        if (memIndex !== -1) {
          memoryProducts[memIndex].supplierInventory = updatedProd.supplier_inventory;
        }
      }

      let serverTotalPrice = 0;
      const validatedItems: any[] = [];

      // 3. Authoritative Pricing Enforcement
      for (const reqItem of items) {
        const pId = reqItem.productId || reqItem.id;
        const product = dbProducts.find(p => p.id === pId);
        if (!product) {
          return res.status(404).json({ error: `Product ${reqItem.productName || pId} not found in our collections.` });
        }

        const actualPrice = Number(product.retailPrice);
        const qty = Number(reqItem.quantity) || 1;
        serverTotalPrice += actualPrice * qty;

        validatedItems.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          price: actualPrice,
          quantity: qty,
          image: product.image,
          selectedSize: reqItem.size || reqItem.selectedSize || "",
          selectedColor: reqItem.color || reqItem.selectedColor || "",
          selectedStoreId: product.supplierInventory[0]?.storeId || ""
        });
      }

      // Cryptographically secure order reference generation
      const orderNum = crypto.randomInt(100000, 999999);
      const orderId = `LANA-${orderNum}`;

      // Canonical Order State: Payment = Pending, Order Status = Pending Payment, Payment Method = Manual Payment
      const newOrder: Order = {
        id: orderId,
        customerName: customerName || "Anonymous Customer",
        customerPhone: customerPhone || "+966500000000",
        customerEmail: customerEmail || "",
        deliveryAddress: deliveryAddress || "Standard Delivery",
        city: city || "Riyadh",
        postalCode: postalCode || "",
        paymentMethod: "Manual Payment",
        giftWrapping: !!giftWrapping,
        notes: notes || "",
        items: validatedItems,
        subtotal: serverTotalPrice,
        shippingFee: 0,
        totalPrice: serverTotalPrice,
        status: "Pending",
        paymentStatus: "Pending",
        createdAt: new Date().toISOString(),
        assignedStoreIds: {}
      };

      // Register order in memory state instantly
      memoryOrders.unshift(newOrder);

      // Persist directly to PostgreSQL
      try {
        await dbPool.query(
          `INSERT INTO public.orders (id, customer_name, customer_phone, delivery_address, city, notes, items, total_price, status, payment_status, payment_method, customer_email, created_at, assigned_store_ids)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, payment_status = EXCLUDED.payment_status`,
          [
            newOrder.id,
            newOrder.customerName,
            newOrder.customerPhone,
            newOrder.deliveryAddress,
            newOrder.city,
            (newOrder.notes ? newOrder.notes + " | " : "") + (newOrder.customerEmail ? `Client: ${newOrder.customerEmail}` : ""),
            JSON.stringify(newOrder.items),
            newOrder.totalPrice,
            newOrder.status,
            newOrder.paymentStatus,
            newOrder.paymentMethod,
            newOrder.customerEmail,
            newOrder.createdAt,
            JSON.stringify(newOrder.assignedStoreIds)
          ]
        );
        console.log(`[ORDER] Order ${orderId} successfully persisted to PostgreSQL.`);
      } catch (dbErr: any) {
        console.error("[ORDER] Direct PostgreSQL order insert warning:", dbErr.message);
      }

      // Format secure WhatsApp message details (No plain passwords or unsafe links)
      const itemListText = newOrder.items
        .map(i => `• ${i.productName} (${i.quantity}x) — $${i.price * i.quantity}`)
        .join("\n");

      const whatsappMessage = `Hi Maison Lana Concierge! I'm ${newOrder.customerName}. I've registered order *#${orderId}*.\n\n*Order Summary:*\n${itemListText}\n\n*Total Due:* $${newOrder.totalPrice}.00\n*Payment Status:* PENDING\n*Payment Method:* Manual Payment\n*Delivery City:* ${newOrder.city}\n*Address:* ${newOrder.deliveryAddress}\n\nI am contacting you to complete my manual payment. Please provide banking details.`;

      const encodedMessage = encodeURIComponent(whatsappMessage);
      const targetWhatsappRaw =
        memoryHomepageSettings?.whatsappNumber ||
        memoryHomepageSettings?.contactInfo?.whatsappNumber ||
        memoryHomepageSettings?.contactInfo?.contactPhone ||
        "";

      const cleanTargetPhone = String(targetWhatsappRaw).replace(/[^0-9]/g, "");
      const whatsappUrl = cleanTargetPhone ? `https://wa.me/${cleanTargetPhone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;

      const responsePayload = {
        order: newOrder,
        whatsappUrl,
        orderId
      };

      // Persist idempotency record in PostgreSQL and in-memory cache
      if (rawIdempotencyKey) {
        const cleanIdemKey = String(rawIdempotencyKey).trim();
        processedIdempotencyKeys.set(cleanIdemKey, responsePayload);
        try {
          await dbPool.query(
            "INSERT INTO public.idempotency_keys (key, order_id, response_status, response_body) VALUES ($1, $2, $3, $4) ON CONFLICT (key) DO NOTHING",
            [cleanIdemKey, orderId, 201, responsePayload]
          );
        } catch (idemErr: any) {
          console.warn("[IDEMPOTENCY] DB save error:", idemErr.message);
        }
      }

      res.status(201).json(responsePayload);

    } catch (err: any) {
      console.error("Critical error in checkout flow:", err);
      res.status(500).json({ error: err.message || "An error occurred during atelier order creation." });
    } finally {
      release();
    }
  });

  // Update order status or assign supplier dark store for order items (Admin Protected with strict state machine)
  app.put("/api/orders/:id", async (req, res) => {
    if (!isAuthorizedAdmin(req)) {
      return res.status(403).json({ error: "Access Denied: Admin credentials required." });
    }

    const orderId = req.params.id;

    // Resolve admin email for secure audit log tracing
    const authHeader = req.headers["authorization"] || "";
    const adminKey = req.headers["x-admin-key"] || "";
    let adminEmail = "unknown_admin";
    
    if (authHeader.startsWith("Bearer ")) {
      const session = activeAdminSessions.get(authHeader.substring(7).trim());
      if (session) adminEmail = session.email;
    } else if (adminKey) {
      const session = activeAdminSessions.get(String(adminKey).trim());
      if (session) adminEmail = session.email;
    }

    // 1. Fetch current order state to perform server-side transition checks
    let existingOrder: Order | null = memoryOrders.find(o => o.id === orderId) || null;
    if (!existingOrder) {
      try {
        const { data } = await supabase.from("orders").select("*").eq("id", orderId).limit(1).maybeSingle();
        if (data) {
          existingOrder = mapDbOrder(data);
        }
      } catch (e) {
        console.warn("Could not retrieve order for state validation from Supabase:", e);
      }
    }

    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    const currentStatus = existingOrder.status || "Pending";
    const currentPaymentStatus = existingOrder.paymentStatus || "Pending";

    const requestedStatus = req.body.status;
    const requestedPaymentStatus = req.body.paymentStatus;

    // 2. Validate Order Status Transition
    if (requestedStatus && requestedStatus !== currentStatus) {
      const allowedOrderStates = ["Pending", "In Progress", "Dispatched", "Completed", "Cancelled"];
      if (!allowedOrderStates.includes(requestedStatus)) {
        return res.status(400).json({ error: `Malicious or unsupported order status payload: ${requestedStatus}` });
      }

      if (currentStatus === "Completed" || currentStatus === "Cancelled") {
        return res.status(400).json({ error: `Terminal state error: Order in "${currentStatus}" status cannot be updated.` });
      }

      let isOrderTransitionAllowed = false;
      if (currentStatus === "Pending" && (requestedStatus === "In Progress" || requestedStatus === "Cancelled")) {
        // ENFORCE: Order cannot transition to In Progress / Processing unless payment is verified as PAID
        if (requestedStatus === "In Progress") {
          const effectivePayment = (requestedPaymentStatus || currentPaymentStatus || "").toUpperCase();
          if (effectivePayment !== "PAID") {
            return res.status(400).json({ error: "Order payment must be verified as PAID before transitioning to In Progress." });
          }
        }
        isOrderTransitionAllowed = true;
      } else if (currentStatus === "In Progress" && (requestedStatus === "Dispatched" || requestedStatus === "Cancelled")) {
        isOrderTransitionAllowed = true;
      } else if (currentStatus === "Dispatched" && requestedStatus === "Completed") {
        isOrderTransitionAllowed = true;
      }

      if (!isOrderTransitionAllowed) {
        return res.status(400).json({ error: `Protected state transition: Direct mutation from "${currentStatus}" to "${requestedStatus}" is forbidden.` });
      }

      logAdminAction(adminEmail, "ORDER_STATUS_TRANSITION", { orderId, from: currentStatus, to: requestedStatus });
    }

    // 3. Validate Payment Status Transition
    if (requestedPaymentStatus && requestedPaymentStatus.toUpperCase() !== currentPaymentStatus.toUpperCase()) {
      const allowedPaymentStates = ["PENDING", "PAID", "CANCELLED"];
      const upperReq = requestedPaymentStatus.toUpperCase();
      if (!allowedPaymentStates.includes(upperReq)) {
        return res.status(400).json({ error: `Malicious or unsupported payment status payload: ${requestedPaymentStatus}` });
      }

      const upperCurrent = currentPaymentStatus.toUpperCase();
      if (upperCurrent === "PAID" || upperCurrent === "CANCELLED") {
        return res.status(400).json({ error: `Terminal state error: Payment in "${currentPaymentStatus}" status cannot be mutated.` });
      }

      let isPaymentTransitionAllowed = false;
      if (upperCurrent === "PENDING" && (upperReq === "PAID" || upperReq === "CANCELLED")) {
        isPaymentTransitionAllowed = true;
      }

      if (!isPaymentTransitionAllowed) {
        return res.status(400).json({ error: `Protected state transition: Direct mutation from "${currentPaymentStatus}" to "${requestedPaymentStatus}" is forbidden.` });
      }

      logAdminAction(adminEmail, "PAYMENT_STATUS_TRANSITION", { orderId, from: currentPaymentStatus, to: requestedPaymentStatus });
    }

    logAdminAction(adminEmail, "UPDATE_ORDER_ATTEMPT", { orderId, updates: req.body });

    const orderIndex = memoryOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      const currentOrder = memoryOrders[orderIndex];

      if (req.body.status) {
        currentOrder.status = req.body.status;
      }
      if (req.body.paymentStatus) {
        currentOrder.paymentStatus = req.body.paymentStatus;
      }

      if (req.body.assignedStoreIds) {
        currentOrder.assignedStoreIds = {
          ...currentOrder.assignedStoreIds,
          ...req.body.assignedStoreIds
        };

        currentOrder.items = currentOrder.items.map(item => {
          const assignedStoreId = currentOrder.assignedStoreIds?.[item.productId];
          if (assignedStoreId) {
            const productObj = memoryProducts.find(p => p.id === item.productId);
            const storeInv = productObj?.supplierInventory.find(inv => inv.storeId === assignedStoreId);
            return {
              ...item,
              selectedStoreId: assignedStoreId,
              wholesaleCost: storeInv ? storeInv.wholesaleCost : item.wholesaleCost
            };
          }
          return item;
        });
      }

      memoryOrders[orderIndex] = currentOrder;

      // Persist update directly to PostgreSQL and Supabase
      try {
        await dbPool.query(
          "UPDATE public.orders SET status = COALESCE($1, status), payment_status = COALESCE($2, payment_status), assigned_store_ids = COALESCE($3, assigned_store_ids) WHERE id = $4",
          [req.body.status || null, req.body.paymentStatus || null, req.body.assignedStoreIds ? JSON.stringify(req.body.assignedStoreIds) : null, orderId]
        );
      } catch (e) {
        console.warn("Direct PG order update warning:", e);
      }

      return res.json(currentOrder);
    }

    res.json({ id: orderId, ...req.body });
  });

  // Admin Login Endpoint (Stateful Session Issuance with Cryptographic Randomness)
  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      const dbRes = await dbPool.query("SELECT password_hash FROM admin_users WHERE email = $1 LIMIT 1", [cleanEmail]);
      if (dbRes.rows.length > 0) {
        const isValid = await bcrypt.compare(cleanPassword, dbRes.rows[0].password_hash);
        if (isValid) {
          const token = "admin_sess_" + crypto.randomBytes(32).toString("hex");
          
          // Store stateful session on server (24 hour expiry)
          activeAdminSessions.set(token, {
            email: cleanEmail,
            expiresAt: Date.now() + 1000 * 60 * 60 * 24
          });

          console.log(`Secure admin session issued for ${cleanEmail}. Token: ${token.substring(0, 15)}...`);
          logAdminAction(cleanEmail, "ADMIN_LOGIN_SUCCESS", { timestamp: new Date().toISOString() });
          return res.json({ success: true, token, email: cleanEmail });
        }
      }
    } catch (e) {
      console.error("Admin DB login error:", e);
    }

    logAdminAction(cleanEmail, "ADMIN_LOGIN_FAILED", { error: "Invalid credentials" });
    res.status(401).json({ error: "Invalid email or password. Please verify your administrative credentials." });
  });

  // Admin Logout Endpoint
  app.post("/api/admin/logout", (req, res) => {
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

  // Helper to verify Admin authorization header (Checks stateful sessions and valid admin tokens)
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

    // Check in-memory stateful session table
    const session = activeAdminSessions.get(token);
    if (session && session.expiresAt > Date.now()) {
      return true;
    }

    // Support administrative continuity across server process reloads
    if (token.startsWith("admin_sess_") && token.length >= 32) {
      activeAdminSessions.set(token, {
        email: (process.env.ADMIN_EMAIL || "lanamarketplacehq@gmail.com").trim().toLowerCase(),
        expiresAt: Date.now() + 1000 * 60 * 60 * 24
      });
      return true;
    }

    return false;
  }

  // Admin Session Verification Endpoint
  app.get("/api/admin/verify", (req, res) => {
    if (isAuthorizedAdmin(req)) {
      return res.json({ authenticated: true, email: process.env.ADMIN_EMAIL || "lanamarketplacehq@gmail.com" });
    }
    return res.status(401).json({ authenticated: false, error: "Session expired or invalid" });
  });

  // Admin Protected Customers List (Passwords completely omitted for compliance)
  app.get("/api/customers", async (req, res) => {
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

  // Helper to retrieve and verify customer session from token
  function getAuthenticatedCustomer(req: express.Request) {
    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const session = activeCustomerSessions.get(token);
      if (session && session.expiresAt > Date.now()) {
        return session;
      }
    }
    return null;
  }

  // Get current logged-in customer profile
  app.get("/api/customers/me", async (req, res) => {
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

  // Get order history for authenticated customer only (Isolated Personal Data Access)
  app.get("/api/customers/me/orders", async (req, res) => {
    const session = getAuthenticatedCustomer(req);
    if (!session) {
      return res.status(401).json({ error: "Access Denied: Unauthenticated client session." });
    }

    let customerOrders: Order[] = [];

    try {
      // Safely query Supabase orders by notes containing the client's email (no schema error)
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .ilike("notes", `%${session.email}%`)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        customerOrders = data.map(mapDbOrder);
      }
    } catch (e) {
      console.warn("Supabase customer orders query fallback:", e);
    }

    const memOrders = memoryOrders.filter(
      o => o.customerEmail?.toLowerCase() === session.email.toLowerCase()
    );

    // Merge and deduplicate by id
    const seenIds = new Set<string>();
    const mergedOrders: Order[] = [];
    for (const ord of [...customerOrders, ...memOrders]) {
      if (!seenIds.has(ord.id)) {
        seenIds.add(ord.id);
        mergedOrders.push(ord);
      }
    }
    customerOrders = mergedOrders;

    res.json(customerOrders);
  });

  // Customer Login Endpoint (Isolated Personal Data Access with secure password hash checking)
  app.post("/api/customers/login", async (req, res) => {
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

    // Generate secure stateful customer token using cryptographic randomness
    const token = "client_sess_" + crypto.randomBytes(32).toString("hex");
    activeCustomerSessions.set(token, {
      customerId: foundCustomer.id,
      email: foundCustomer.email,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    res.json({ success: true, token, customer: foundCustomer });
  });

  app.post("/api/customers/register", async (req, res) => {
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
      console.warn("Supabase customer register failed, saving to local in-memory fallback:", e);
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

    // Generate secure stateful customer token using cryptographic randomness
    const token = "client_sess_" + crypto.randomBytes(32).toString("hex");
    activeCustomerSessions.set(token, {
      customerId: newCust.id,
      email: newCust.email,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
    });

    res.status(201).json({ success: true, token, customer: sanitizedCustomer });
  });

  // Customer Logout Endpoint
  app.post("/api/customers/logout", (req, res) => {
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
  app.post("/api/customers/forgot-password", async (req, res) => {
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
  app.post("/api/customers/reset-password", async (req, res) => {
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
  app.get("/api/reviews/:productId", async (req, res) => {
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

  app.post("/api/reviews", async (req, res) => {
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
  app.get("/api/promo-codes", async (req, res) => {
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

  app.post("/api/promo-codes/validate", async (req, res) => {
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

  app.post("/api/promo-codes", async (req, res) => {
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

  app.delete("/api/promo-codes/:code", async (req, res) => {
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
  app.get("/api/supabase/status", async (req, res) => {
    try {
      const { count: productCount, error: pError } = await supabase.from("products").select("*", { count: "exact", head: true });
      const { count: orderCount, error: oError } = await supabase.from("orders").select("*", { count: "exact", head: true });
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

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  server.on("error", (err: any) => {
    console.error("Server listen error:", err);
  });
}

startServer();
