-- ============================================================
-- MAISON LANA - SUPABASE DATABASE SCHEMA & INITIAL SEED DATA
-- Copy and paste this script into your Supabase SQL Editor.
-- ============================================================

-- 1. STORES TABLE
CREATE TABLE IF NOT EXISTS public.stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  neighborhood TEXT,
  contact_person TEXT,
  phone TEXT,
  rating NUMERIC DEFAULT 5.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to stores" ON public.stores;
DROP POLICY IF EXISTS "Public can read stores" ON public.stores;
CREATE POLICY "Public can read stores" ON public.stores FOR SELECT TO anon, authenticated USING (is_active IS NOT FALSE);
GRANT SELECT ON public.stores TO anon, authenticated;
-- Admin access is handled securely via backend service role bypass. No public write access is allowed.

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  retail_price NUMERIC NOT NULL,
  image TEXT,
  description TEXT,
  volume TEXT,
  is_active BOOLEAN DEFAULT true,
  supplier_inventory JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
CREATE POLICY "Allow public read access to products" ON public.products FOR SELECT USING (true);
-- Admin access is handled securely via backend service role bypass. No public write access is allowed.

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  delivery_address TEXT,
  city TEXT,
  postal_code TEXT,
  notes TEXT,
  gift_wrapping BOOLEAN DEFAULT false,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC,
  shipping_fee NUMERIC DEFAULT 0,
  total_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending',
  payment_method TEXT DEFAULT 'Manual Bank Transfer',
  payment_status TEXT DEFAULT 'Pending',
  assigned_store_ids JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Explicit isolation policy: Deny public direct access; allow individual customers to query only their own orders via Supabase Auth if used
DROP POLICY IF EXISTS "Deny anonymous access to orders" ON public.orders;
CREATE POLICY "Deny anonymous access to orders" 
  ON public.orders FOR ALL 
  TO anon 
  USING (false);

DROP POLICY IF EXISTS "Customers can only view their own orders" ON public.orders;
CREATE POLICY "Customers can only view their own orders" 
  ON public.orders FOR SELECT 
  TO authenticated 
  USING (
    customer_email = auth.jwt() ->> 'email' 
    OR notes ILIKE '%' || (auth.jwt() ->> 'email') || '%'
  );

-- Backend administrative proxy uses service_role key which bypasses RLS securely.

-- 4. CUSTOMERS TABLE (Secure Credentials Storage)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL, -- Cryptographically hashed bcrypt password
  phone TEXT,
  member_tier TEXT DEFAULT 'Privilège',
  member_since TEXT DEFAULT '2026',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Explicit isolation policy: Deny anonymous access; allow individual customers to view and update only their own profile
DROP POLICY IF EXISTS "Deny anonymous access to customers" ON public.customers;
CREATE POLICY "Deny anonymous access to customers" 
  ON public.customers FOR ALL 
  TO anon 
  USING (false);

DROP POLICY IF EXISTS "Customers can only read their own profile" ON public.customers;
CREATE POLICY "Customers can only read their own profile" 
  ON public.customers FOR SELECT 
  TO authenticated 
  USING (
    email = auth.jwt() ->> 'email'
  );

DROP POLICY IF EXISTS "Customers can only update their own profile" ON public.customers;
CREATE POLICY "Customers can only update their own profile" 
  ON public.customers FOR UPDATE 
  TO authenticated 
  USING (
    email = auth.jwt() ->> 'email'
  )
  WITH CHECK (
    email = auth.jwt() ->> 'email'
  );

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  rating NUMERIC NOT NULL DEFAULT 5,
  title TEXT,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to reviews" ON public.reviews;
CREATE POLICY "Allow public read access to reviews" ON public.reviews FOR SELECT USING (true);
-- Reviews insertions are proxied through our secure backend server API endpoint. No public write is allowed.

-- ============================================================
-- INITIAL SEED DATA FOR TESTING
-- ============================================================

-- Seed Stores
INSERT INTO public.stores (id, name, neighborhood, contact_person, phone, rating, is_active)
VALUES 
  ('store-1', 'Boutique Olfactive Kingdom', 'Al Olaya District', 'Tariq Al-Mansoor', '+966 50 112 2334', 4.9, true),
  ('store-2', 'Maison Perfumerie Jeddah', 'Ash Shati Promenade', 'Laila Binte Sultan', '+966 54 889 0011', 4.8, true),
  ('store-3', 'Atelier Royal Riyadh', 'Diplomatic Quarter', 'Faisal Al-Kharj', '+966 56 334 5566', 5.0, true)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Products
