import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingBag, ShieldCheck } from 'lucide-react';
import React, { useEffect } from 'react';
import { Product } from '../types';
import { useI18n } from '../i18n';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToBag: (product: Product) => void;
  onEmptyWishlist: () => void;
  onMoveToCart: (product: Product) => void;
}

export function WishlistDrawer({
  isOpen,
  onClose,
  items = [],
  onRemoveFromWishlist,
  onAddToBag,
  onEmptyWishlist,
  onMoveToCart
}: WishlistDrawerProps) {
  const { t, localizeCategory } = useI18n();

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            id="wishlist-backdrop"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl border-l border-lana-nude/30"
            id="wishlist-drawer-panel"
          >
            {/* Drawer Header */}
            <div className="p-6 border-b border-lana-nude/20 flex items-center justify-between bg-lana-ivory/50">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-lana-gold fill-current" />
                <h3 className="text-sm font-sans font-bold uppercase tracking-[0.2em] text-lana-ink">
                  {t('Add to Wishlist')} ({items.length})
                </h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 hover:text-lana-gold transition-colors text-lana-ink/60 cursor-pointer"
                id="wishlist-close-button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-lana-blush/20 flex items-center justify-center text-lana-gold mb-2 border border-lana-gold/10">
                    <Heart size={28} strokeWidth={1.2} />
                  </div>
                  <h4 className="text-lg font-serif">{t('Your Bag is Empty')}</h4>
                  <p className="text-xs font-sans text-lana-ink/50 max-w-xs leading-relaxed">
                    {t('Explore our luxury beauty selection and discover your signature scent or skincare essential.')}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-3 bg-lana-ink text-white text-[10px] uppercase tracking-[0.2em] font-sans hover:bg-lana-gold transition-colors cursor-pointer"
                    id="wishlist-start-shopping"
                  >
                    {t('Start Shopping')}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-lana-nude/15 pb-2">
                    <p className="text-[10px] uppercase tracking-widest text-lana-gold font-bold">
                      {t('Complimentary Delivery & Gift Box')}
                    </p>
                    <button
                      onClick={onEmptyWishlist}
                      className="text-[9px] uppercase tracking-wider font-sans font-bold text-red-700/80 hover:text-red-700 transition-colors underline decoration-1 underline-offset-4 cursor-pointer"
                      id="wishlist-empty-all-button"
                    >
                      {t('Clear all')}
                    </button>
                  </div>
                  {items.map(product => (
                    <div 
                      key={product.id} 
                      className="flex gap-4 p-3 border border-lana-nude/15 bg-[#FCFAF8] relative group"
                    >
                      {product.image && product.image.trim() !== '' ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-20 h-24 object-cover border border-lana-nude/20 bg-white"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-20 h-24 bg-neutral-100 border border-lana-nude/20 flex items-center justify-center text-[9px] text-neutral-400">
                          No Image
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-[9px] uppercase tracking-widest text-lana-gold font-sans font-bold">
                              {localizeCategory(product.category)}
                            </p>
                            <button
                              onClick={() => onRemoveFromWishlist(product.id)}
                              className="text-lana-ink/40 hover:text-red-700 transition-colors p-1 cursor-pointer"
                              title={t('Remove from Wishlist')}
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <h4 className="text-sm font-serif font-normal text-lana-ink pr-4 leading-tight mt-0.5">{product.name}</h4>
                          <p className="text-xs font-sans font-semibold text-lana-gold mt-1">
                            ${product.retailPrice}.00
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-3 pt-2 border-t border-lana-nude/10">
                          <span className="text-[9px] font-sans text-lana-ink/40 hidden sm:inline">
                            {product.volume || 'Couture Selection'}
                          </span>

                          <div className="flex gap-1.5 w-full sm:w-auto">
                            <button 
                              onClick={() => onMoveToCart(product)}
                              className="flex-1 sm:flex-none px-2.5 py-1.5 border border-lana-ink/30 hover:border-lana-gold hover:text-lana-gold text-lana-ink text-[8px] sm:text-[9px] uppercase tracking-wider font-sans font-bold transition-all flex items-center justify-center cursor-pointer"
                              id={`wishlist-move-${product.id}`}
                            >
                              <span>{t('Add to Bag')}</span>
                            </button>

                            <button 
                              onClick={() => onAddToBag(product)}
                              className="flex-1 sm:flex-none px-2.5 py-1.5 bg-lana-ink hover:bg-lana-gold text-white text-[8px] sm:text-[9px] uppercase tracking-wider font-sans font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              id={`wishlist-bag-${product.id}`}
                            >
                              <ShoppingBag size={10} />
                              <span>{t('Buy Now')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Brand Promise Badge */}
                  <div className="p-4 bg-lana-ivory/50 border border-lana-nude/20 text-xs font-sans text-lana-ink/70 flex items-start gap-3 mt-6">
                    <ShieldCheck size={20} className="text-lana-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[10px] uppercase tracking-widest text-lana-ink mb-0.5">
                        {t('Authenticity Guaranteed')}
                      </p>
                      <p className="text-[11px] leading-relaxed text-lana-ink/60">
                        {t('Sourced exclusively from certified regional store vaults. Dispatched in signature Lana luxury packaging.')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
