import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, Loader2, Shield } from 'lucide-react';

// Navigation & Layout Components
import { LanaHeader } from './components/LanaHeader';
import { MobileMenu } from './components/MobileMenu';
import { HeroCampaign } from './components/HeroCampaign';
import { ProductGridSection } from './components/ProductGridSection';
import { LuxuryFooter } from './components/LuxuryFooter';

// Luxury Landing & Detail Pages
import { FashionLanding } from './components/FashionLanding';
import { BeautyLanding } from './components/BeautyLanding';
import { PLPView } from './components/PLPView';
import { PDPView } from './components/PDPView';
import { CartPage } from './components/CartPage';
import { CheckoutPage } from './components/CheckoutPage';
import { AccountPortal } from './components/AccountPortal';

// Drawers & Modals
import { CartDrawer, CartItem } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AdminPortal } from './components/AdminPortal';
import { SearchOverlay } from './components/SearchOverlay';
import { CountrySelectorModal } from './components/CountrySelectorModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { DiorSignupModal } from './components/DiorSignupModal';
import { LegalPoliciesModal, LegalPolicyTab } from './components/LegalPoliciesModal';
import { FAQModal } from './components/FAQModal';

// Types & Data
import { Product, Category, Order, ActiveView, BrandInfo, CollectionData, EditorialStory, HomepageSettings } from './types';
import { LUXURY_CATEGORIES } from './data/luxuryData';

import { ALL_LUXURY_PRODUCTS, PRODUCT_CATEGORIES } from './constants';