INSERT INTO public.products (id, name, category, retail_price, image, description, volume, is_active, supplier_inventory)
VALUES
  (
    'prod-1',
    'Sauvage Extrait De Parfum',
    'Fragrance',
    280,
    'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600',
    'An intoxicating blend of wild bergamot, dark amber, and rare smoked oud.',
    '100ml',
    true,
    '[{"storeId": "store-1", "wholesaleCost": 180, "stock": 15}, {"storeId": "store-3", "wholesaleCost": 175, "stock": 8}]'::jsonb
  ),
  (
    'prod-2',
    'Velour Nuit Night Serum',
    'Skincare',
    195,
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=600',
    'Cellular renewal elixir infused with botanical peptides and bio-active botanical oil.',
    '50ml',
    true,
    '[{"storeId": "store-2", "wholesaleCost": 120, "stock": 25}]'::jsonb
  ),
  (
    'prod-3',
    'Rouge Sublime Velvet Lipstick',
    'Makeup',
    65,
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=600',
    'Ultra-pigmented matte finish with hydrating hyaluronic spheres and micro-gold shimmer.',
    '3.5g',
    true,
    '[{"storeId": "store-1", "wholesaleCost": 35, "stock": 50}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ATOMIC CONCURRENCY SAFETY: ATOMIC INVENTORY DECREMENT
-- ============================================================
CREATE OR REPLACE FUNCTION public.atomic_decrement_inventory(p_items JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_item RECORD;
  v_prod RECORD;
  v_needed_qty INT;
  v_updated_inventory JSONB;
  v_inv JSONB;
  v_inv_record RECORD;
  v_results JSONB := '[]'::jsonb;
BEGIN
  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Items must be provided as a JSON array.';
  END IF;

  -- p_items is array of: [{"id": "prod-1", "quantity": 1}]
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(id TEXT, quantity INT) LOOP
    IF v_item.id IS NULL OR v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Each item requires a product ID and a positive quantity.';
    END IF;
    
    -- Acquire Row lock FOR UPDATE to prevent any simultaneous check/writes
    SELECT * INTO v_prod FROM public.products WHERE id = v_item.id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found in collections', v_item.id;
    END IF;

    v_needed_qty := v_item.quantity;
    v_updated_inventory := '[]'::jsonb;

    FOR v_inv IN SELECT entry.value FROM jsonb_array_elements(COALESCE(v_prod.supplier_inventory, '[]'::jsonb)) AS entry(value) LOOP
      SELECT * INTO v_inv_record FROM jsonb_to_record(v_inv.value) AS y("storeId" TEXT, "stock" INT, "wholesaleCost" NUMERIC);
      
      IF v_needed_qty > 0 AND v_inv_record.stock > 0 THEN
        IF v_inv_record.stock >= v_needed_qty THEN
          v_inv_record.stock := v_inv_record.stock - v_needed_qty;
          v_needed_qty := 0;
        ELSE
          v_needed_qty := v_needed_qty - v_inv_record.stock;
          v_inv_record.stock := 0;
        END IF;
      END IF;

      v_updated_inventory := v_updated_inventory || jsonb_build_object(
        'storeId', v_inv_record."storeId",
        'stock', v_inv_record.stock,
        'wholesaleCost', v_inv_record."wholesaleCost"
      );
    END LOOP;

    IF v_needed_qty > 0 THEN
      RAISE EXCEPTION 'Insufficient inventory for "%".', v_prod.name;
    END IF;

    -- Write updated inventory back to products table
    UPDATE public.products SET supplier_inventory = v_updated_inventory WHERE id = v_item.id;
    
    -- Append to return array
    v_results := v_results || jsonb_build_object('id', v_item.id, 'supplier_inventory', v_updated_inventory);
  END LOOP;

  RETURN v_results;
END;
$$;

REVOKE ALL ON FUNCTION public.atomic_decrement_inventory(JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.atomic_decrement_inventory(JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_decrement_inventory(JSONB) TO service_role;
