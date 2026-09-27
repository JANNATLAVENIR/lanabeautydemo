import { Category, BrandInfo, CollectionData, EditorialStory, Product } from '../types';

export const LUXURY_CATEGORIES: Category[] = [];

export const BRANDS_DATA: BrandInfo[] = [
  {
    id: 'hermes',
    name: 'Hermès',
    logoText: 'HERMÈS',
    tagline: 'L\'Artisanat Contemporain & Haute Maroquinerie',
    origin: 'Paris, France',
    established: '1837',
    description: 'Since 1837, Hermès has remained faithful to its artisan model and its humanist values. The freedom of creation, the constant quest for beautiful materials, and the transmission of exceptional savoir-faire create useful, elegant objects that stand the test of time.',
    heroImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=85&w=1600',
    featuredProductIds: []
  },
  {
    id: 'dior',
    name: 'Christian Dior',
    logoText: 'CHRISTIAN DIOR',
    tagline: 'Haute Couture & Parfumerie Française',
    origin: 'Paris, France',
    established: '1946',
    description: 'From 30 Avenue Montaigne to the grandest runways of the world, Christian Dior embodies timeless French luxury, avant-garde tailoring, and legendary fragrances.',
    heroImage: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=85&w=1600',
    featuredProductIds: []
  },
  {
    id: 'chanel',
    name: 'Chanel',
    logoText: 'CHANEL',
    tagline: 'Haute Couture, Mode & Maroquinerie',
    origin: 'Paris, France',
    established: '1910',
    description: 'Founded by Gabrielle Chanel, the House is renowned for its timeless tweed, the quilted 11.12 handbag, and legendary Parisian elegance.',
    heroImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=85&w=1600',
    featuredProductIds: []
  },
  {
    id: 'ysl',
    name: 'Saint Laurent',
    logoText: 'SAINT LAURENT',
    tagline: 'Parisian Rive Gauche Luxury & Tailoring',
    origin: 'Paris, France',
    established: '1961',
    description: 'Founded in 1961, Yves Saint Laurent revolutionized modern fashion. Today, under Anthony Vaccarello, Saint Laurent crafts iconic sharp tailoring and sculpted leather masterpieces.',
    heroImage: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&q=85&w=1600',
    featuredProductIds: []
  },
  {
    id: 'bottega',
    name: 'Bottega Veneta',
    logoText: 'BOTTEGA VENETA',
    tagline: 'When Your Own Initials Are Enough',
    origin: 'Vicenza, Italy',
    established: '1966',
    description: 'Renowned for its extraordinary leather craftsmanship, Bottega Veneta expresses quiet luxury through its signature Intrecciato woven leather without visible logos.',
    heroImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=85&w=1600',
    featuredProductIds: []
  },
  {
    id: 'lamer',
    name: 'La Mer',
    logoText: 'LA MER',
    tagline: 'Miracle Broth™ Cell-Renewing Miracle',
    origin: 'New York, USA',
    established: '1965',
    description: 'Born from the sea, legendary aerospace physicist Dr. Max Huber discovered the rejuvenating powers of fermented giant sea kelp.',
    heroImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85&w=1600',
    featuredProductIds: []
  },
  {
    id: 'augustinus-bader',
    name: 'Augustinus Bader',
    logoText: 'AUGUSTINUS BADER',
    tagline: 'The Science of Cellular Renewal',
    origin: 'Leipzig, Germany',
    established: '2018',
    description: 'Grounded in three decades of stem cell research, Professor Augustinus Bader developed TFC8® (Trigger Factor Complex) to optimize skin cellular rejuvenation.',
    heroImage: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=85&w=1600',
    featuredProductIds: []
  },
  {
    id: 'guerlain',
    name: 'Guerlain',
    logoText: 'GUERLAIN',
    tagline: 'Prestige Orchidée Impériale & Parisian Haute Parfumerie',
    origin: 'Paris, France',
    established: '1828',
    description: 'Two centuries of French fragrance mastery, rare orchid longevity science, and royal beekeeping heritage.',
    heroImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=85&w=1600',
    featuredProductIds: []
  }
];

