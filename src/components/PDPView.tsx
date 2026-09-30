import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, Plus, Minus, Star, ChevronLeft, ChevronRight, Check, X, ShieldCheck, Gift, Truck, RotateCcw, Share2, MessageCircle, Copy, Sparkles } from 'lucide-react';
import { Product, ProductReview } from '../types';
import { ProductCard } from './ProductCard';
import { useI18n } from '../i18n';

export interface PDPViewProps {
  product?: Product | null;
  allProducts?: Product[];
  isWishlisted?: boolean;
  onToggleWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number, options?: { size?: string; color?: string }) => void;
  onSelectProduct?: (product: Product) => void;
  onSelectRelatedProduct?: (product: Product) => void;
  onNavigateToCart?: () => void;
  onBackToCatalog?: () => void;
  onNavigateToCatalog?: (category: string) => void;
  onSelectCategory?: (category: string) => void;
}

export const PDPView: React.FC<PDPViewProps> = ({
  product,
  allProducts = [],
  isWishlisted = false,
  onToggleWishlist = (_p: Product) => {},
  onAddToCart = (_p: Product, _quantity?: number, _options?: { size?: string; color?: string }) => {},
  onSelectProduct = (_p: Product) => {},
  onSelectRelatedProduct,
  onNavigateToCart = () => {},
  onBackToCatalog,
  onNavigateToCatalog,
  onSelectCategory
}) => {
  const { t, localizeCategory } = useI18n();
  const mainBtnRef = useRef<HTMLButtonElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    desc: true,
    details: true
  });
  const [addedNotice, setAddedNotice] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => {
    if (!product) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Discover this exquisite piece: ${product.name} at Maison LANA`;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} - ${url}`)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'copy') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    }
  };

  const isWaActive = (() => {
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.whatsappEnabled === false) return false;
        if (parsed.contactInfo?.whatsappEnabled === false) return false;
        const phone = (parsed.whatsappNumber || parsed.contactInfo?.whatsappNumber || '').replace(/[^0-9]/g, '');
        return Boolean(phone);
      }
    } catch {}
    return true;
  })();

  const handleWhatsAppInquire = () => {
    if (!product) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const priceVal = product.retailPrice || (product as any).price || 0;
    const msg = `Hello Maison LANA VIP Concierge,\n\nI am inquiring about:\n*${product.name}* (Price: $${priceVal.toLocaleString()})\nLink: ${url}\n\nPlease advise on availability and bespoke client consultation.`;
    
    let targetPhone = '';
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const phone = parsed.whatsappNumber || parsed.contactInfo?.whatsappNumber || parsed.contactInfo?.contactPhone;
        if (phone) targetPhone = phone.replace(/[^0-9]/g, '');
      }
    } catch {}

    if (!targetPhone) {
      alert('WhatsApp contact number is not configured yet.');
      return;
    }

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  useEffect(() => {
    if (product) {
      setReviewsLoading(true);
      fetch(`/api/reviews/${product.id}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setReviews(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error("Reviews fetch error:", err))
        .finally(() => setReviewsLoading(false));
    }
  }, [product?.id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !newReviewComment) return;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          authorName: newReviewAuthor || "Discerning Client",
          rating: newReviewRating,
          title: newReviewTitle || "Exquisite Experience",
          comment: newReviewComment
        })
      });

      const newRev = await res.json();
      setReviews(prev => [newRev, ...prev]);
      setNewReviewAuthor('');
      setNewReviewTitle('');
      setNewReviewComment('');
      setReviewSubmitted(true);
      setTimeout(() => setReviewSubmitted(false), 4000);
    } catch (e) {
      console.error("Failed to submit review:", e);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (mainBtnRef.current) {
        const rect = mainBtnRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 font-sans pt-32 pb-24 text-center px-6">
        <h2 className="text-2xl font-serif mb-4">{t('Product Not Found')}</h2>
        <button
          onClick={() => {
            if (onNavigateToCatalog) onNavigateToCatalog('ALL');
            else if (onBackToCatalog) onBackToCatalog();
          }}
          className="px-6 py-2.5 bg-neutral-900 text-white text-xs uppercase tracking-widest cursor-pointer"
        >
          {t('Return to Catalogue')}
        </button>
      </div>
    );
  }

  const rawImages = (product.images && product.images.length > 0)
    ? product.images
    : [product.image, product.secondaryImage || product.image];
  const galleryImages = rawImages.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
  if (galleryImages.length === 0) {
    galleryImages.push(product.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800');
  }

  const handleAdd = () => {
    onAddToCart(product, quantity, { size: selectedSize, color: selectedColor });
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const relatedProducts = (allProducts || [])
    .filter((p) => {
      if (!p || p.id === product.id) return false;
      const prodCat = (product.category || '').toUpperCase();
      const pCat = (p.category || '').toUpperCase();
      const prodDept = (product.department || '').toUpperCase();
      const pDept = (p.department || '').toUpperCase();
      if (prodDept && pDept && prodDept !== pDept) return false;
      return pCat === prodCat;
    })
    .slice(0, 4);

  const handleNavCategory = (cat: string) => {
    if (onNavigateToCatalog) onNavigateToCatalog(cat);
    else if (onSelectCategory) onSelectCategory(cat);
    else if (onBackToCatalog) onBackToCatalog();
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pt-16 sm:pt-24 pb-28">
      {/* 1. TOP BREADCRUMB */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-12 py-3.5 border-b border-neutral-100">
        <nav className="flex items-center gap-2 text-[9.5px] uppercase tracking-[0.25em] text-neutral-400">
          <button onClick={() => handleNavCategory('ALL')} className="hover:text-black cursor-pointer">
            {t('BOUTIQUE')}
          </button>
          <span>/</span>
          <button onClick={() => handleNavCategory((product.category || 'ALL').toUpperCase())} className="hover:text-black cursor-pointer">
            {localizeCategory(product.category || 'ALL')}
          </button>
          <span>/</span>
          <span className="text-neutral-900 font-semibold truncate max-w-[180px] sm:max-w-none">
            {product.name}
          </span>
        </nav>
      </div>

      {/* 2. MAIN PDP PRODUCT SECTION */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-12 pt-6 sm:pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-16">
          {/* LEFT: FULL-WIDTH IMAGE GALLERY (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Primary Large Image with swipe & counter */}
            <div className="relative aspect-[3/4] max-h-[800px] w-full overflow-hidden bg-neutral-100 border border-neutral-100 select-none">
              {galleryImages[selectedImageIdx] ? (
                <img
                  src={galleryImages[selectedImageIdx]}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setIsZoomOpen(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                  No Image
                </div>
              )}

              {/* Counter Pill (e.g. 1 / 4) */}
              <div className="absolute bottom-4 right-4 bg-black/75 backdrop-blur-xs text-white text-[10px] uppercase tracking-[0.2em] px-2.5 py-1 font-medium">
                {selectedImageIdx + 1} / {galleryImages.length}
              </div>

              {/* Prev / Next Swipe Controls */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-black shadow-md cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setSelectedImageIdx((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-black shadow-md cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}

              {/* Exclusive Tag */}
              {product.isExclusive && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-black text-white text-[9px] uppercase tracking-[0.3em] font-bold">
                  {t('EXCLUSIVE ARCHIVE')}
                </span>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`w-16 sm:w-20 aspect-[3/4] shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedImageIdx === idx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: STICKY PRODUCT INFORMATION (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24 self-start">
            {/* Brand, Title & Price */}
            <div className="space-y-2 pb-6 border-b border-neutral-100">
              <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-neutral-400 block">
                {product.brand || 'CHRISTIAN DIOR'}
              </span>

              <h1 className="font-serif text-2xl sm:text-4xl font-light tracking-wide text-neutral-900 leading-tight">
                {product.name}
              </h1>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xl sm:text-2xl font-serif text-neutral-900">
                  ${product.retailPrice.toLocaleString()}
                </span>
                <span className="text-[10.5px] uppercase tracking-[0.2em] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1">
                  {t('Complimentary Delivery & Gift Box')}
                </span>
              </div>
            </div>

            {/* Rating & Notes */}
            <div className="flex items-center gap-4 text-xs text-neutral-500 pb-2">
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} fill="currentColor" />
                ))}
                <span className="text-neutral-900 font-medium ml-1.5">{product.rating || '5.0'}</span>
              </div>
              <span>·</span>
              <span className="text-[11px] uppercase tracking-wider">{product.reviewsCount || 28} {t('Verified Reviews')}</span>
            </div>

            {/* Volume / Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="uppercase tracking-[0.2em] font-bold text-neutral-900">{t('Select Size')}</span>
                  <span className="text-neutral-400 underline cursor-pointer">{t('Size Guide')}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`py-3 text-xs uppercase tracking-wider font-semibold border transition-all cursor-pointer ${
                        selectedSize === s
                          ? 'border-black bg-black text-white'
                          : 'border-neutral-200 text-neutral-800 hover:border-neutral-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2.5">
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-900 block">
                  {t('Color')}: <span className="font-normal text-neutral-600">{selectedColor}</span>
                </span>
                <div className="flex items-center gap-3">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`w-8 h-8 rounded-full border-2 transition-all p-0.5 cursor-pointer ${
                        selectedColor === c.name ? 'border-black scale-110' : 'border-transparent'
                      }`}
                    >
                      <span className="w-full h-full rounded-full block" style={{ backgroundColor: c.hex }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Primary Add to Bag */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity Control */}
                <div className="flex items-center border border-neutral-300 h-12">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 h-full text-neutral-600 hover:text-black cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 text-xs font-semibold text-neutral-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 h-full text-neutral-600 hover:text-black cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Main Add to Bag Button */}
                <button
                  ref={mainBtnRef}
                  onClick={handleAdd}
                  className="flex-1 h-12 bg-neutral-950 text-white text-xs uppercase tracking-[0.25em] font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  id="pdp-add-to-bag-btn"
                >
                  <ShoppingBag size={16} />
                  <span>{t('Add to Bag')} · ${(product.retailPrice * quantity).toLocaleString()}</span>
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`h-12 w-12 border flex items-center justify-center transition-colors cursor-pointer ${
                    isWishlisted ? 'border-black bg-black text-white' : 'border-neutral-300 text-neutral-800 hover:border-black'
                  }`}
                  aria-label="Wishlist toggle"
                >
                  <Heart size={18} className={isWishlisted ? 'fill-white text-white' : ''} />
                </button>
              </div>

              {/* WhatsApp VIP Concierge Quick Inquire */}
              {isWaActive && (
                <button
                  onClick={handleWhatsAppInquire}
                  type="button"
                  className="w-full py-2.5 px-4 bg-emerald-950/20 border border-emerald-500/40 hover:bg-emerald-950/40 text-emerald-800 hover:text-emerald-900 text-xs font-serif uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Inquire on WhatsApp with a VIP Advisor</span>
                </button>
              )}

              {/* Social Share Bar */}
              <div className="flex items-center justify-between py-2.5 px-3 bg-neutral-50 border border-neutral-200 text-xs">
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 flex items-center gap-1.5 font-serif">
                  <Share2 className="w-3.5 h-3.5 text-neutral-700" />
                  Share Piece:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleShare('whatsapp')}
                    className="p-1.5 hover:bg-neutral-200 text-neutral-700 rounded-xs transition-colors cursor-pointer"
                    title="Share via WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare('facebook')}
                    className="p-1.5 hover:bg-neutral-200 text-neutral-700 rounded-xs transition-colors cursor-pointer"
                    title="Share to Facebook"
                  >
                    <span className="text-xs font-bold text-blue-600">fb</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare('twitter')}
                    className="p-1.5 hover:bg-neutral-200 text-neutral-700 rounded-xs transition-colors cursor-pointer"
                    title="Share on X / Twitter"
                  >
                    <span className="text-xs font-bold text-neutral-900">𝕏</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShare('copy')}
                    className="p-1.5 hover:bg-neutral-200 text-neutral-700 rounded-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Copy Link"
                  >
                    {copiedLink ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Copied!
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-neutral-600" />
                    )}
                  </button>
                </div>
              </div>

              {addedNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={14} />
                    <span>{t('Added to your shopping bag')}</span>
                  </div>
                  <button onClick={onNavigateToCart} className="underline uppercase tracking-wider font-semibold cursor-pointer">
                    {t('View Bag')}
                  </button>
                </div>
              )}
            </div>

            {/* Maison Guarantees */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-neutral-100 text-center">
              <div className="space-y-1">
                <Truck size={16} className="mx-auto text-neutral-600" />
                <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-800 block">
                  {t('Complimentary Shipping')}
                </span>
              </div>
              <div className="space-y-1">
                <Gift size={16} className="mx-auto text-neutral-600" />
                <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-800 block">
                  {t('LANA Iconic Packaging')}
                </span>
              </div>
              <div className="space-y-1">
                <RotateCcw size={16} className="mx-auto text-neutral-600" />
                <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-800 block">
                  {t('30-Day Returns')}
                </span>
              </div>
            </div>

            {/* ACCORDIONS (+ / −) */}
            <div className="divide-y divide-neutral-200 border-b border-neutral-200">
              {/* DESCRIPTION */}
              <div className="py-4">
                <button
                  onClick={() => toggleAccordion('desc')}
                  className="w-full flex items-center justify-between text-left text-xs uppercase tracking-[0.2em] font-bold text-neutral-900 cursor-pointer"
                >
                  <span>{t('Description')}</span>
                  {openAccordions['desc'] ? <Minus size={14} /> : <Plus size={14} />}
                </button>
                {openAccordions['desc'] && (
                  <div className="mt-3 text-xs text-neutral-600 font-light leading-relaxed space-y-2">
                    <p>{product.description}</p>
                    {product.olfactoryNotes && (
                      <div className="pt-2 space-y-1 text-neutral-800 font-normal">
                        <p><strong className="font-semibold">{t('Top Notes')}:</strong> {product.olfactoryNotes.top?.join(', ')}</p>
                        <p><strong className="font-semibold">{t('Heart Notes')}:</strong> {product.olfactoryNotes.heart?.join(', ')}</p>
                        <p><strong className="font-semibold">{t('Base Notes')}:</strong> {product.olfactoryNotes.base?.join(', ')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* DETAILS & SAVOIR-FAIRE */}
              <div className="py-4">
                <button
                  onClick={() => toggleAccordion('details')}
                  className="w-full flex items-center justify-between text-left text-xs uppercase tracking-[0.2em] font-bold text-neutral-900 cursor-pointer"
                >
                  <span>{t('Details & Savoir-Faire')}</span>
                  {openAccordions['details'] ? <Minus size={14} /> : <Plus size={14} />}
                </button>
                {openAccordions['details'] && (
                  <ul className="mt-3 space-y-1.5 text-xs text-neutral-600 font-light list-disc list-inside">
                    <li>{t('Artisanal creation crafted in our European ateliers')}</li>
                    <li>{t('Individually inspected and numbered bottle / garment')}</li>
                    <li>{t('Sustainable botanical sourcing in Grasse and Provence')}</li>
                    <li>{t('Signature embossed LANA Paris hallmark')}</li>
                  </ul>
                )}
              </div>

              {/* COMPLIMENTARY SHIPPING & PACKAGING */}
              <div className="py-4">
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex items-center justify-between text-left text-xs uppercase tracking-[0.2em] font-bold text-neutral-900 cursor-pointer"
                >
                  <span>{t('Complimentary Shipping & Packaging')}</span>
                  {openAccordions['shipping'] ? <Minus size={14} /> : <Plus size={14} />}
                </button>
                {openAccordions['shipping'] && (
                  <div className="mt-3 text-xs text-neutral-600 font-light leading-relaxed space-y-2">
                    <p>{t('All LANA orders are delivered in our signature midnight-black lacquer boxes, wrapped with silk grosgrain ribbon and accompanied by personalized calligraphed cards.')}</p>
                    <p>{t('Standard Express Delivery: 2-4 business days.')}</p>
                  </div>
                )}
              </div>

              {/* RETURNS & EXCHANGES */}
              <div className="py-4">
                <button
                  onClick={() => toggleAccordion('returns')}
                  className="w-full flex items-center justify-between text-left text-xs uppercase tracking-[0.2em] font-bold text-neutral-900 cursor-pointer"
                >
                  <span>{t('Returns & Exchanges')}</span>
                  {openAccordions['returns'] ? <Minus size={14} /> : <Plus size={14} />}
                </button>
                {openAccordions['returns'] && (
                  <div className="mt-3 text-xs text-neutral-600 font-light leading-relaxed">
                    <p>{t('We invite you to experience LANA creations with complete serenity. You may return any unopened item in its original presentation within 30 days of delivery.')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2.5 CUSTOMER REVIEWS & RATINGS SECTION */}
        <div className="mt-20 pt-16 border-t border-neutral-200">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase tracking-[0.35em] font-semibold text-lana-gold block">
                {t('PATRON TESTIMONIALS')}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-light uppercase tracking-wide">
                {t('Client Reviews & Sillage Feedback')}
              </h2>
              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <span className="text-sm font-serif font-bold text-neutral-900">
                  {reviews.length > 0
                    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                    : "5.0"}
                </span>
                <span className="text-xs text-neutral-400 font-mono">({reviews.length} {t('Verified Reviews')})</span>
              </div>
            </div>

            {/* Write a Review Form */}
            <div className="bg-neutral-50 p-6 sm:p-8 border border-neutral-200 space-y-4">
              <h3 className="font-serif text-lg font-light uppercase tracking-wide text-neutral-900">
                {t('Share Your Olfactive Experience')}
              </h3>

              {reviewSubmitted && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <Check size={16} />
                  {t('Your impression has been recorded in the Supabase ledger. Thank you!')}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">{t('Your Name / Title')}</label>
                    <input
                      type="text"
                      placeholder="e.g. Fatima Z."
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      className="w-full p-2.5 bg-white border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">{t('Rating')}</label>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(Number(e.target.value))}
                      className="w-full p-2.5 bg-white border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900"
                    >
                      <option value={5}>★★★★★ 5 {t('5 Stars - Masterpiece')}</option>
                      <option value={4}>★★★★☆ 4 {t('4 Stars - Excellent')}</option>
                      <option value={3}>★★★☆☆ 3 {t('3 Stars - Average')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">{t('Review Headline')}</label>
                  <input
                    type="text"
                    placeholder="e.g. Sublime Oud Note & Unmatched Sillage"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">{t('Detailed Impression *')}</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the longevity, notes, and presentation..."
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full p-2.5 bg-white border border-neutral-300 text-xs focus:outline-none focus:border-neutral-900 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 bg-neutral-950 text-white text-xs uppercase tracking-widest font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  {t('Submit Review')}
                </button>
              </form>
            </div>

            {/* Existing Reviews List */}
            <div className="space-y-6 divide-y divide-neutral-100">
              {reviews.map((rev) => (
                <div key={rev.id} className="pt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </div>
                      <span className="font-serif font-bold text-sm text-neutral-900">{rev.title}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-600 font-light leading-relaxed">
                    "{rev.comment}"
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
                    <span className="font-semibold text-neutral-800">{rev.authorName}</span>
                    <span>•</span>
                    <span className="text-emerald-700 flex items-center gap-1">
                      <ShieldCheck size={12} /> {t('Verified Acquisition')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-16 border-t border-neutral-100">
            <div className="text-center max-w-xl mx-auto mb-10 space-y-1">
              <span className="text-[9.5px] uppercase tracking-[0.35em] font-medium text-neutral-400 block">
                {t('COMPLIMENTARY CREATIONS')}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-light uppercase tracking-wide">
                {t('You May Also Admire')}
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isWishlisted={false}
                  onToggleWishlist={onToggleWishlist}
                  onAddToCart={(prod) => onAddToCart(prod)}
                  onViewDetails={(prod) => {
                    if (onSelectRelatedProduct) onSelectRelatedProduct(prod);
                    else onSelectProduct(prod);
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. STICKY BOTTOM ADD TO BAG BAR (MOBILE & DESKTOP) */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white sm:bg-white/95 sm:backdrop-blur-md border-t border-neutral-200 px-4 sm:px-12 py-3 shadow-lg"
          >
            <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 object-cover border border-neutral-200 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 shrink-0" />
                )}
                <div className="hidden sm:block">
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900 block truncate max-w-xs">
                    {product.name}
                  </span>
                  <span className="text-xs font-serif text-neutral-600">
                    ${product.retailPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="sm:hidden text-xs font-serif font-semibold text-neutral-900">
                  ${product.retailPrice.toLocaleString()}
                </span>
                <button
                  onClick={handleAdd}
                  className="py-3 px-6 bg-neutral-950 text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                  id="pdp-sticky-add-btn"
                >
                  {t('Add to Bag')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. FULL-SCREEN IMAGE ZOOM MODAL */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 text-white p-2 hover:opacity-75 cursor-pointer z-10"
            >
              <X size={28} />
            </button>
            {galleryImages[selectedImageIdx] ? (
              <img
                src={galleryImages[selectedImageIdx]}
                alt={product.name}
                className="max-w-full max-h-[90vh] object-contain"
              />
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
