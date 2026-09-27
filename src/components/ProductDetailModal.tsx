import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, ShieldCheck, Sparkles, Plus, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({ product, onClose, onAddToCart }: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);

  // Lock body scroll when modal is active to prevent double-scrolling of the home page
  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [product]);

  if (!product) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Centered Modal Wrapper */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4 z-10">
          {/* Modal Content - Constrained height, no double scroll */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-h-[82vh] md:max-h-[85vh] overflow-hidden bg-white shadow-2xl border border-lana-nude/40 flex flex-col relative"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-lana-ink/40 hover:text-lana-ink p-1.5 transition-colors z-20 bg-white/80 rounded-full md:bg-transparent"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Structured Inner Body */}
            <div className="overflow-y-auto p-4 md:p-8 flex-1">
              <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-start">
                {/* Image Box - Compressed height on mobile to save vertical space */}
                <div className="relative h-40 md:h-auto md:aspect-[4/5] bg-lana-ivory border border-lana-nude/30 p-4 flex items-center justify-center overflow-hidden group shrink-0">
                  {product.image && product.image.trim() !== '' ? (
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="h-full md:w-full md:h-full object-contain md:object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-neutral-400 text-xs">
                      No Image
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-[8px] uppercase tracking-[0.3em] font-sans font-bold bg-white/90 px-2.5 py-0.5 border border-lana-nude/40 text-lana-gold">
                    {product.category}
                  </span>
                </div>

                {/* Details Section */}
                <div className="text-left flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] font-sans font-bold text-lana-gold mb-0.5 block">
                      Signature Selection
                    </span>
                    <h3 className="text-lg md:text-2xl font-serif text-lana-ink font-normal leading-tight mb-1">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-base md:text-xl font-sans font-medium text-lana-gold">
                        ${product.retailPrice}.00
                      </span>
                      {product.volume && (
                        <span className="text-[9px] font-sans text-lana-ink/40 uppercase tracking-widest border border-lana-nude/30 px-2 py-0.5">
                          {product.volume}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] md:text-xs font-sans text-lana-ink/70 leading-relaxed border-t border-b border-lana-nude/20 py-2.5 my-2 max-h-24 overflow-y-auto">
                      {product.description}
                    </p>
                  </div>

                  {/* Guarantees - Hidden on mobile to fit screen elegantly */}
                  <div className="hidden md:block space-y-2 text-[11px] font-sans text-lana-ink/65">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={14} className="text-lana-gold shrink-0" />
                      <span>100% Authentic sourced from official distributors</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-lana-gold shrink-0" />
                      <span>Complimentary samples & premium wrap included</span>
                    </div>
                  </div>

                  {/* Quantity and Actions Bar */}
                  <div className="space-y-3 pt-1 border-t border-lana-nude/10 md:border-t-0">
                    <div className="flex items-center justify-between md:justify-start md:gap-4">
                      <span className="text-[9px] uppercase tracking-widest font-bold text-lana-ink/65">Quantity:</span>
                      <div className="flex items-center border border-lana-nude/50 bg-[#FCFAF8] scale-90 md:scale-100 origin-left">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-1.5 px-2.5 hover:bg-lana-ivory transition-colors text-lana-ink/60"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 font-mono font-medium text-xs text-lana-ink">{quantity}</span>
                        <button 
                          onClick={() => setQuantity(quantity + 1)}
                          className="p-1.5 px-2.5 hover:bg-lana-ivory transition-colors text-lana-ink/60"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onAddToCart(product, quantity);
                        onClose();
                      }}
                      className="w-full py-2.5 md:py-3.5 bg-lana-ink text-white text-[10px] md:text-xs uppercase tracking-[0.2em] font-sans font-bold hover:bg-lana-gold transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <ShoppingBag size={14} />
                      <span>Add to Bag — ${(product.retailPrice * quantity)}.00</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