export default function App() {
  const [categories, setCategories] = useState<Category[]>(PRODUCT_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(ALL_LUXURY_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Active View Navigation State
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<BrandInfo | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<CollectionData | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedStory, setSelectedStory] = useState<EditorialStory | null>(null);

  // Modals & Overlay States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isDiorModalOpen, setIsDiorModalOpen] = useState(false);
  const [diorEmail, setDiorEmail] = useState('');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalPolicyTab>('shipping');
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);

  // Accessibility & Localization State
  const [selectedCountryName, setSelectedCountryName] = useState('International (English)');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);

  // Cart & Wishlist States
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [orderConfirmationData, setOrderConfirmationData] = useState<{
    orderId: string;
    whatsappUrl: string;
    order: any;
  } | null>(null);

  // Fetch initial data & live catalog synchronization with resilient retry
  const syncProducts = useCallback(async (retryCount = 0) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const ts = Date.now();
      const [prodRes, homeRes, catRes] = await Promise.all([
        fetch(`/api/products?_t=${ts}`, { cache: 'no-store', signal: controller.signal }).catch(() => null),
        fetch(`/api/homepage-settings?_t=${ts}`, { cache: 'no-store', signal: controller.signal }).catch(() => null),
        fetch(`/api/categories?_t=${ts}`, { cache: 'no-store', signal: controller.signal }).catch(() => null)
      ]);
      clearTimeout(timeoutId);

      let prodData: any = null;
      if (prodRes && prodRes.ok) {
        const ct = prodRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          prodData = await prodRes.json().catch(() => null);
        }
      }

      if (Array.isArray(prodData) && prodData.length > 0) {
        setProducts(prodData);
      } else if (retryCount < 2 && (!prodRes || !prodRes.ok)) {
        // Cold start retry
        setTimeout(() => syncProducts(retryCount + 1), 2500);
      }

      let homeData: any = null;
      if (homeRes && homeRes.ok) {
        const ct = homeRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          homeData = await homeRes.json().catch(() => null);
        }
      }
      if (homeData) {
        setHomepageSettings(homeData);
        try {
          window.dispatchEvent(new CustomEvent('lana_settings_updated', { detail: homeData }));
        } catch {}
      }

      let catData: any = null;
      if (catRes && catRes.ok) {
        const ct = catRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          catData = await catRes.json().catch(() => null);
        }
      }
      if (Array.isArray(catData) && catData.length > 0) {
        setCategories(catData);
      }
    } catch (error) {
      console.warn('Live catalog sync note:', error);
      if (retryCount < 2) {
        setTimeout(() => syncProducts(retryCount + 1), 2500);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncProducts();
  }, [syncProducts]);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for real-time settings updates from Admin Portal
  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e.detail) {
        setHomepageSettings(e.detail);
      }
    };
    window.addEventListener('lana_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('lana_settings_updated', handleSettingsUpdated);
  }, []);

  // Admin secret shortcut listener (Ctrl + Shift + A or Cmd + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load wishlist & cart from localStorage
  useEffect(() => {
    try {
      const savedWishlist = localStorage.getItem('lana_wishlist');
      if (savedWishlist) {
        const parsed = JSON.parse(savedWishlist);
        if (Array.isArray(parsed)) setWishlistItems(parsed);
      }

      const savedCart = localStorage.getItem('lana_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCartItems(parsed);
      }
    } catch (e) {
      console.error('Error loading local storage:', e);
    }
  }, []);

  // Sync wishlist with localStorage
  const saveWishlist = useCallback((items: Product[]) => {
    try {
      localStorage.setItem('lana_wishlist', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving wishlist:', e);
    }
  }, []);

  // Sync cart with localStorage
  const saveCart = useCallback((items: CartItem[]) => {
    try {
      localStorage.setItem('lana_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }, []);

  // Wishlist actions
  const toggleWishlist = useCallback((product: Product) => {
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      let updated;
      if (exists) {
        updated = prev.filter((item) => item.id !== product.id);
      } else {
        updated = [...prev, product];
      }
      saveWishlist(updated);
      return updated;
    });
  }, [saveWishlist]);

  const handleRemoveFromWishlist = useCallback((productId: string) => {
    setWishlistItems((prev) => {
      const updated = prev.filter((item) => item.id !== productId);
      saveWishlist(updated);
      return updated;
    });
  }, [saveWishlist]);

  const handleEmptyWishlist = useCallback(() => {
    setWishlistItems([]);
    saveWishlist([]);
  }, [saveWishlist]);

  // Cart actions
  const handleAddToCart = useCallback((product: Product, quantity = 1, options?: { size?: string; color?: string }) => {
    setCartItems((prev) => {
      const existing = prev.find(
        (item) =>
          item.product.id === product.id &&
          item.selectedSize === options?.size &&
          item.selectedColor === options?.color
      );
      let updated;
      if (existing) {
        updated = prev.map((item) =>
          item.product.id === product.id &&
          item.selectedSize === options?.size &&
          item.selectedColor === options?.color
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updated = [
          ...prev,
          {
            product,
            quantity,
            selectedSize: options?.size,
            selectedColor: options?.color
          }
        ];
      }
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const handleUpdateCartQuantity = useCallback((productId: string, delta: number) => {
    setCartItems((prev) => {
      const updated = prev
          .map((item) => {
            if (item.product.id === productId) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : item;
            }
            return item;
          })
          .filter((item) => item.quantity > 0);
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const handleRemoveCartItem = useCallback((productId: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.product.id !== productId);
      saveCart(updated);
      return updated;
    });
  }, [saveCart]);

  const handleClearCart = useCallback(() => {
    setCartItems([]);
    saveCart([]);
  }, [saveCart]);

  const handleMoveToCart = useCallback((product: Product) => {
    handleAddToCart(product, 1);
    handleRemoveFromWishlist(product.id);
  }, [handleAddToCart, handleRemoveFromWishlist]);

  // View Navigation Router Handler
  const handleNavigateToView = useCallback((view: ActiveView | string, extra?: any) => {
    let targetView = view as ActiveView;
    const viewLower = String(view).toLowerCase();
    
    if (viewLower === 'fashion' || viewLower === 'fashion-and-accessories' || viewLower === 'fashion & accessories') {
      targetView = 'catalog';
      setSelectedCategory('ALL');
      setSelectedDepartment('FASHION');
      setSearchQuery('');
    } else if (viewLower === 'beauty' || viewLower === 'fragrance-and-beauty' || viewLower === 'fragrance & beauty') {
      targetView = 'catalog';
      setSelectedCategory('ALL');
      setSelectedDepartment('BEAUTY');
      setSearchQuery('');
    } else if (
      viewLower !== 'home' &&
      viewLower !== 'catalog' &&
      viewLower !== 'pdp' &&
      viewLower !== 'cart' &&
      viewLower !== 'checkout' &&
      viewLower !== 'account' &&
      viewLower !== 'wishlist' &&
      viewLower !== 'brands' &&
      viewLower !== 'brand-detail' &&
      viewLower !== 'collections' &&
      viewLower !== 'collection-detail' &&
      viewLower !== 'stories' &&
      viewLower !== 'story-detail' &&
      viewLower !== 'services' &&
      viewLower !== 'admin'
    ) {
      // Custom department clicked! Route to catalog with custom department and search prefilled
      targetView = 'catalog';
      setSelectedCategory('ALL');
      
      const matchingBanner = homepageSettings?.additionalBanners?.find(
        (b) => b.id === view || b.linkView === view || b.id === `dept-banner-${viewLower}` || (b.title && b.title.toLowerCase() === viewLower)
      );

      const deptTitle = matchingBanner?.title || view.replace('dept-banner-', '').replace(/-/g, ' ');
      setSelectedDepartment(deptTitle);
      setSearchQuery('');
    } else {
      if (viewLower === 'home') {
        setSelectedDepartment(null);
      } else if (extra?.department) {
        setSelectedDepartment(extra.department);
      }
      if (extra?.category) {
        setSelectedCategory(extra.category);
      }
    }
    setActiveView(targetView);
    if (extra?.search !== undefined) setSearchQuery(extra.search);
    if (extra?.brand) setSelectedBrand(extra.brand);
    if (extra?.collection) setSelectedCollection(extra.collection);
    if (extra?.product) setSelectedProduct(extra.product);
    if (extra?.story) setSelectedStory(extra.story);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [homepageSettings]);

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const wishlistIds = useMemo(() => wishlistItems.map((p) => p.id), [wishlistItems]);

  // New arrivals & trending items
  const newArrivals = useMemo(() => {
    return (products || []).filter((p) => p.isNew)?.length > 0
      ? (products || []).filter((p) => p.isNew)
      : products?.slice(0, 8);
  }, [products]);

  const trendingItems = useMemo(() => {
    return products?.slice(4, 12)?.length > 0 ? products.slice(4, 12) : products;
  }, [products]);

  return (
    <div
      className={`min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white ${
        highContrast ? 'contrast-125' : ''
      } ${largeText ? 'text-lg' : ''}`}
    >
      {/* 1. MOBILE-FIRST GLOBAL LUXURY NAVIGATION BAR */}
      <LanaHeader
        cartCount={cartCount}
        wishlistCount={wishlistItems?.length || 0}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAccount={() => handleNavigateToView('account')}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        activeView={activeView}
        onNavigateToView={handleNavigateToView}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveView('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        selectedCategory={selectedCategory}
      />

      {/* 2. FULL-SCREEN NESTED MOBILE MENU */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavigateToView={handleNavigateToView}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveView('catalog');
        }}
        wishlistCount={wishlistItems?.length || 0}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAccount={() => handleNavigateToView('account')}
        onOpenCountrySelector={() => setIsCountryModalOpen(true)}
        selectedCountryName={selectedCountryName}
      />

      {/* 3. MAIN APPLICATION CONTENT ROUTER */}
      <main className="min-h-screen">
        {/* VIEW: HOME (MOBILE-FIRST LUXURY EDITORIAL EXPERIENCE) */}
        {activeView === 'home' && (
          <div>
            {/* Dual Cinematic Campaigns & Department Hero Portals */}
            <HeroCampaign
              onNavigateFashion={() => handleNavigateToView('fashion')}
              onNavigateBeauty={() => handleNavigateToView('beauty')}
              onNavigateView={handleNavigateToView}
              settings={homepageSettings}
            />
          </div>
        )}

        {/* VIEW: FASHION LANDING */}
        {activeView === 'fashion' && (
          <FashionLanding
            products={products}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onViewDetails={(p) => {
              setSelectedProduct(p);
              setActiveView('pdp');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectSubCategory={(subCat) => {
              setSelectedCategory('FASHION');
              setActiveView('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateHome={() => handleNavigateToView('home')}
          />
        )}

        {/* VIEW: BEAUTY LANDING */}
        {activeView === 'beauty' && (
          <BeautyLanding
            products={products}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onViewDetails={(p) => {
              setSelectedProduct(p);
              setActiveView('pdp');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectSubCategory={(subCat) => {
              setSelectedCategory('FRAGRANCE');
              setActiveView('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateHome={() => handleNavigateToView('home')}
          />
        )}

        {/* VIEW: CATALOG (PLP) */}
        {activeView === 'catalog' && (
          <PLPView
            products={products}
            allProducts={products}
            selectedCategory={selectedCategory}
            customDepartment={selectedDepartment || undefined}
            homepageSettings={homepageSettings}
            categories={categories}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onViewDetails={(p) => {
              setSelectedProduct(p);
              setActiveView('pdp');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            searchQuery={searchQuery}
            onNavigateHome={() => handleNavigateToView('home')}
          />
        )}

        {/* VIEW: BODYCARE PLP */}
        {activeView === 'bodycare' && (
          <PLPView
            products={products}
            allProducts={products}
            selectedCategory="BODYCARE"
            initialDepartment="BODYCARE"
            categories={categories}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onViewDetails={(p) => {
              setSelectedProduct(p);
              setActiveView('pdp');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateHome={() => handleNavigateToView('home')}
          />
        )}

        {/* VIEW: ACCESSORIES PLP */}
        {activeView === 'accessories' && (
          <PLPView
            products={products}
            allProducts={products}
            selectedCategory="ACCESSORIES"
            initialDepartment="ACCESSORIES"
            categories={categories}
            wishlistIds={wishlistIds}
            onToggleWishlist={toggleWishlist}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onViewDetails={(p) => {
              setSelectedProduct(p);
              setActiveView('pdp');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateHome={() => handleNavigateToView('home')}
          />
        )}

        {/* VIEW: PRODUCT DETAIL (PDP) */}
        {activeView === 'pdp' && (
          <PDPView
            product={selectedProduct || products[0]}
            allProducts={products}
            isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
            onToggleWishlist={() => selectedProduct && toggleWishlist(selectedProduct)}
            onAddToCart={(prod, qty, opts) => handleAddToCart(prod, qty || 1, opts)}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectRelatedProduct={(p) => {
              setSelectedProduct(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateToCart={() => setIsCartOpen(true)}
            onBackToCatalog={() => setActiveView('catalog')}
            onNavigateToCatalog={(cat) => {
              setSelectedCategory(cat);
              setActiveView('catalog');
            }}
          />
        )}

        {/* VIEW: CART PAGE */}
        {activeView === 'cart' && (
          <CartPage
            items={cartItems}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onProceedToCheckout={() => setActiveView('checkout')}
            onContinueShopping={() => setActiveView('catalog')}
          />
        )}

        {/* VIEW: CHECKOUT PAGE */}
        {activeView === 'checkout' && (
          <CheckoutPage
            items={cartItems}
            onBackToCart={() => setActiveView('cart')}
            onOrderSuccess={(orderData) => {
              setOrderConfirmationData(orderData);
              handleClearCart();
              setActiveView('home');
            }}
          />
        )}

        {/* VIEW: ACCOUNT PORTAL */}
        {activeView === 'account' && (
          <AccountPortal
            orders={orders}
            wishlistProducts={wishlistItems}
            wishlistItems={wishlistItems}
            onNavigateHome={() => handleNavigateToView('home')}
            onOpenWishlist={() => setIsWishlistOpen(true)}
            onNavigateToCatalog={() => {
              setActiveView('catalog');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAdmin={() => handleNavigateToView('admin')}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setActiveView('pdp');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

      </main>

      {/* 4. LUXURY EDITORIAL ACCORDION FOOTER */}
      <LuxuryFooter
        socialLinks={homepageSettings?.socialLinks}
        contactInfo={homepageSettings?.contactInfo}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveView('catalog');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToView={handleNavigateToView}
        onOpenCountrySelector={() => setIsCountryModalOpen(true)}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenLegalPolicy={(tab) => {
          if (tab) setLegalModalTab(tab);
          setIsLegalModalOpen(true);
        }}
        onOpenFAQ={() => setIsFaqModalOpen(true)}
        onOpenConcierge={() => {
          let num = '';
          let isWaEnabled = true;
          try {
            const cached = localStorage.getItem('lana_site_settings_cache');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.whatsappEnabled === false) isWaEnabled = false;
              if (parsed.contactInfo?.whatsappEnabled === false) isWaEnabled = false;
              const p = parsed.whatsappNumber || parsed.contactInfo?.whatsappNumber || parsed.contactInfo?.contactPhone;
              if (p) num = String(p).replace(/[^0-9]/g, '');
            }
          } catch {}
          if (!num && homepageSettings) {
            if (homepageSettings.whatsappEnabled === false) isWaEnabled = false;
            const p = homepageSettings.whatsappNumber || homepageSettings.contactInfo?.whatsappNumber || homepageSettings.contactInfo?.contactPhone;
            if (p) num = String(p).replace(/[^0-9]/g, '');
          }
          if (isWaEnabled && num) {
            window.open(`https://wa.me/${num}?text=${encodeURIComponent('Salam Maison LANA Concierge, I would like assistance.')}`, '_blank');
          } else {
            setIsAdminOpen(true);
          }
        }}
        selectedCountryName={selectedCountryName}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(!highContrast)}
        onSubscribeEmail={(email) => {
          setDiorEmail(email);
          setIsDiorModalOpen(true);
        }}
      />

      {/* 6. DRAWERS & MODALS */}
      {/* Shopping Bag Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOrderCreated={(orderData) => {
          setOrderConfirmationData(orderData);
          handleClearCart();
          setIsCartOpen(false);
        }}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlistItems}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onAddToBag={(p) => handleAddToCart(p, 1)}
        onEmptyWishlist={handleEmptyWishlist}
        onMoveToCart={handleMoveToCart}
      />

      {/* Full-Screen Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={(p) => {
          setSelectedProduct(p);
          setActiveView('pdp');
          setIsSearchOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveView('catalog');
          setIsSearchOpen(false);
        }}
        onNavigateToView={handleNavigateToView}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
      />

      {/* Order Confirmation Modal */}
      {orderConfirmationData && (
        <OrderConfirmationModal
          orderData={orderConfirmationData}
          onClose={() => setOrderConfirmationData(null)}
          onOpenTracker={() => {
            setOrderConfirmationData(null);
            setIsTrackerOpen(true);
          }}
        />
      )}

      {/* Admin Portal Modal */}
      {isAdminOpen && (
        <AdminPortal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
          onProductsChanged={syncProducts}
        />
      )}

      {/* Country & Region Selector Modal */}
      <CountrySelectorModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCountry={selectedCountryName}
        onSelectCountry={(country) => setSelectedCountryName(country)}
      />

      {/* Accessibility Modal */}
      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        largeText={largeText}
        setLargeText={setLargeText}
      />

      {/* Dior-style Newsletter & Account Signup Modal */}
      <DiorSignupModal
        isOpen={isDiorModalOpen}
        onClose={() => setIsDiorModalOpen(false)}
        initialEmail={diorEmail}
        onNavigateToView={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Legal & Policies Modal */}
      <LegalPoliciesModal
        isOpen={isLegalModalOpen}
        initialTab={legalModalTab}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Luxury FAQ Modal */}
      <FAQModal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        onOpenConcierge={() => {
          const btn = document.getElementById('whatsapp-concierge-toggle');
          if (btn) btn.click();
        }}
      />
    </div>
  );
}
