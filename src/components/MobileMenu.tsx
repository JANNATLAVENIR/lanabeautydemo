import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ArrowLeft, Globe, MessageSquare, Heart, User, Home } from 'lucide-react';
import { ActiveView, HomepageSettings } from '../types';
import { useI18n } from '../i18n';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToView: (view: ActiveView, extra?: any) => void;
  onSelectCategory: (category: string) => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
  onOpenCountrySelector: () => void;
  selectedCountryName?: string;
  settings?: HomepageSettings;
}

type MenuLevel = 'root' | 'fashion' | 'fashion-women' | 'fashion-men' | 'beauty' | 'services';

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onNavigateToView,
  onSelectCategory: _onSelectCategory,
  wishlistCount,
  onOpenWishlist,
  onOpenAccount,
  onOpenCountrySelector,
  selectedCountryName = 'International (English)',
  settings
}) => {
  const { t } = useI18n();
  const [level, setLevel] = useState<MenuLevel>('root');
  const [history, setHistory] = useState<MenuLevel[]>(['root']);
  const [dynamicSettings, setDynamicSettings] = useState<any>(() => {
    if (settings) return settings;
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // Reactive sync with parent settings
  useEffect(() => {
    if (settings) {
      setDynamicSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) setDynamicSettings(e.detail);
    };
    window.addEventListener('lana_settings_updated', handleUpdate);
    return () => window.removeEventListener('lana_settings_updated', handleUpdate);
  }, []);

  const activeSettings = settings || dynamicSettings || {};

  const isWaActive = (() => {
    if (activeSettings?.whatsappEnabled === false) return false;
    if (activeSettings?.contactInfo?.whatsappEnabled === false) return false;
    const raw = activeSettings?.whatsappNumber || activeSettings?.contactInfo?.whatsappNumber || activeSettings?.contactInfo?.contactPhone || '';
    return Boolean(String(raw).replace(/[^0-9]/g, ''));
  })();

  const rawWaNum = activeSettings?.whatsappNumber || activeSettings?.contactInfo?.whatsappNumber || activeSettings?.contactInfo?.contactPhone || '';
  const cleanWaNum = String(rawWaNum).replace(/[^0-9]/g, '');
  const socialLinks = activeSettings?.socialLinks || {};

  const navigateToLevel = (newLevel: MenuLevel) => {
    setHistory((prev) => [...prev, newLevel]);
    setLevel(newLevel);
  };

  const handleBack = () => {
    if (history.length > 1) {
      const nextHistory = history.slice(0, -1);
      setHistory(nextHistory);
      setLevel(nextHistory[nextHistory.length - 1]);
    } else {
      setLevel('root');
    }
  };

  const handleSelectNav = (action: () => void) => {
    action();
    onClose();
    setTimeout(() => {
      setLevel('root');
      setHistory(['root']);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'tween', duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-[420px] h-full bg-white text-neutral-900 flex flex-col font-sans overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar: LANA + Close button */}
          <div className="h-16 px-6 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
            <button
              onClick={() => handleSelectNav(() => onNavigateToView('home'))}
              className="text-left cursor-pointer"
            >
              <span className="font-serif tracking-[0.35em] text-2xl font-light">LANA</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 -mr-2 text-neutral-800 hover:text-black transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </div>

          {/* Subheader Back bar if not on root */}
          {level !== 'root' && (
            <div className="px-6 py-3.5 bg-neutral-50 border-b border-neutral-100 flex items-center gap-3 shrink-0">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium text-neutral-700 hover:text-black cursor-pointer"
              >
                <ArrowLeft size={16} strokeWidth={1.5} />
                <span>{t('Back')}</span>
              </button>
              <span className="text-neutral-300">/</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 font-semibold truncate">
                {level === 'fashion' && t('Fashion')}
                {level === 'fashion-women' && t('Women')}
                {level === 'fashion-men' && t('Men')}
                {level === 'beauty' && t('Beauty')}
                {level === 'services' && t('Services')}
              </span>
            </div>
          )}

          {/* Scrollable Navigation Body */}
          <div className="flex-1 overflow-y-auto overscroll-contain py-6 px-6 relative">
            <AnimatePresence mode="wait">
              {/* LEVEL 0: ROOT MENU */}
              {level === 'root' && (
                <motion.div
                  key="root"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-8"
                >
                  {/* SECTION: SHOP */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 block pb-1">
                      {t('Collections')}
                    </span>
                    <ul className="space-y-1">
                      <li>
                        <button
                          onClick={() => handleSelectNav(() => onNavigateToView('home'))}
                          className="w-full py-2.5 flex items-center justify-between text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <Home size={20} className="text-neutral-700 group-hover:text-black transition-colors" />
                            <span>{t('Home')}</span>
                          </div>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => navigateToLevel('fashion')}
                          className="w-full py-2.5 flex items-center justify-between text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer group"
                        >
                          <span>{t('Fashion')}</span>
                          <ChevronRight size={18} className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => navigateToLevel('fashion-men')}
                          className="w-full py-2.5 flex items-center justify-between text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer group"
                        >
                          <span>{t("Men's Dress")}</span>
                          <ChevronRight size={18} className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => navigateToLevel('beauty')}
                          className="w-full py-2.5 flex items-center justify-between text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer group"
                        >
                          <span>{t('Beauty')}</span>
                          <ChevronRight size={18} className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleSelectNav(() => onNavigateToView('bodycare'))}
                          className="w-full py-2.5 flex items-center justify-between text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                        >
                          <span>{t('Bodycare')}</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleSelectNav(() => onNavigateToView('accessories'))}
                          className="w-full py-2.5 flex items-center justify-between text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                        >
                          <span>{t('Accessories')}</span>
                        </button>
                      </li>
                      <li>
                        <button
                          onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'ALL', isNew: true }))}
                          className="w-full py-2.5 flex items-center justify-between text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                        >
                          <span>{t('New Arrivals')}</span>
                          <span className="text-[9px] uppercase tracking-[0.2em] font-sans font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5">
                            {t('New')}
                          </span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* SECTION: ACCOUNT */}
                  <div className="pt-4 border-t border-neutral-100 space-y-3">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 block pb-1">
                      {t('My Account')}
                    </span>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => handleSelectNav(onOpenAccount)}
                        className="py-3 px-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-900 text-xs uppercase tracking-[0.15em] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <User size={15} />
                        <span>{t('My Account')}</span>
                      </button>
                      <button
                        onClick={() => handleSelectNav(onOpenWishlist)}
                        className="py-3 px-4 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-900 text-xs uppercase tracking-[0.15em] font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer relative"
                      >
                        <Heart size={15} />
                        <span>{t('Wishlist')}</span>
                        {wishlistCount > 0 && (
                          <span className="w-5 h-5 bg-neutral-950 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                            {wishlistCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* LEVEL 1: FASHION MENU */}
              {level === 'fashion' && (
                <motion.div
                  key="fashion"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="pb-4 border-b border-neutral-100">
                    <h3 className="font-serif text-3xl font-light text-neutral-900 mb-1">
                      {t('Fashion')} &amp; {t('Accessories')}
                    </h3>
                    <button
                      onClick={() => handleSelectNav(() => onNavigateToView('fashion'))}
                      className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-900 hover:text-neutral-600 underline underline-offset-4 cursor-pointer"
                    >
                      {t('Discover the Collection')} →
                    </button>
                  </div>

                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => navigateToLevel('fashion-women')}
                        className="w-full py-3 flex items-center justify-between text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer group"
                      >
                        <span>{t('Women')}</span>
                        <ChevronRight size={18} className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => navigateToLevel('fashion-men')}
                        className="w-full py-3 flex items-center justify-between text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer group"
                      >
                        <span>{t('Men')}</span>
                        <ChevronRight size={18} className="text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'BAGS' }))}
                        className="w-full py-3 text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        {t('Bags')}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'SHOES' }))}
                        className="w-full py-3 text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        {t('Shoes')}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'ACCESSORIES' }))}
                        className="w-full py-3 text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        {t('Accessories')}
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}

              {/* LEVEL 2: WOMEN FASHION */}
              {level === 'fashion-women' && (
                <motion.div
                  key="fashion-women"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="pb-3 border-b border-neutral-100">
                    <h3 className="font-serif text-2xl font-light text-neutral-900 mb-1">
                      {t('Women')}
                    </h3>
                    <button
                      onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'FASHION', gender: 'Women' }))}
                      className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-900 hover:text-neutral-600 underline underline-offset-4 cursor-pointer"
                    >
                      {t('View all')} →
                    </button>
                  </div>

                  <ul className="space-y-1 divide-y divide-neutral-50 text-sm tracking-[0.1em] uppercase text-neutral-800">
                    {[
                      { label: t('Dresses'), cat: 'FASHION', sub: 'Dresses' },
                      { label: t('Tops'), cat: 'FASHION', sub: 'Tops' },
                      { label: t('Jackets & Coats'), cat: 'FASHION', sub: 'Coats & Jackets' },
                      { label: t('Knitwear'), cat: 'FASHION', sub: 'Knitwear' },
                      { label: t('Shoes'), cat: 'SHOES', sub: '' },
                      { label: t('Bags'), cat: 'BAGS', sub: '' },
                      { label: t('Accessories'), cat: 'ACCESSORIES', sub: '' }
                    ].map((item) => (
                      <li key={item.label}>
                        <button
                          onClick={() =>
                            handleSelectNav(() =>
                              onNavigateToView('catalog', {
                                category: item.cat,
                                subCategory: item.sub || undefined,
                                gender: 'Women'
                              })
                            )
                          }
                          className="w-full py-3 text-left hover:text-black hover:translate-x-1 transition-all cursor-pointer"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* LEVEL 2: MEN FASHION */}
              {level === 'fashion-men' && (
                <motion.div
                  key="fashion-men"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  <div className="pb-3 border-b border-neutral-100">
                    <h3 className="font-serif text-2xl font-light text-neutral-900 mb-1">
                      {t("Men's Dress")}
                    </h3>
                    <button
                      onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'MEN', department: 'FASHION', gender: 'Men' }))}
                      className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-900 hover:text-neutral-600 underline underline-offset-4 cursor-pointer"
                    >
                      {t('View all')} →
                    </button>
                  </div>

                  <ul className="space-y-1 divide-y divide-neutral-50 text-sm tracking-[0.1em] uppercase text-neutral-800">
                    {[
                      { label: t('Shirt'), cat: 'SHIRT', sub: 'Shirt' },
                      { label: t('Jeans'), cat: 'JEANS', sub: 'Jeans' },
                      { label: t('Shoes'), cat: 'SHOES', sub: 'Shoes' },
                      { label: t('Watches'), cat: 'WATCHES', sub: 'Watches' },
                      { label: t('Bags'), cat: 'BAGS', sub: '' },
                      { label: t('Accessories'), cat: 'ACCESSORIES', sub: '' }
                    ].map((item) => (
                      <li key={item.label}>
                        <button
                          onClick={() =>
                            handleSelectNav(() =>
                              onNavigateToView('catalog', {
                                category: item.cat,
                                subCategory: item.sub || undefined,
                                department: 'FASHION',
                                gender: 'Men'
                              })
                            )
                          }
                          className="w-full py-3 text-left hover:text-black hover:translate-x-1 transition-all cursor-pointer font-medium"
                        >
                          {item.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* LEVEL 1: BEAUTY MENU */}
              {level === 'beauty' && (
                <motion.div
                  key="beauty"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  <div className="pb-4 border-b border-neutral-100">
                    <h3 className="font-serif text-3xl font-light text-neutral-900 mb-1">
                      {t('Fragrance')} &amp; {t('Beauty')}
                    </h3>
                    <button
                      onClick={() => handleSelectNav(() => onNavigateToView('beauty'))}
                      className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-900 hover:text-neutral-600 underline underline-offset-4 cursor-pointer"
                    >
                      {t('Discover the Collection')} →
                    </button>
                  </div>

                  <ul className="space-y-1">
                    <li>
                      <button
                        onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'FRAGRANCE' }))}
                        className="w-full py-3 text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        {t('Fragrance')}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'SKINCARE' }))}
                        className="w-full py-3 text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        {t('Skincare')}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'MAKEUP' }))}
                        className="w-full py-3 text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        {t('Makeup')}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSelectNav(() => onNavigateToView('bodycare'))}
                        className="w-full py-3 text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        {t('Bodycare')}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSelectNav(() => onNavigateToView('catalog', { category: 'HAIRCARE' }))}
                        className="w-full py-3 text-left font-serif text-2xl text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
                      >
                        {t('Haircare')}
                      </button>
                    </li>
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Luxury Footer / Country Selector / WhatsApp & Social Links */}
          <div className="p-6 border-t border-neutral-100 bg-neutral-50 shrink-0 space-y-4">
            <button
              onClick={() => {
                onClose();
                onOpenCountrySelector();
              }}
              className="w-full flex items-center justify-between py-2 text-xs uppercase tracking-[0.2em] text-neutral-700 hover:text-black transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Globe size={15} />
                <span>{selectedCountryName}</span>
              </div>
              <ChevronRight size={14} />
            </button>

            {isWaActive && cleanWaNum && (
              <a
                href={`https://wa.me/${cleanWaNum}?text=${encodeURIComponent('Salam Maison LANA Concierge, I would like assistance.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-900 text-white text-[10.5px] uppercase tracking-[0.25em] font-semibold hover:bg-neutral-800 transition-colors"
              >
                <MessageSquare size={13} />
                <span>{t('Concierge')}</span>
              </a>
            )}

            {/* Dynamic Social Links in Mobile Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 border-t border-neutral-200/60 text-[11px] text-neutral-600 uppercase font-medium">
              {socialLinks.instagram && !socialLinks.instagram.includes('maisonlana') && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Instagram</a>
              )}
              {socialLinks.tiktok && !socialLinks.tiktok.includes('maisonlana') && (
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">TikTok</a>
              )}
              {socialLinks.snapchat && socialLinks.snapchat.trim() !== '' && !socialLinks.snapchat.includes('maisonlana') && (
                <a 
                  href={socialLinks.snapchat.startsWith('http') ? socialLinks.snapchat : `https://snapchat.com/add/${socialLinks.snapchat.replace(/^@+/, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-black transition-colors"
                >
                  Snapchat
                </a>
              )}
              {socialLinks.facebook && !socialLinks.facebook.includes('maisonlana') && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Facebook</a>
              )}
              {socialLinks.youtube && !socialLinks.youtube.includes('maisonlana') && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">YouTube</a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
