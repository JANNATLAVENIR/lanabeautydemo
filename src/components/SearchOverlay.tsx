import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowLeft, TrendingUp, Clock } from 'lucide-react';
import { Product } from '../types';
import { useI18n } from '../i18n';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (category: string) => void;
  onNavigateToView: (view: any, extra?: any) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  products = [],
  onSelectProduct,
  onSelectCategory,
  onNavigateToView
}) => {
  const { t, localizeCategory } = useI18n();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'Sauvage Extrait',
    'Haute Couture Gown',
    'Rouge Velvet Lipstick',
    'Cannage Leather Bag'
  ]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const trendingSearches = [
    'Skincare',
    'Dresses',
    'Bags',
    'Fragrance',
    'Bodycare',
    'New Arrivals',
    'Silk Blouses',
    'Haute Parfumerie'
  ];

  const matchingProducts = query.trim()
    ? products
        .filter((p) => {
          const name = (p.name || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          if (
            name.includes('child') ||
            name.includes('kid') ||
            name.includes('baby') ||
            name.includes('infant') ||
            name.includes('toddler') ||
            desc.includes('children')
          ) {
            return false;
          }
          return (
            name.includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()) ||
            (p.brand && p.brand.toLowerCase().includes(query.toLowerCase())) ||
            desc.includes(query.toLowerCase())
          );
        })
        .slice(0, 8)
    : [];

  const matchingCategories = ['FASHION', 'FRAGRANCE', 'SKINCARE', 'MAKEUP', 'BODYCARE', 'BAGS', 'ACCESSORIES'].filter(
    (c) => c.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!recentSearches.includes(query.trim())) {
      setRecentSearches((prev) => [query.trim(), ...prev.slice(0, 4)]);
    }

    onNavigateToView('catalog', { search: query.trim() });
    onClose();
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    if (!recentSearches.includes(tag)) {
      setRecentSearches((prev) => [tag, ...prev.slice(0, 4)]);
    }
    onNavigateToView('catalog', { search: tag });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-white text-neutral-900 flex flex-col font-sans overflow-hidden"
      >
        {/* Top Search Bar */}
        <div className="h-16 sm:h-20 px-4 sm:px-12 border-b border-neutral-100 flex items-center gap-3 shrink-0">
          <button
            onClick={onClose}
            className="p-2 text-neutral-700 hover:text-black transition-colors cursor-pointer"
            aria-label="Back to page"
          >
            <ArrowLeft size={20} />
          </button>

          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center relative">
            <Search size={18} className="text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Search our collections...')}
              className="w-full h-12 pl-10 pr-10 bg-neutral-50 border-none rounded-none text-sm sm:text-base tracking-wide text-neutral-900 placeholder-neutral-400 focus:outline-none focus:bg-neutral-100/70"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 p-1 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </form>

          <button
            onClick={onClose}
            className="hidden sm:block text-xs uppercase tracking-[0.2em] font-medium text-neutral-500 hover:text-black cursor-pointer"
          >
            {t('Cancel')}
          </button>
        </div>

        {/* Search Results / Suggestions Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-[1200px] w-full mx-auto space-y-10">
          {!query.trim() ? (
            <div className="space-y-8">
              {/* TRENDING SEARCHES */}
              <div className="space-y-3">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 flex items-center gap-2">
                  <TrendingUp size={13} />
                  <span>{t('TRENDING SEARCHES', 'TRENDING SEARCHES')}</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleTagClick(item)}
                      className="py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-xs uppercase tracking-wider font-medium text-neutral-800 transition-colors cursor-pointer"
                    >
                      {localizeCategory(item)}
                    </button>
                  ))}
                </div>
              </div>

              {/* RECENT SEARCHES */}
              {recentSearches.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 flex items-center gap-2">
                      <Clock size={13} />
                      <span>{t('RECENT SEARCHES', 'RECENT SEARCHES')}</span>
                    </span>
                    <button
                      onClick={() => setRecentSearches([])}
                      className="text-[10px] uppercase tracking-wider text-neutral-400 hover:text-black cursor-pointer"
                    >
                      {t('Clear all')}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleTagClick(s)}
                        className="py-2 px-4 border border-neutral-200 hover:border-black text-xs uppercase tracking-wider font-medium text-neutral-700 transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* CATEGORY SUGGESTIONS */}
              {matchingCategories.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 block">
                    {t('Category')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {matchingCategories.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          onSelectCategory(c);
                          onNavigateToView('catalog', { category: c });
                          onClose();
                        }}
                        className="py-2 px-4 bg-neutral-900 text-white text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        {t('View all')} {localizeCategory(c)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MATCHING PRODUCTS */}
              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-neutral-400 block">
                  {t('products')} ({matchingProducts.length})
                </span>

                {matchingProducts.length === 0 ? (
                  <p className="text-sm text-neutral-500 py-6">
                    {t('No products found')} "{query}".
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                    {matchingProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectProduct(p);
                          onClose();
                        }}
                        className="group cursor-pointer space-y-2"
                      >
                        <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
                          {p.image && p.image.trim() !== '' ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] uppercase tracking-widest text-neutral-400 block truncate">
                            {p.brand || 'LANA'}
                          </span>
                          <h4 className="text-xs font-light text-neutral-900 line-clamp-1 group-hover:text-neutral-600">
                            {p.name}
                          </h4>
                          <span className="text-xs font-semibold text-neutral-900">
                            ${p.retailPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
