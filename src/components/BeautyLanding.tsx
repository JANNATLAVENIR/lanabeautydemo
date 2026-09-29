import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';
import beautyModelHeroImg from '../assets/images/dior_lightbrown_beauty_diamonds_perfume_1788954970837.jpg';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useI18n } from '../i18n';

interface BeautyLandingProps {
  products?: Product[];
  allProducts?: Product[];
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onNavigateToCatalog?: (category: string, subCategory?: string) => void;
  onSelectCategory?: (category: string) => void;
  onSelectSubCategory?: (category: string) => void;
  onNavigateHome?: () => void;
  onNavigateToStory?: (storyId: string) => void;
  onNavigateToView?: (view: any) => void;
}

export const BeautyLanding: React.FC<BeautyLandingProps> = ({
  products = [],
  allProducts = [],
  wishlistIds = [],
  onToggleWishlist = (_product: Product) => {},
  onAddToCart = (_product: Product) => {},
  onViewDetails = (_product: Product) => {},
  onNavigateToCatalog,
  onSelectCategory,
  onNavigateToStory,
  onNavigateToView
}) => {
  const { t } = useI18n();
  const productsList = (allProducts && allProducts.length > 0) ? allProducts : (products || []);
  const [selectedSubTab, setSelectedSubTab] = useState<'ALL' | 'FRAGRANCE' | 'SKINCARE' | 'MAKEUP' | 'BODYCARE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavCatalog = (cat: string) => {
    if (onNavigateToCatalog) onNavigateToCatalog(cat);
    else if (onSelectCategory) onSelectCategory(cat);
  };

  const handleNavStory = (storyId: string) => {
    if (onNavigateToStory) onNavigateToStory(storyId);
    else if (onNavigateToView) onNavigateToView('stories');
  };

  // Fragrance Finder State
  const [scentMood, setScentMood] = useState<'Sensual' | 'Fresh' | 'Noble' | 'Solar'>('Sensual');
  const [scentFamily, setScentFamily] = useState<'Oud & Woods' | 'Damask Rose' | 'Solar Citrus' | 'Amber Vanilla'>('Damask Rose');

  const beautyProducts = (productsList || []).filter((p) => {
    if (!p) return false;
    const cat = (p.category || '').toUpperCase();
    const dept = (p.department || '').toUpperCase();
    const sub = (p.subCategory || '').toUpperCase();

    // Check if explicitly Beauty department or beauty-related category
    const isBeautyDept = dept.includes('BEAUTY') || dept.includes('FRAGRANCE') || dept.includes('SKINCARE') || dept.includes('BODYCARE') || dept.includes('COSMETIC');
    const isBeautyCategory = 
      cat === 'FRAGRANCE' || cat.includes('FRAGRANCE') || cat.includes('PERFUME') || cat.includes('PARFUM') || cat.includes('OUD') ||
      cat === 'SKINCARE' || cat.includes('SKIN') || cat.includes('SERUM') || cat.includes('CREAM') ||
      cat === 'MAKEUP' || cat.includes('MAKEUP') || cat.includes('COSMETIC') || cat.includes('LIP') || cat.includes('GLOW') ||
      cat === 'BODYCARE' || cat === 'BODY CARE' || cat.includes('BODY') || cat.includes('DEODORANT') || cat.includes('HAIR') || cat.includes('BATH') ||
      cat === 'BEAUTY';

    // Must not be explicitly pure apparel unless department says beauty
    const isFashionExclusive = (dept === 'FASHION' || dept === 'COUTURE') && 
      (cat === 'BAGS' || cat === 'SHOES' || cat === 'FASHION' || cat === 'DRESS' || cat === 'CLOTHING');

    if (isFashionExclusive) return false;
    if (!isBeautyDept && !isBeautyCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const filteredProducts = selectedSubTab === 'ALL'
    ? beautyProducts
    : selectedSubTab === 'FRAGRANCE'
    ? beautyProducts.filter((p) => {
        const c = (p.category || '').toUpperCase();
        const s = (p.subCategory || '').toUpperCase();
        const d = (p.department || '').toUpperCase();
        return c === 'FRAGRANCE' || c.includes('FRAGRANCE') || c.includes('PERFUME') || c.includes('PARFUM') || c.includes('OUD') || s.includes('PARFUM') || d.includes('FRAGRANCE');
      })
    : selectedSubTab === 'SKINCARE'
    ? beautyProducts.filter((p) => {
        const c = (p.category || '').toUpperCase();
        const s = (p.subCategory || '').toUpperCase();
        const d = (p.department || '').toUpperCase();
        return c === 'SKINCARE' || c.includes('SKIN') || c.includes('SERUM') || c.includes('CREAM') || s.includes('SKIN') || d.includes('SKIN');
      })
    : selectedSubTab === 'MAKEUP'
    ? beautyProducts.filter((p) => {
        const c = (p.category || '').toUpperCase();
        const s = (p.subCategory || '').toUpperCase();
        const d = (p.department || '').toUpperCase();
        return c === 'MAKEUP' || c.includes('MAKEUP') || c.includes('COSMETIC') || c.includes('LIP') || s.includes('LIP') || d.includes('MAKEUP');
      })
    : beautyProducts.filter((p) => {
        const c = (p.category || '').toUpperCase();
        const s = (p.subCategory || '').toUpperCase();
        const d = (p.department || '').toUpperCase();
        return c === 'BODYCARE' || c.includes('BODY') || c.includes('DEODORANT') || c.includes('HAIR') || s.includes('BODY') || d.includes('BODY');
      });

  const recommendedFragrance = (beautyProducts.length > 0)
    ? (scentFamily === 'Damask Rose'
        ? beautyProducts.find((p) => p.id === 'dior-fragrance-miss-dior-parfum') || beautyProducts[0]
        : scentFamily === 'Oud & Woods'
        ? beautyProducts.find((p) => p.id === 'dior-fragrance-oud-ispahan') || beautyProducts[0]
        : scentFamily === 'Solar Citrus'
        ? beautyProducts.find((p) => p.id === 'dior-fragrance-dioriviera') || beautyProducts[0]
        : beautyProducts.find((p) => p.id === 'dior-fragrance-sauvage-elixir') || beautyProducts[0])
    : null;

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pt-20">
      {/* 1. CINEMATIC BEAUTY HERO */}
      <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden bg-neutral-950 text-white flex items-center justify-center">
        <img
          src={beautyModelHeroImg}
          alt="Haute Parfumerie & Beauté"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70 scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/30 to-black/40" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 bg-black/40 backdrop-blur-md text-[9px] uppercase tracking-[0.4em] text-white/90">
            <Sparkles size={11} className="text-amber-300" />
            <span>{t('HAUTE PARFUMERIE & PRESTIGE BEAUTÉ')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-light tracking-wide uppercase leading-tight text-white">
            {t('L’Élixir Sanctuary')}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-xl mx-auto font-light leading-relaxed tracking-wide">
            {t('Rare extraits de parfum, cellular revitalization serums, and backstage velvet makeup formulas made for memorable presence.')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleNavCatalog('FRAGRANCE')}
              className="px-8 py-3.5 bg-white text-neutral-950 text-[10.5px] uppercase font-bold tracking-[0.25em] hover:bg-neutral-200 transition-all duration-300 cursor-pointer"
            >
              {t('Explore Parfumerie')}
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('scent-finder-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3.5 border border-white/70 text-white text-[10.5px] uppercase font-bold tracking-[0.25em] hover:bg-white/10 transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              <Compass size={13} />
              <span>{t('Scent Finder Consultation')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. SUB-DEPARTMENT SELECTOR */}
      <section className="border-b border-neutral-200 bg-neutral-50 sm:bg-neutral-50/50 sticky top-14 sm:top-16 lg:top-20 z-30 sm:backdrop-blur-md">
        <div className="max-w-[1700px] mx-auto px-6 sm:px-12 flex items-center justify-between overflow-x-auto py-4 scrollbar-none">
          <div className="flex items-center gap-2 sm:gap-4">
            {[
              { id: 'ALL', label: t('All') + ' ' + t('Beauty') },
              { id: 'FRAGRANCE', label: t('Fragrance') },
              { id: 'SKINCARE', label: t('Skincare') },
              { id: 'MAKEUP', label: t('Makeup') },
              { id: 'BODYCARE', label: t('Bodycare') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedSubTab(tab.id as any)}
                className={`px-4 py-2 text-[10.5px] uppercase tracking-[0.22em] font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedSubTab === tab.id
                    ? 'bg-neutral-900 text-white'
                    : 'bg-transparent text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder={t('Search in Beauty...', 'Search in Beauty...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-8 py-1.5 text-xs bg-white border border-neutral-300 rounded-none focus:outline-none focus:border-neutral-900 w-48 font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-900 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-xs text-neutral-400">{filteredProducts.length} {filteredProducts.length === 1 ? t('Creation', 'Creation') : t('Creations', 'Creations')}</span>
          </div>
        </div>
      </section>

      {/* 3. CURATED BEAUTY SHELF */}
      <section className="max-w-[1700px] mx-auto px-6 sm:px-12 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-neutral-100 pb-6 mb-12 gap-4">
          <div>
            <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 block mb-1">
              {t('THE BEAUTY ARCHIVE')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-light text-neutral-900 tracking-wide uppercase">
              {t('Icons of Scent & Cellular Care')}
            </h2>
          </div>
          <button
            onClick={() => handleNavCatalog('FRAGRANCE')}
            className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-900 hover:text-neutral-500 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>{t('Browse Full Range')}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 font-sans text-xs">
            <p className="font-serif text-xl text-neutral-700 mb-2">No beauty elixirs currently listed</p>
            <p className="text-[11px] text-neutral-400">Our parfumeurs and specialists are formulating the next edition.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. INTERACTIVE SCENT FINDER CONSULTATION */}
      <section id="scent-finder-section" className="bg-[#FAF9F5] border-t border-b border-neutral-200/80 py-24 my-8">
        <div className="max-w-5xl mx-auto px-6 sm:px-12">
          <div className="text-center space-y-3 mb-12">
            <span className="text-[9px] uppercase tracking-[0.45em] text-amber-700 font-bold block">
              {t('BESPOKE OLFACTORY CONSULTATION')}
            </span>
            <h3 className="text-3xl sm:text-4xl font-serif font-light uppercase tracking-wide">
              {t('Find Your Signature Sillage')}
            </h3>
            <p className="text-xs text-neutral-500 font-sans max-w-lg mx-auto">
              {t('Select your desired aura and olfactive family to receive an instant master blend recommendation.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Step 1: Mood */}
            <div className="bg-white p-6 sm:p-8 border border-neutral-200/80 space-y-4 shadow-sm">
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-400 block">
                01. {t('SELECT DESIRED ATMOSPHERE', 'SELECT DESIRED ATMOSPHERE')}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(['Sensual', 'Fresh', 'Noble', 'Solar'] as const).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setScentMood(mood)}
                    className={`py-3 px-4 text-xs tracking-wider uppercase font-semibold text-center border transition-all cursor-pointer ${
                      scentMood === mood
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-neutral-50'
                    }`}
                  >
                    {t(mood)}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Family */}
            <div className="bg-white p-6 sm:p-8 border border-neutral-200/80 space-y-4 shadow-sm">
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-400 block">
                02. {t('SELECT PRIMARY OLFACTORY ACCORD', 'SELECT PRIMARY OLFACTORY ACCORD')}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(['Damask Rose', 'Oud & Woods', 'Solar Citrus', 'Amber Vanilla'] as const).map((family) => (
                  <button
                    key={family}
                    onClick={() => setScentFamily(family)}
                    className={`py-3 px-4 text-xs tracking-wider uppercase font-semibold text-center border transition-all cursor-pointer ${
                      scentFamily === family
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                        : 'border-neutral-200 text-neutral-700 hover:border-neutral-400 bg-neutral-50'
                    }`}
                  >
                    {t(family)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scent Result Card */}
          {recommendedFragrance && (
            <div className="bg-white border border-neutral-200 p-8 sm:p-10 shadow-lg grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-4 aspect-[3/4] bg-neutral-100 overflow-hidden">
                {recommendedFragrance.image && recommendedFragrance.image.trim() !== '' ? (
                  <img
                    src={recommendedFragrance.image}
                    alt={recommendedFragrance.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                    No Image
                  </div>
                )}
              </div>

              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <Sparkles size={13} />
                  <span className="text-[9px] uppercase tracking-[0.35em] font-bold">
                    {t('RECOMMENDED MASTER CREATION')}
                  </span>
                </div>

                <h4 className="text-2xl font-serif font-light text-neutral-900 uppercase">
                  {recommendedFragrance.name}
                </h4>

                <p className="text-xs text-neutral-600 leading-relaxed font-sans">
                  {recommendedFragrance.description}
                </p>

                <div className="text-sm font-medium text-neutral-900 pt-2">
                  ${recommendedFragrance.retailPrice} • {recommendedFragrance.volume}
                </div>

                <div className="pt-4 flex flex-wrap gap-4">
                  <button
                    onClick={() => recommendedFragrance && onAddToCart(recommendedFragrance)}
                    className="px-8 py-3 bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-[0.25em] hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {t('Add to Bag')}
                  </button>
                  <button
                    onClick={() => recommendedFragrance && onViewDetails(recommendedFragrance)}
                    className="px-8 py-3 border border-neutral-300 text-neutral-900 text-[10px] uppercase font-bold tracking-[0.25em] hover:border-black transition-colors cursor-pointer"
                  >
                    {t('Details')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. SAVOIR-FAIRE DE GRASSE STORY TEASER */}
      <section className="max-w-[1700px] mx-auto px-6 sm:px-12 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6">
          <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 block">
            {t('THE ATELIER JOURNAL')}
          </span>
          <h3 className="text-3xl sm:text-4xl font-serif font-light uppercase tracking-wide leading-tight">
            {t('The Art of Fragrance Layering')}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-sans">
            {t('How master perfumers compose multidimensional sillage that evolves from sunrise to twilight. Learn how to anchor volatile citrus notes over perfumed body creams and hair mists.')}
          </p>
          <button
            onClick={() => handleNavStory('story-1')}
            className="px-7 py-3 bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-[0.25em] hover:bg-neutral-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <span>{t('Read Masterclass')}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="lg:col-span-6 relative aspect-[16/10] overflow-hidden bg-neutral-100 shadow-md">
          <img
            src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=85&w=1200"
            alt="Fragrance Layering"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>
    </div>
  );
};
