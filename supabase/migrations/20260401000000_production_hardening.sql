-- ============================================================
-- MAISON LANA - PRODUCTION HARDENING MIGRATION (20260401000000)
-- ============================================================

-- 1. ADMIN ROLES & RBAC
CREATE TABLE IF NOT EXISTS public.admin_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MANAGER', 'STAFF')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own admin role" ON public.admin_roles;
CREATE POLICY "Users can read own admin role"
  ON public.admin_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_admin_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_hierarchy INT;
  v_required_hierarchy INT;
BEGIN
  SELECT role INTO v_role FROM public.admin_roles WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  v_hierarchy := CASE v_role
    WHEN 'OWNER' THEN 4
    WHEN 'ADMIN' THEN 3
    WHEN 'MANAGER' THEN 2
    WHEN 'STAFF' THEN 1
    ELSE 0
  END;

  v_required_hierarchy := CASE required_role
    WHEN 'OWNER' THEN 4
    WHEN 'ADMIN' THEN 3
    WHEN 'MANAGER' THEN 2
    WHEN 'STAFF' THEN 1
    ELSE -1
  END;

  IF v_required_hierarchy = -1 THEN
    RETURN FALSE;
  END IF;

  RETURN v_hierarchy >= v_required_hierarchy;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.has_admin_role(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_admin_role(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_admin_role(TEXT) TO authenticated;

-- 2. CUSTOMERS TABLE LINKED TO auth.users
CREATE TABLE IF NOT EXISTS public.customers_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  member_tier TEXT DEFAULT 'Privilège' CHECK (member_tier IN ('Privilège', 'Royal', 'Prestige')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customers_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own customer profile" ON public.customers_v2;
CREATE POLICY "Users can read own customer profile"
  ON public.customers_v2 FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own customer profile" ON public.customers_v2;
CREATE POLICY "Users can update own customer profile"
  ON public.customers_v2 FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Trigger to protect customer profile sensitive fields
CREATE OR REPLACE FUNCTION public.enforce_customer_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := OLD.user_id;
  NEW.created_at := OLD.created_at;

  IF NOT (SELECT public.has_admin_role('ADMIN')) THEN
    NEW.member_tier := OLD.member_tier;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_customers_v2_protect_fields ON public.customers_v2;
CREATE TRIGGER tr_customers_v2_protect_fields
  BEFORE UPDATE ON public.customers_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_customer_profile_update();

-- 3. ORDERS & ORDER_ITEMS AUTHORITATIVE STRUCTURE (Financial Invariants Enforced)
CREATE TABLE IF NOT EXISTS public.orders_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers_v2(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL UNIQUE,
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  discount NUMERIC(12,2) DEFAULT 0 CHECK (discount >= 0),
  shipping NUMERIC(12,2) DEFAULT 0 CHECK (shipping >= 0),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  payment_method TEXT DEFAULT 'Manual Payment',
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  order_status TEXT DEFAULT 'Pending' CHECK (order_status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  shipping_address_snapshot JSONB NOT NULL,
  customer_notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read their own orders" ON public.orders_v2;
CREATE POLICY "Customers can read their own orders"
  ON public.orders_v2 FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.customers_v2 c
      WHERE c.id = orders_v2.customer_id
      AND c.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders_v2(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  sku TEXT,
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can read their own order items" ON public.order_items;
CREATE POLICY "Customers can read their own order items"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders_v2 o
      JOIN public.customers_v2 c ON c.id = o.customer_id
      WHERE o.id = order_items.order_id
      AND c.user_id = auth.uid()
    )
  );

-- Database Trigger to Enforce Financial Invariants
CREATE OR REPLACE FUNCTION public.enforce_financial_invariants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ABS(NEW.total - (NEW.subtotal - NEW.discount + NEW.shipping)) > 0.05 THEN
    RAISE EXCEPTION 'Financial invariant violated: total must equal subtotal - discount + shipping';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_orders_v2_financials ON public.orders_v2;
CREATE TRIGGER tr_orders_v2_financials
  BEFORE INSERT OR UPDATE ON public.orders_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_financial_invariants();

CREATE OR REPLACE FUNCTION public.enforce_item_financial_invariants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF ABS(NEW.line_total - (NEW.unit_price * NEW.quantity)) > 0.05 THEN
    RAISE EXCEPTION 'Financial invariant violated: line_total must equal unit_price * quantity';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_order_items_financials ON public.order_items;
CREATE TRIGGER tr_order_items_financials
  BEFORE INSERT OR UPDATE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_item_financial_invariants();

-- Trigger to prevent customers from modifying financial or status fields on orders_v2
CREATE OR REPLACE FUNCTION public.enforce_order_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT public.has_admin_role('STAFF')) THEN
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Customers are not permitted to modify orders directly.';
END;
$$;

DROP TRIGGER IF EXISTS tr_orders_v2_protection ON public.orders_v2;
CREATE TRIGGER tr_orders_v2_protection
  BEFORE UPDATE ON public.orders_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_order_protection();

-- 4. PRODUCTS PRIVILEGE REMEDIATION
REVOKE ALL ON public.products FROM anon;
REVOKE ALL ON public.products FROM authenticated;
DROP POLICY IF EXISTS "Allow all access to products" ON public.products;
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;
DROP POLICY IF EXISTS "Public read products" ON public.products;
DROP POLICY IF EXISTS "Public write products" ON public.products;

DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public AS
SELECT 
  id,
  name,
  brand,
  category,
  sub_category,
  department,
  gender,
  retail_price,
  original_price,
  image,
  secondary_image,
  images,
  description,
  volume,
  sizes,
  colors,
  details,
  savoir_faire,
  rating,
  review_count,
  is_new,
  is_featured,
  is_bestseller,
  is_exclusive,
  is_active,
  created_at,
  COALESCE(
    (SELECT SUM((elem->>'stock')::int) > 0 FROM jsonb_array_elements(supplier_inventory) AS elem), 
    false
  ) AS in_stock
FROM public.products;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- 5. LEGACY ORDERS REVOCATION
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.orders FROM authenticated;
DROP POLICY IF EXISTS "Allow all access to orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read access to orders" ON public.orders;
DROP POLICY IF EXISTS "Public read orders" ON public.orders;
DROP POLICY IF EXISTS "Public write orders" ON public.orders;

-- 6. REVIEWS HARDENING & OWNERSHIP ENFORCEMENT
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers_v2(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read approved reviews" ON public.reviews;
CREATE POLICY "Public can read approved reviews"
  ON public.reviews FOR SELECT
  TO anon, authenticated
  USING (is_approved = true OR public.has_admin_role('ADMIN'));

DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;
CREATE POLICY "Users can create own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.customers_v2 c
      WHERE c.id = customer_id
      AND c.user_id = auth.uid()
    )
    AND is_approved = false
    AND moderated_by IS NULL
    AND moderated_at IS NULL
  );

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.customers_v2 c
      WHERE c.id = customer_id
      AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND customer_id = customer_id
    AND EXISTS (
      SELECT 1 FROM public.customers_v2 c
      WHERE c.id = customer_id
      AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.customers_v2 c
      WHERE c.id = customer_id
      AND c.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_review_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := OLD.user_id;
  NEW.customer_id := OLD.customer_id;
  NEW.product_id := OLD.product_id;

  IF NOT (SELECT public.has_admin_role('ADMIN')) THEN
    NEW.is_approved := OLD.is_approved;
    NEW.moderated_by := OLD.moderated_by;
    NEW.moderated_at := OLD.moderated_at;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_reviews_protect_fields ON public.reviews;
CREATE TRIGGER tr_reviews_protect_fields
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_review_protection();

-- 7. PROMO CODES RLS & RESTRICTION
ALTER TABLE IF EXISTS public.promo_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.promo_codes FROM anon;
REVOKE ALL ON public.promo_codes FROM authenticated;

-- 8. STORES RLS & RESTRICTION
ALTER TABLE IF EXISTS public.stores ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stores FROM anon;
REVOKE ALL ON public.stores FROM authenticated;
GRANT SELECT ON public.stores TO anon, authenticated;
DROP POLICY IF EXISTS "Allow all access to stores" ON public.stores;
DROP POLICY IF EXISTS "Allow public read access to stores" ON public.stores;
DROP POLICY IF EXISTS "Public read stores" ON public.stores;
DROP POLICY IF EXISTS "Public write stores" ON public.stores;
DROP POLICY IF EXISTS "Public can read stores" ON public.stores;
CREATE POLICY "Public can read stores"
  ON public.stores FOR SELECT
  TO anon, authenticated
  USING (is_active IS NOT FALSE);

-- 9. IDEMPOTENCY KEYS TABLE
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  key TEXT PRIMARY KEY,
  order_id UUID REFERENCES public.orders_v2(id) ON DELETE SET NULL,
  response_status INT NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.idempotency_keys FROM PUBLIC;
REVOKE ALL ON public.idempotency_keys FROM anon;
REVOKE ALL ON public.idempotency_keys FROM authenticated;

-- 10. AUDIT LOGGING TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_logs FROM PUBLIC;
REVOKE ALL ON public.audit_logs FROM anon;
REVOKE ALL ON public.audit_logs FROM authenticated;

-- 11. SAFE UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_orders_v2_updated_at ON public.orders_v2;
CREATE TRIGGER tr_orders_v2_updated_at
  BEFORE UPDATE ON public.orders_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP FUNCTION IF EXISTS public.atomic_decrement_inventory(JSONB);

-- Indexes for high frequency queries
CREATE INDEX IF NOT EXISTS idx_orders_v2_customer_id ON public.orders_v2(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_v2_created_at ON public.orders_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON public.idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
