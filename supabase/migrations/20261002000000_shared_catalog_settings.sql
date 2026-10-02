-- Shared catalog and homepage settings required by the serverless API.

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  department TEXT DEFAULT 'Fashion',
  sub_categories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.categories TO service_role;

CREATE TABLE IF NOT EXISTS public.homepage_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  settings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.homepage_settings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.homepage_settings TO service_role;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'LANA',
  ADD COLUMN IF NOT EXISTS sub_category TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Fashion',
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC,
  ADD COLUMN IF NOT EXISTS secondary_image TEXT,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ingredients TEXT,
  ADD COLUMN IF NOT EXISTS savoir_faire TEXT,
  ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT FALSE;

GRANT ALL ON TABLE public.products TO service_role;

CREATE OR REPLACE VIEW public.products_public AS
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
    FALSE
  ) AS in_stock
FROM public.products;

GRANT SELECT ON public.products_public TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;