export const COLLECTIONS_DATA: CollectionData[] = [
  {
    id: 'iconic-haute-maroquinerie',
    title: 'Iconic Haute Maroquinerie & Handbags',
    subtitle: 'Latest Creations',
    season: 'Autumn / Winter',
    heroImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=85&w=1200',
    secondaryImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=85&w=1200',
    description: 'The world\'s most coveted luxury handbags.',
    productIds: []
  },
  {
    id: 'dior-haute-parfumerie',
    title: 'Christian Dior Haute Parfumerie',
    subtitle: 'Perfumes & La Collection Privée',
    season: 'Editions',
    heroImage: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=85&w=1200',
    secondaryImage: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=85&w=1200',
    description: 'Exclusive fragrance masterpieces.',
    productIds: []
  }
];

export const EDITORIAL_STORIES: EditorialStory[] = [];
export const SERVICES_LIST = [];
export const SERVICES_DATA = [];

export const ALL_LUXURY_PRODUCTS: Product[] = [
  // --- LUXURY HANDBAGS ---
  {
    id: 'prod-lady-dior-med',
    name: 'Lady Dior Medium Bag',
    brand: 'Christian Dior',
    category: 'BAGS',
    subCategory: 'Handbags',
    department: 'Fashion',
    gender: 'Women',
    retailPrice: 5900,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=85&w=1000',
    description: 'The Lady Dior bag epitomizes the House\'s vision of elegance and beauty. Sleek and refined, crafted in black lambskin with Cannage stitching and pale gold charms.',
    sizes: ['Small', 'Medium', 'Large'],
    colors: [{ name: 'Black Cannage', hex: '#111111' }],
    details: ['Removable strap', 'Internal zip pocket', 'Made in Italy'],
    rating: 4.9,
    reviewCount: 142,
    collection: 'Iconic Haute Maroquinerie',
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supplierInventory: [{ storeId: 'store-1', wholesaleCost: 3800, stock: 12 }]
  },
  {
    id: 'prod-dior-saddle',
    name: 'Dior Saddle Bag',
    brand: 'Christian Dior',
    category: 'BAGS',
    subCategory: 'Shoulder Bags',
    department: 'Fashion',
    gender: 'Women',
    retailPrice: 4400,
    image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=85&w=1000',
    description: 'Iconic Saddle bag crafted in blue Dior Oblique jacquard canvas with magnetic D stirrup clasp.',
    sizes: ['Standard'],
    colors: [{ name: 'Blue Oblique', hex: '#1B365D' }],
    details: ['Magnetic D stirrup', 'Made in Italy'],
    rating: 4.8,
    reviewCount: 98,
    collection: 'Iconic Haute Maroquinerie',
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supplierInventory: [{ storeId: 'store-1', wholesaleCost: 2900, stock: 10 }]
  },
  {
    id: 'prod-chanel-classic-flap',
    name: 'Chanel Classic Double Flap Medium',
    brand: 'Chanel',
    category: 'BAGS',
    subCategory: 'Handbags',
    department: 'Fashion',
    gender: 'Women',
    retailPrice: 10200,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=85&w=1000',
    description: 'Iconic Chanel 11.12 Classic Double Flap Bag in quilted lambskin with gold-tone chain strap.',
    sizes: ['Medium'],
    colors: [{ name: 'Black Lambskin', hex: '#0A0A0A' }],
    details: ['CC turn-lock', 'Made in France'],
    rating: 5.0,
    reviewCount: 230,
    collection: 'Iconic Haute Maroquinerie',
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supplierInventory: [{ storeId: 'store-1', wholesaleCost: 6500, stock: 5 }]
  },

  // --- LUXURY MAKEUP & COSMETICS ---
  {
    id: 'prod-rouge-dior-lipstick',
    name: 'Rouge Dior Couture Refillable Lipstick',
    brand: 'Christian Dior',
    category: 'MAKEUP',
    subCategory: 'Lipstick',
    department: 'Beauty',
    gender: 'Women',
    retailPrice: 48,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=85&w=1000',
    description: 'The iconic Rouge Dior lipstick in a refillable couture case. Infused with floral lip care and long-wear comfort.',
    volume: '3.5 g',
    colors: [{ name: '999 Dior Velvet', hex: '#C41E3A' }],
    details: ['Floral lip care formula', 'Made in France'],
    rating: 4.9,
    reviewCount: 312,
    collection: 'Christian Dior Haute Parfumerie',
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supplierInventory: [{ storeId: 'store-2', wholesaleCost: 26, stock: 45 }]
  },
  {
    id: 'prod-dior-addict-lip-glow',
    name: 'Dior Addict Lip Glow Balm',
    brand: 'Christian Dior',
    category: 'MAKEUP',
    subCategory: 'Lip Balm',
    department: 'Beauty',
    gender: 'Women',
    retailPrice: 40,
    image: 'https://images.unsplash.com/photo-1599733589046-2fb8f4862f1c?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=85&w=1000',
    description: 'The legendary color-reviving lip balm formulated with 97% natural-origin ingredients for 24h hydration.',
    volume: '3.2 g',
    colors: [{ name: '001 Pink', hex: 'pink' }],
    details: ['Cherry oil infused', 'Made in France'],
    rating: 4.9,
    reviewCount: 480,
    collection: 'Christian Dior Haute Parfumerie',
    isBestSeller: true,
    isActive: true,
    supplierInventory: [{ storeId: 'store-1', wholesaleCost: 22, stock: 50 }]
  },
  {
    id: 'prod-chanel-les-beiges-foundation',
    name: 'Chanel Les Beiges Healthy Glow Foundation',
    brand: 'Chanel',
    category: 'MAKEUP',
    subCategory: 'Foundation',
    department: 'Beauty',
    gender: 'Women',
    retailPrice: 60,
    image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=85&w=1000',
    description: 'A luminous, long-wearing fluid foundation that creates a fresh, healthy outdoor glow instantly.',
    volume: '30 ml',
    colors: [{ name: 'B20 Light', hex: '#EED9C4' }],
    details: ['Hydrating breathable formula', 'Made in France'],
    rating: 4.8,
    reviewCount: 195,
    collection: 'Chanel Les Beiges',
    isNew: true,
    isActive: true,
    supplierInventory: [{ storeId: 'store-2', wholesaleCost: 35, stock: 25 }]
  },

  // --- LUXURY FRAGRANCE & PERFUMES ---
  {
    id: 'prod-dior-jadore-lor',
    name: 'J’adore L’Or Essence de Parfum',
    brand: 'Christian Dior',
    category: 'FRAGRANCE',
    subCategory: 'Parfum',
    department: 'Beauty',
    gender: 'Women',
    retailPrice: 220,
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=85&w=1000',
    description: 'J’adore L’Or exalts the floral beauty of J’adore by playing with its flowers. Francis Kurkdjian highlights the floral nuance of orange blossom, jasmine grandiflorum, and centifolia rose absolutes.',
    volume: '50 ml',
    details: [
      'Notes: Orange Blossom, Jasmine Grandiflorum, Centifolia Rose',
      'Hand-sealed amphora bottle with golden necklace',
      'Made in France'
    ],
    rating: 5.0,
    reviewCount: 164,
    collection: 'Christian Dior Haute Parfumerie',
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supplierInventory: [
      { storeId: 'store-1', wholesaleCost: 130, stock: 20 },
      { storeId: 'store-2', wholesaleCost: 130, stock: 15 }
    ]
  },
  {
    id: 'prod-miss-dior-parfum',
    name: 'Miss Dior Parfum',
    brand: 'Christian Dior',
    category: 'FRAGRANCE',
    subCategory: 'Parfum',
    department: 'Beauty',
    gender: 'Women',
    retailPrice: 175,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=85&w=1000',
    description: 'Francis Kurkdjian reinvents Miss Dior with a fragrance that marries star jasmine with fruity starburst accords and woody amber base notes.',
    volume: '80 ml',
    details: [
      'Notes: Red Berry Accord, Star Jasmine, Amber Wood',
      'Adorned with the iconic "poignard" bow',
      'Made in France'
    ],
    rating: 4.9,
    reviewCount: 220,
    collection: 'Christian Dior Haute Parfumerie',
    isNew: true,
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supplierInventory: [
      { storeId: 'store-2', wholesaleCost: 100, stock: 25 },
      { storeId: 'store-3', wholesaleCost: 100, stock: 18 }
    ]
  },
  {
    id: 'prod-dior-sauvage-elixir',
    name: 'Sauvage Elixir',
    brand: 'Christian Dior',
    category: 'FRAGRANCE',
    subCategory: 'Parfum',
    department: 'Beauty',
    gender: 'Men',
    retailPrice: 250,
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=85&w=1000',
    description: 'An extraordinarily concentrated fragrance steeped in the iconic freshness of Sauvage with an intoxicating heart of spices, bespoke lavender essence and rich woods.',
    volume: '60 ml',
    details: [
      'Notes: Cinnamon, Nutmeg, Lavender, Licorice, Amber, Haitian Vetiver',
      'Midnight blue glass bottle with silver engraved typography',
      'Made in France'
    ],
    rating: 5.0,
    reviewCount: 410,
    collection: 'Christian Dior Haute Parfumerie',
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supplierInventory: [
      { storeId: 'store-1', wholesaleCost: 150, stock: 30 },
      { storeId: 'store-4', wholesaleCost: 150, stock: 20 }
    ]
  },
  {
    id: 'prod-gris-dior-privée',
    name: 'Gris Dior - La Collection Privée',
    brand: 'Christian Dior',
    category: 'FRAGRANCE',
    subCategory: 'Niche Perfume',
    department: 'Beauty',
    gender: 'Unisex',
    retailPrice: 320,
    image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=85&w=1000',
    description: 'The olfactory translation of the iconic Dior grey. A bold chypre fragrance that defies convention, mingling citrus top notes with Turkish rose and oakmoss.',
    volume: '125 ml',
    details: [
      'Notes: Bergamot, Turkish Rose, Patchouli, Amber, Oakmoss',
      'Collector glass bottle with magnetic cap',
      'Made in France'
    ],
    rating: 4.9,
    reviewCount: 145,
    collection: 'Christian Dior Haute Parfumerie',
    isBestSeller: true,
    isExclusive: true,
    isFeatured: true,
    isActive: true,
    supplierInventory: [
      { storeId: 'store-1', wholesaleCost: 195, stock: 12 },
      { storeId: 'store-2', wholesaleCost: 195, stock: 10 }
    ]
  },
  {
    id: 'prod-chanel-no5-edp',
    name: 'Chanel No. 5 Eau de Parfum',
    brand: 'Chanel',
    category: 'FRAGRANCE',
    subCategory: 'Perfume',
    department: 'Beauty',
    gender: 'Women',
    retailPrice: 168,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=85&w=1000',
    secondaryImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=85&w=1000',
    description: 'The ultimate essence of femininity. A timeless, legendary floral aldehyde bouquet housed in an iconic minimalist geometric bottle.',
    volume: '100 ml',
    details: [
      'Notes: May Rose, Jasmine, Aldehydes, Bourbon Vanilla',
      'Made in France'
    ],
    rating: 5.0,
    reviewCount: 520,
    collection: 'Chanel Haute Parfumerie',
    isBestSeller: true,
    isFeatured: true,
    isActive: true,
    supplierInventory: [
      { storeId: 'store-2', wholesaleCost: 95, stock: 40 },
      { storeId: 'store-3', wholesaleCost: 95, stock: 30 }
    ]
  }
];
