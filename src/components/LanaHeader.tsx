import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Menu, User } from 'lucide-react';
import { ActiveView } from '../types';
import { MegaMenu } from './MegaMenu';
import { useI18n } from '../i18n';

export interface LanaHeaderProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenSearch: () => void;
  onOpenAccount: () => void;
  onOpenMobileMenu: () => void;
  onOpenAdmin?: () => void;
  activeView: ActiveView;
  onNavigateToView: (view: ActiveView, extra?: any) => void;
  onSelectCategory: (category: string) => void;
  selectedCategory?: string;
}

export const LanaHeader: React.FC<LanaHeaderProps> = ({
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenSearch,
  onOpenAccount,
  onOpenMobileMenu,
  onOpenAdmin,
  activeView,
  onNavigateToView,
  onSelectCategory,
  selectedCategory
}) => {
  const { t, isRtl } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [storeLogo, setStoreLogo] = useState<string>(() => {
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      return cached ? JSON.parse(cached).storeLogo || '' : '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    const handleSettingsUpdated = (e: any) => {
      if (e.detail?.storeLogo !== undefined) setStoreLogo(e.detail.storeLogo);
    };
    window.addEventListener('lana_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('lana_settings_updated', handleSettingsUpdated);
  }, []);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHeaderTouchStart = () => {
    if (!onOpenAdmin) return;

    // Start 5-second long press
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      onOpenAdmin();
    }, 5000);
  };

  const handleHeaderTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = activeView === 'home';
  const isDarkHeroView = isHome || activeView === 'fashion' || activeView === 'beauty';
  const isTransparent = isDarkHeroView && !activeMegaMenu;

  const showMenu = !isHome;
  const showSearch = !isHome;
  const showCart = cartCount > 0;
  const showAccount = true;

  const mainNavItems = [
    { label: t('Dior Fragrance'), keyName: 'fragrance', menuKey: null, view: 'catalog' as ActiveView, category: 'FRAGRANCE', department: 'BEAUTY' },
    { label: t('Haute Bags'), keyName: 'bags', menuKey: null, view: 'catalog' as ActiveView, category: 'BAGS', department: 'FASHION' },
    { label: t('Christian Dior'), keyName: 'dior', menuKey: null, view: 'catalog' as ActiveView, category: 'FRAGRANCE', department: 'BEAUTY' },
    { label: t('All Creations'), keyName: 'all', menuKey: null, view: 'catalog' as ActiveView, category: 'ALL', department: undefined },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 font-sans ${
        isTransparent
          ? 'bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white'
          : 'bg-white sm:bg-white/98 sm:backdrop-blur-md text-neutral-900 border-b border-neutral-200/70 shadow-xs'
      }`}
      onMouseLeave={() => setActiveMegaMenu(null)}
    >
      {/* Mobile & Desktop Header Container */}
      <div className="max-w-[1780px] mx-auto px-4 sm:px-8 lg:px-12 h-14 sm:h-16 lg:h-20 flex items-center justify-between relative">
        {/* LEFT: Mobile Menu Hamburger & Desktop Nav */}
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Mobile Menu Icon (LEFT) */}
          {showMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="p-2 -ml-2 focus:outline-none cursor-pointer transition-opacity hover:opacity-75 flex items-center justify-center"
              aria-label={t('Menu', 'Menu')}
              id="mobile-nav-toggle"
            >
              <Menu
                size={22}
                strokeWidth={1.5}
                className={isTransparent ? 'text-white' : 'text-neutral-900'}
              />
            </button>
          )}

          {/* Desktop Search Button */}
          {showSearch && (
            <button
              onClick={onOpenSearch}
              className={`hidden lg:flex items-center gap-2 text-xs uppercase tracking-[0.2em] transition-opacity hover:opacity-70 cursor-pointer ${
                isTransparent ? 'text-white' : 'text-neutral-700'
              }`}
            >
              <Search size={16} strokeWidth={1.5} />
              <span className="font-light">{t('Search')}</span>
            </button>
          )}
        </div>

        {/* CENTER: LANA Brand Logo (Visible on sub-pages) */}
        {!isHome && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <button
              onClick={() => onNavigateToView('home')}
              onTouchStart={handleHeaderTouchStart}
              onTouchEnd={handleHeaderTouchEnd}
              onMouseDown={handleHeaderTouchStart}
              onMouseUp={handleHeaderTouchEnd}
              className="font-serif text-xl sm:text-2xl tracking-[0.3em] font-light cursor-pointer select-none flex items-center justify-center"
            >
              {storeLogo ? (
                <img src={storeLogo} alt="LANA Logo" className="h-7 sm:h-9 object-contain" />
              ) : (
                'LANA'
              )}
            </button>
          </div>
        )}

        {/* RIGHT: Actions (Search, Account, Bag) */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          {/* Mobile Search Icon */}
          {showSearch && (
            <button
              onClick={onOpenSearch}
              className="lg:hidden p-2 text-current hover:opacity-75 transition-opacity cursor-pointer"
              aria-label={t('Search')}
              id="mobile-search-btn"
            >
              <Search size={20} strokeWidth={1.5} className={isTransparent ? 'text-white' : 'text-neutral-900'} />
            </button>
          )}

          {/* Account Icon */}
          {showAccount && (
            <button
              onClick={onOpenAccount}
              className="hidden sm:flex p-2 text-current hover:opacity-75 transition-opacity cursor-pointer items-center justify-center"
              aria-label={t('Account')}
              id="header-account-btn"
            >
              <User size={19} strokeWidth={1.5} className={isTransparent ? 'text-white' : 'text-neutral-900'} />
            </button>
          )}

          {/* Shopping Bag Icon */}
          {showCart && (
            <button
              onClick={onOpenCart}
              className="p-2 -mr-1.5 text-current hover:opacity-75 transition-opacity cursor-pointer relative flex items-center justify-center"
              aria-label={t('Shopping Bag')}
              id="header-cart-btn"
            >
              <ShoppingBag size={20} strokeWidth={1.5} className={isTransparent ? 'text-white' : 'text-neutral-900'} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-950 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* DESKTOP SECONDARY NAVIGATION ROW - Only shown on sub-pages */}
      {!isHome && (
        <div className="hidden lg:block border-t border-neutral-100/20">
          <nav className="max-w-[1780px] mx-auto px-12 h-11 flex items-center justify-center gap-8 xl:gap-10">
            {mainNavItems.map((item) => {
              const isActive =
                (item.view === activeView && (item.view === 'fashion' || item.view === 'beauty' || item.view === 'collections' || item.view === 'brands')) ||
                (activeView === 'catalog' && selectedCategory === item.category);

              return (
                <div
                  key={item.keyName}
                  onMouseEnter={() => {
                    if (item.menuKey) setActiveMegaMenu(item.menuKey);
                    else setActiveMegaMenu(null);
                  }}
                  className="h-full flex items-center relative"
                >
                  <button
                    onClick={() => {
                      setActiveMegaMenu(null);
                      if (item.view === 'catalog') {
                        onSelectCategory(item.category);
                        onNavigateToView('catalog', { category: item.category, department: item.department });
                      } else {
                        onNavigateToView(item.view);
                      }
                    }}
                    className={`text-[11px] uppercase tracking-[0.25em] font-medium transition-all duration-200 cursor-pointer h-full flex items-center border-b-2 ${
                      isActive
                        ? isTransparent
                          ? 'text-white border-white'
                          : 'text-black border-black'
                        : isTransparent
                        ? 'text-white/80 border-transparent hover:text-white'
                        : 'text-neutral-600 border-transparent hover:text-black hover:border-neutral-300'
                    }`}
                  >
                    {item.label}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Mega Menu Dropdown */}
      <MegaMenu
        activeMenu={activeMegaMenu}
        onClose={() => setActiveMegaMenu(null)}
        onSelectCategory={onSelectCategory}
        onNavigateToView={onNavigateToView}
      />
    </header>
  );
};
