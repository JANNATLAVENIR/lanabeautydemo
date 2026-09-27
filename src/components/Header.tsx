import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Menu, X, Shield, PackageSearch, Heart, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  isAdminActive: boolean;
  activeView: 'home' | 'catalog';
  onViewChange: (view: 'home' | 'catalog') => void;
  onSelectCategory?: (category: string) => void;
  selectedCategory?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function Header({ 
  cartCount, 
  wishlistCount,
  onOpenCart, 
  onOpenWishlist, 
  onOpenTracker, 
  onOpenAdmin, 
  isAdminActive,
  activeView,
  onViewChange,
  onSelectCategory,
  selectedCategory,
  searchQuery = '',
  onSearchChange
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const lanaNavItems = [
    { label: 'FASHION', category: 'FASHION' },
    { label: 'BAGS', category: 'BAGS' },
    { label: 'SHOES', category: 'SHOES' },
    { label: 'SKINCARE', category: 'SKINCARE' },
    { label: 'FRAGRANCE', category: 'FRAGRANCE' },
    { label: 'MAKE-UP', category: 'MAKEUP' },
    { label: 'BODYCARE', category: 'BODYCARE' },
    { label: 'THE ART OF GIFTING', category: 'ALL' }
  ];

  const handleCategoryClick = (cat: string) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    onViewChange('catalog');
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex flex-col font-sans">
      {/* Main LANA Brand Header */}
      <header 
        className={`transition-all duration-300 border-b ${
          isScrolled || activeView === 'catalog'
            ? 'bg-white/98 backdrop-blur-md border-neutral-200 shadow-[0_1px_10px_rgba(0,0,0,0.03)]' 
            : 'bg-white/95 backdrop-blur-sm border-neutral-200/80'
        }`}
      >
        <div className="max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-3.5 sm:py-4 flex items-center justify-between">
          {/* Left: LANA Menu & Quick Search */}
          <div className="flex items-center gap-4 sm:gap-6 flex-1">
            <button 
              className="text-black p-1 hover:opacity-60 transition-opacity cursor-pointer flex items-center gap-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle Menu"
              id="hamburger-menu-toggle"
            >
              {isMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              <span className="hidden md:inline text-[11px] uppercase tracking-[0.2em] font-medium text-black">
                Menu
              </span>
            </button>

            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="hidden sm:flex items-center gap-2 text-black hover:opacity-60 transition-opacity cursor-pointer"
              title="Search LANA collection"
            >
              <Search size={17} strokeWidth={1.5} />
              <span className="text-[11px] uppercase tracking-[0.2em] font-medium text-black">
                Search
              </span>
            </button>
          </div>



          {/* Right: LANA Client Actions (Wishlist, Admin, Bag) */}
          <div className="flex items-center gap-3 sm:gap-5 flex-1 justify-end text-[11px] uppercase tracking-[0.18em] font-medium">
            {/* Search on mobile */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="sm:hidden p-1 text-black hover:opacity-60 transition-opacity cursor-pointer"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            {/* Wishlist */}
            <button 
              onClick={onOpenWishlist}
              className="relative p-1 text-black hover:opacity-60 transition-opacity cursor-pointer"
              title="Wishlist"
              id="header-wishlist-button"
            >
              <Heart size={18} strokeWidth={1.5} className={wishlistCount > 0 ? "fill-black text-black" : ""} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Admin Portal */}
            <button 
              onClick={onOpenAdmin}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[9px] tracking-[0.2em] font-bold uppercase transition-all cursor-pointer border ${
                isAdminActive 
                  ? 'bg-black text-white border-black' 
                  : 'border-neutral-300 text-neutral-700 hover:border-black hover:text-black'
              }`}
            >
              <Shield size={11} />
              <span>{isAdminActive ? 'Admin' : 'Management'}</span>
            </button>

            {/* LANA Shopping Bag */}
            <button 
              onClick={onOpenCart}
              className="flex items-center gap-2 p-1.5 text-black hover:opacity-60 transition-opacity cursor-pointer"
              id="header-cart-button"
            >
              <div className="relative">
                <ShoppingBag size={18} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[8.5px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-[10px] tracking-[0.2em] font-semibold">
                BAG ({cartCount})
              </span>
            </button>
          </div>
        </div>

        {/* LANA Horizontal Runway Navigation Bar (Iconic on lana.com) */}
        <nav className="hidden md:flex items-center justify-center border-t border-neutral-200/70 py-2.5 px-6 bg-white">
          <ul className="flex items-center gap-7 lg:gap-10 text-[11px] uppercase tracking-[0.22em] font-sans font-medium text-neutral-800">
            {lanaNavItems.map((item) => {
              const isActive = activeView === 'catalog' && selectedCategory?.toUpperCase() === item.category.toUpperCase();
              return (
                <li key={item.label}>
                  <button
                    onClick={() => handleCategoryClick(item.category)}
                    className={`relative py-1 hover:text-black transition-colors cursor-pointer group ${
                      isActive ? 'text-black font-semibold' : 'text-neutral-600'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span 
                      className={`absolute bottom-0 left-0 w-full h-[1px] bg-black transition-transform duration-200 origin-left ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`} 
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* LANA Search Bar Dropdown */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-neutral-200 bg-neutral-50 px-6 py-4 overflow-hidden"
            >
              <div className="max-w-2xl mx-auto flex items-center gap-3">
                <Search size={18} className="text-neutral-500 shrink-0" />
                <input 
                  type="text"
                  placeholder="SEARCH LANA PERFUMES, BAGS, SHOES, OR MAKE-UP..."
                  value={searchQuery}
                  onChange={(e) => {
                    if (onSearchChange) onSearchChange(e.target.value);
                    if (activeView !== 'catalog') onViewChange('catalog');
                  }}
                  autoFocus
                  className="w-full bg-transparent border-b border-black/30 py-2 text-xs md:text-sm font-sans tracking-[0.15em] uppercase placeholder-neutral-400 focus:outline-none focus:border-black"
                />
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="text-xs uppercase tracking-widest font-bold text-neutral-500 hover:text-black cursor-pointer shrink-0"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lana Full-Screen/Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="bg-white border-b border-neutral-200 px-8 py-10 flex flex-col gap-6 text-center uppercase tracking-[0.25em] text-xs font-sans shadow-xl max-h-[85vh] overflow-y-auto"
            >
              <div className="max-w-lg mx-auto w-full flex flex-col gap-5 text-left">
                <div className="border-b border-neutral-200 pb-3 flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-bold tracking-[0.3em]">LANA UNIVERSES</span>
                  <span className="text-[9px] text-neutral-400 font-mono">PARIS</span>
                </div>

                <div className="flex flex-col gap-3.5">
                  <button 
                    onClick={() => { setIsMenuOpen(false); onViewChange('home'); }}
                    className="py-1.5 text-base font-serif tracking-[0.15em] text-black hover:text-neutral-500 transition-colors cursor-pointer text-left flex items-center justify-between"
                  >
                    <span>Maison Lana Home</span>
                    <ArrowRight size={14} className="text-neutral-400" />
                  </button>

                  {lanaNavItems.map((item) => (
                    <button 
                      key={item.label}
                      onClick={() => handleCategoryClick(item.category)}
                      className="py-1.5 text-sm font-serif tracking-[0.15em] text-neutral-800 hover:text-black transition-colors cursor-pointer text-left flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      <ArrowRight size={14} className="text-neutral-300" />
                    </button>
                  ))}
                </div>

                <div className="pt-6 border-t border-neutral-200 flex flex-col gap-3">
                  <button 
                    onClick={() => { setIsMenuOpen(false); onOpenWishlist(); }}
                    className="py-3 px-4 border border-neutral-200 flex items-center justify-between text-neutral-900 font-sans tracking-widest text-[10px] font-bold hover:bg-neutral-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Heart size={14} className={wishlistCount > 0 ? "fill-black text-black" : ""} />
                      WISHLIST ({wishlistCount})
                    </span>
                    <ArrowRight size={12} />
                  </button>

                  <button 
                    onClick={() => { setIsMenuOpen(false); onOpenTracker(); }}
                    className="py-3 px-4 border border-neutral-200 flex items-center justify-between text-neutral-900 font-sans tracking-widest text-[10px] font-bold hover:bg-neutral-50 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <PackageSearch size={14} />
                      TRACK ORDER
                    </span>
                    <ArrowRight size={12} />
                  </button>

                  <button 
                    onClick={() => { setIsMenuOpen(false); onOpenAdmin(); }}
                    className="py-3 px-4 bg-black text-white flex items-center justify-between font-sans tracking-widest text-[10px] font-bold cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Shield size={14} />
                      STORE MANAGEMENT PORTAL
                    </span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}

