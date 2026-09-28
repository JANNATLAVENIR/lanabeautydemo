import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, Heart, User, Shield, Sparkles } from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import { ActiveView } from '../types';

import jannatLogo from '../assets/images/jannat_lavenir_logo_1790575537199.jpg';

export interface LuxuryNavbarProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  isAdminActive: boolean;
  activeView: ActiveView;
  onNavigateToView: (view: ActiveView, extra?: any) => void;
  onSelectCategory: (category: string) => void;
  selectedCategory?: string;
}

export const LuxuryNavbar: React.FC<LuxuryNavbarProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenAccount,
  onOpenAdmin,
  isAdminActive,
  activeView,
  onNavigateToView,
  onSelectCategory,
  selectedCategory
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTransparent = activeView === 'home' && !isScrolled && !activeMegaMenu;

  const mainNavItems = [
    { label: 'Fashion', menuKey: 'fashion', view: 'fashion' as ActiveView, category: 'FASHION' },
    { label: 'Beauty', menuKey: 'beauty', view: 'beauty' as ActiveView, category: 'FRAGRANCE' },
    { label: 'Bodycare', menuKey: 'bodycare', view: 'bodycare' as ActiveView, category: 'BODYCARE' },
    { label: 'Accessories', menuKey: 'accessories', view: 'accessories' as ActiveView, category: 'ACCESSORIES' },
    { label: 'New Arrivals', menuKey: 'new', view: 'catalog' as ActiveView, category: 'ALL' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 font-sans ${
        isTransparent
          ? 'bg-gradient-to-b from-black/70 via-black/30 to-transparent text-white'
          : 'bg-white/95 backdrop-blur-md text-neutral-900 border-b border-neutral-200/80 shadow-[0_2px_20px_rgba(0,0,0,0.03)]'
      }`}
      onMouseLeave={() => setActiveMegaMenu(null)}
    >
      <div className="max-w-[1780px] mx-auto px-6 sm:px-10 lg:px-12 h-20 sm:h-22 flex items-center justify-between">
        {/* Left: Brand Monogram / Wordmark */}
        <div className="flex items-center gap-6">
          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 -ml-1.5 focus:outline-none cursor-pointer transition-opacity hover:opacity-75"
            aria-label="Toggle navigation menu"
            id="mobile-nav-toggle"
          >
            {isMobileMenuOpen ? (
              <X size={22} strokeWidth={1.5} className={isTransparent ? 'text-white' : 'text-neutral-900'} />
            ) : (
              <Menu size={22} strokeWidth={1.5} className={isTransparent ? 'text-white' : 'text-neutral-900'} />
            )}
          </button>

          {/* JANNAT L'AVENIR Official Brand Logo */}
          <button
            onClick={() => {
              onNavigateToView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group text-left cursor-pointer flex items-center select-none py-1"
          >
            <img
              src={jannatLogo}
              alt="JANNAT L'AVENIR"
              className={`h-10 sm:h-12 md:h-14 w-auto object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105 ${
                isTransparent ? 'brightness-200 contrast-125 filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.8)]' : ''
              }`}
            />
          </button>
        </div>

        {/* Center: Desktop Luxury Navigation */}
        <nav className="hidden lg:flex items-center gap-7 xl:gap-9">
          {mainNavItems.map((item) => {
            const isActive =
              (item.view === activeView && (item.view === 'fashion' || item.view === 'beauty' || item.view === 'stories' || item.view === 'services')) ||
              (activeView === 'catalog' && selectedCategory === item.category);

            return (
              <div
                key={item.label}
                onMouseEnter={() => {
                  if (item.menuKey) setActiveMegaMenu(item.menuKey);
                  else setActiveMegaMenu(null);
                }}
                className="relative py-7"
              >
                <button
                  onClick={() => {
                    if (item.view === 'fashion' || item.view === 'beauty' || item.view === 'stories' || item.view === 'services') {
                      onNavigateToView(item.view);
                    } else {
                      onSelectCategory(item.category);
                      onNavigateToView('catalog');
                    }
                    setActiveMegaMenu(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`text-[11px] uppercase tracking-[0.24em] font-medium transition-all duration-300 cursor-pointer group flex items-center gap-1 ${
                    isTransparent
                      ? 'text-white/90 hover:text-white drop-shadow-sm'
                      : isActive
                      ? 'text-neutral-900 font-bold'
                      : 'text-neutral-600 hover:text-neutral-950'
                  }`}
                >
                  <span>{item.label}</span>
                  {/* Subtle Underline */}
                  <span
                    className={`absolute bottom-5 left-0 h-[1.5px] transition-all duration-300 ease-out ${
                      isActive
                        ? isTransparent
                          ? 'w-full bg-white'
                          : 'w-full bg-neutral-900'
                        : isTransparent
                        ? 'w-0 group-hover:w-full bg-white/80'
                        : 'w-0 group-hover:w-full bg-neutral-900'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </nav>

        {/* Right: Client Actions (Search, Account, Wishlist, Bag) */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className={`p-1.5 transition-opacity hover:opacity-75 cursor-pointer flex items-center gap-2 ${
              isTransparent ? 'text-white drop-shadow-sm' : 'text-neutral-900'
            }`}
            aria-label="Search"
            title="Search"
            id="luxury-nav-search-btn"
          >
            <Search size={18} strokeWidth={1.5} />
            <span className="hidden xl:inline text-[10.5px] uppercase tracking-[0.2em] font-medium">
              Search
            </span>
          </button>

          {/* Account Portal */}
          <button
            onClick={onOpenAccount}
            className={`p-1.5 transition-opacity hover:opacity-75 cursor-pointer flex items-center gap-1.5 ${
              isTransparent ? 'text-white drop-shadow-sm' : 'text-neutral-900'
            }`}
            aria-label="Client Account"
            title="Client Account"
            id="luxury-nav-account-btn"
          >
            <User size={18} strokeWidth={1.5} />
          </button>

          {/* Admin Switcher */}
          <button
            onClick={onOpenAdmin}
            className={`p-1.5 transition-opacity hover:opacity-75 cursor-pointer ${
              isTransparent ? 'text-white drop-shadow-sm' : 'text-neutral-900'
            }`}
            aria-label="Admin Portal"
            title="Admin Portal"
            id="luxury-nav-admin-btn"
          >
            {isAdminActive ? (
              <Shield size={17} strokeWidth={1.5} className="text-amber-500" />
            ) : (
              <Shield size={17} strokeWidth={1.5} className="opacity-40 hover:opacity-100" />
            )}
          </button>

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            className={`relative p-1.5 transition-opacity hover:opacity-75 cursor-pointer ${
              isTransparent ? 'text-white drop-shadow-sm' : 'text-neutral-900'
            }`}
            aria-label="Wishlist"
            title="Wishlist"
            id="luxury-nav-wishlist-btn"
          >
            <Heart
              size={18}
              strokeWidth={1.5}
              className={wishlistCount > 0 ? (isTransparent ? 'fill-white text-white' : 'fill-neutral-900 text-neutral-900') : ''}
            />
            {wishlistCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full ${
                  isTransparent ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'
                }`}
              >
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Shopping Bag / Cart */}
          <button
            onClick={onOpenCart}
            className={`relative p-1.5 transition-opacity hover:opacity-75 cursor-pointer flex items-center gap-2 ${
              isTransparent ? 'text-white drop-shadow-sm' : 'text-neutral-900'
            }`}
            aria-label="Shopping Bag"
            title="Shopping Bag"
            id="luxury-nav-cart-btn"
          >
            <ShoppingBag size={18} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full ${
                  isTransparent ? 'bg-white text-neutral-900' : 'bg-neutral-900 text-white'
                }`}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mega Menu Integration */}
      <MegaMenu
        isOpen={Boolean(activeMegaMenu)}
        activeMenu={activeMegaMenu}
        onClose={() => setActiveMegaMenu(null)}
        onSelectCategory={onSelectCategory}
        onNavigateToView={onNavigateToView}
      />

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/98 backdrop-blur-2xl flex flex-col justify-between p-8 sm:p-12 text-white pt-24 font-sans overflow-y-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <span className="font-serif tracking-[0.3em] text-2xl">LANA PARIS</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-neutral-400 hover:text-white"
            >
              <X size={22} />
            </button>
          </div>

          <div className="space-y-6 my-8">
            {[
              { label: 'Fashion & Couture', view: 'fashion', cat: 'FASHION' },
              { label: 'Beauty & Fragrance', view: 'beauty', cat: 'FRAGRANCE' },
              { label: 'Bodycare Rituals', view: 'bodycare', cat: 'BODYCARE' },
              { label: 'Haute Accessories', view: 'accessories', cat: 'ACCESSORIES' },
              { label: 'New Arrivals', view: 'catalog', cat: 'ALL' },
            ].map((link, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (link.view === 'fashion' || link.view === 'beauty' || link.view === 'stories' || link.view === 'services') {
                    onNavigateToView(link.view as ActiveView);
                  } else {
                    onSelectCategory(link.cat);
                    onNavigateToView('catalog');
                  }
                  setIsMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full text-left py-2 text-xl font-serif tracking-[0.15em] uppercase hover:text-amber-200 transition-colors flex items-center justify-between"
              >
                <span>{link.label}</span>
                <span className="text-xs text-neutral-500 font-mono">0{idx + 1}</span>
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 space-y-4">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAccount();
              }}
              className="block text-xs uppercase tracking-[0.25em] text-neutral-300 hover:text-white"
            >
              My Client Account
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="block text-xs uppercase tracking-[0.25em] text-neutral-400 hover:text-white"
            >
              Atelier Management Portal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
