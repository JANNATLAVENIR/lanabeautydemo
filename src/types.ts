export interface LocalStore {
  id: string;
  name: string;
  neighborhood: string;
  contactPerson: string;
  phone: string;
  rating: number;
  isActive: boolean;
}

export interface SupplierInventory {
  storeId: string;
  wholesaleCost: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  subCategory?: string;
  department?: 'Fashion' | 'Beauty' | 'Bodycare' | 'Accessories' | string;
  gender?: 'Women' | 'Men' | 'Unisex';
  retailPrice: number;
  originalPrice?: number;
  image: string;
  secondaryImage?: string;
  images?: string[];
  description: string;
  volume?: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  details?: string[];
  ingredients?: string;
  savoirFaire?: string;
  rating?: number;
  reviewCount?: number;
  collection?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isExclusive?: boolean;
  isActive: boolean;
  supplierInventory: SupplierInventory[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  brand?: string;
  category: string;
  price: number;
  quantity: number;
  image: string;
  size?: string;
  color?: string;
  selectedStoreId?: string;
  wholesaleCost?: number;
}

export type OrderStatus = 'Pending' | 'In Progress' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  city: string;
  postalCode?: string;
  shippingMethod?: string;
  paymentMethod?: string;
  giftWrapping?: boolean;
  giftMessage?: string;
  notes?: string;
  items: OrderItem[];
  subtotal?: number;
  shippingFee?: number;
  totalPrice: number;
  status: OrderStatus;
  paymentStatus?: string;
  createdAt: string;
  assignedStoreIds?: Record<string, string>; // productId -> storeId
}

export interface ImageCropSettings {
  zoom: number;
  panX: number;
  panY: number;
  focalX: number;
  focalY: number;
  aspectRatio: string;
  fit: string;
}

export interface HomepageBanner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  slideImages?: string[];
  autoSlide?: boolean;
  slideInterval?: number;
  ctaText?: string;
  linkView?: string;
  active: boolean;
  imagePosition?: string;
  overlayOpacity?: string;
  crop?: ImageCropSettings;
}

export interface SocialLinksSettings {
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  pinterest?: string;
  twitter?: string;
  youtube?: string;
  snapchat?: string;
}

export interface StoreContactSettings {
  storeName?: string;
  whatsappNumber?: string;
  whatsappGreeting?: string;
  whatsappFloatingActive?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  businessHours?: string;
}

export interface HomepageSettings {
  heroFashionImage: string;
  heroFashionVideo?: string;
  heroFashionMediaType?: 'image' | 'video';
  heroFashionSlideImages?: string[];
  heroFashionAutoSlide?: boolean;
  heroFashionSlideInterval?: number;
  heroFashionTitle: string;
  heroFashionEyebrow?: string;
  heroFashionCta?: string;
  heroFashionImagePosition?: string;
  heroFashionOverlayOpacity?: string;
  heroFashionActive?: boolean;
  heroFashionCrop?: ImageCropSettings;
  heroBeautyImage: string;
  heroBeautyVideo?: string;
  heroBeautyMediaType?: 'image' | 'video';
  heroBeautySlideImages?: string[];
  heroBeautyAutoSlide?: boolean;
  heroBeautySlideInterval?: number;
  heroBeautyTitle: string;
  heroBeautyEyebrow?: string;
  heroBeautyCta?: string;
  heroBeautyImagePosition?: string;
  heroBeautyOverlayOpacity?: string;
  heroBeautyActive?: boolean;
  heroBeautyCrop?: ImageCropSettings;
  additionalBanners?: HomepageBanner[];
  
  // Social & WhatsApp Management
  whatsappNumber?: string;
  whatsappGreeting?: string;
  whatsappFloatingActive?: boolean;
  socialLinks?: SocialLinksSettings;
  contactInfo?: StoreContactSettings;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  department?: 'Fashion' | 'Beauty' | 'Bodycare' | 'Accessories' | string;
  subCategories?: string[];
}

export interface EditorialStory {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  date: string;
  readTime: string;
  heroImage: string;
  secondaryImage?: string;
  excerpt: string;
  content: string[];
  quote?: string;
  relatedProductIds: string[];
}

export interface BrandInfo {
  id: string;
  name: string;
  tagline: string;
  origin: string;
  established: string;
  description: string;
  heroImage: string;
  logoText: string;
  featuredProductIds: string[];
}

export interface CollectionData {
  id: string;
  title: string;
  subtitle: string;
  season: string;
  description: string;
  heroImage: string;
  secondaryImage: string;
  productIds: string[];
}

export interface RoadmapPhase {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  status: string;
  date: string;
}

export interface UserAddress {
  id: string;
  title: string;
  recipient: string;
  street: string;
  city: string;
  phone: string;
  isDefault: boolean;
}

export interface UserAccount {
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  memberTier: 'Privilège' | 'Maison VIP' | 'Haute Cercle';
  memberSince: string;
  createdAt?: string;
  savedAddresses: UserAddress[];
  preferences: {
    newsletter: boolean;
    smsAlerts: boolean;
    scentFamily: string;
    favoriteCategory: string;
  };
}

export interface ProductReview {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export type ActiveView = 
  | 'home'
  | 'fashion'
  | 'beauty'
  | 'bodycare'
  | 'accessories'
  | 'catalog'
  | 'pdp'
  | 'cart'
  | 'checkout'
  | 'account'
  | 'wishlist'
  | 'brands'
  | 'brand-detail'
  | 'collections'
  | 'collection-detail'
  | 'stories'
  | 'story-detail'
  | 'services'
  | 'admin';
