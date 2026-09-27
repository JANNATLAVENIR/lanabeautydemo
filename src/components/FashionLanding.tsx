import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import fashionModelHeroImg from '../assets/images/dior_portrait_studio_couture_model_1789029662765.jpg';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useI18n } from '../i18n';

interface FashionLandingProps {
  products?: Product[];
  allProducts?: Product[];
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onNavigateToCatalog?: (category: string, subCategory?: string) => void;
  onSelectCategory?: (category: string) => void;
  onNavigateToCollection?: (collectionId: string) => void;
  onNavigateToView?: (view: any) => void;
}

export const FashionLanding: React.FC<FashionLandingProps> = ({
  products = [],
  allProducts = [],
  wishlistIds = [],
  onToggleWishlist = (_product: Product) => {},
  onAddToCart = (_product: Product) => {},
  onViewDetails = (_product: Product) => {},
  onNavigateToCatalog,
  onSelectCategory,
  onNavigateToCollection,
  onNavigateToView
}) => {
  const { t } = useI18n();
  const productsList = (allProducts && allProducts.length > 0) ? allProducts : (products || []);
  const [selectedSubTab, setSelectedSubTab] = useState<'ALL' | 'BAGS' | 'SHOES' | 'COUTURE' | 'ACCESSORIES'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavCatalog = (cat: string) => {
    if (onNavigateToCatalog) onNavigateToCatalog(cat);
    else if (onSelectCategory) onSelectCategory(cat);
  };

  const handleNavCollection = (colId: string) => {
    if (onNavigateToCollection) onNavigateToCollection(colId);
    else if (onNavigateToView) onNavigateToView('collections');
  };

  const fashionProducts = (productsList || []).filter((p) => {
    if (!p || !p.category) return false;
    const cat = p.category.toUpperCase();
    const isFashionCat = cat === 'BAGS' || cat === 'SHOES' || cat === 'FASHION' || cat === 'ACCESSORIES';
    if (!isFashionCat) return false;
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
    ? fashionProducts
    : selectedSubTab === 'BAGS'
    ? fashionProducts.filter((p) => (p.category || '').toUpperCase() === 'BAGS')
    : selectedSubTab === 'SHOES'
    ? fashionProducts.filter((p) => (p.category || '').toUpperCase() === 'SHOES')
    : selectedSubTab === 'COUTURE'
    ? fashionProducts.filter((p) => (p.category || '').toUpperCase() === 'FASHION')
    : fashionProducts.filter((p) => (p.category || '').toUpperCase() === 'ACCESSORIES');

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pt-20">
      {/* 1. CINEMATIC FASHION HERO CAMPAIGN */}
      <section className="relative h-[80vh] min-h-[600px] w-full overflow-hidden bg-neutral-950 text-white flex items-center justify-center">
        <img
          src={fashionModelHeroImg}
          alt="Haute Couture Autumn Winter 2026"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-70 scale-105 animate-pulse transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/30 to-black/40" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/20 bg-black/40 backdrop-blur-md text-[9px] uppercase tracking-[0.4em] text-white/90">
            <Sparkles size={11} className="text-amber-300" />
            <span>{t('HAUTE COUTURE & READY-TO-WEAR 2026')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-light tracking-wide uppercase leading-tight text-white drop-shadow-md">
            {t('The Autumn Silhouette')}
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 font-sans max-w-xl mx-auto font-light leading-relaxed tracking-wide">
            {t('Architectural tailoring, pure mulberry silk twill, and handcrafted cannage leather bags from the historic ateliers of Paris and Florence.')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleNavCatalog('FASHION')}
              className="px-8 py-3.5 bg-white text-neutral-950 text-[10.5px] uppercase font-bold tracking-[0.25em] hover:bg-neutral-200 transition-all duration-300 cursor-pointer"
            >
              {t('Explore Collection')}
            </button>
            <button
              onClick={() => handleNavCollection('riviera-couture')}
              className="px-8 py-3.5 border border-white/70 text-white text-[10.5px] uppercase font-bold tracking-[0.25em] hover:bg-white/10 transition-all duration-300 cursor-pointer"
            >
              {t('Discover Lookbook')}
            </button>
          </div>
        </div>
      </section>

      {/* 2. SUB-DEPARTMENT SELECTOR */}
      <section className="border-b border-neutral-200 bg-neutral-50 sm:bg-neutral-50/50 sticky top-14 sm:top-16 lg:top-20 z-30 sm:backdrop-blur-md">
        <div className="max-w-[1700px] mx-auto px-6 sm:px-12 flex items-center justify-between overflow-x-auto py-4 scrollbar-none">
          <div className="flex items-center gap-2 sm:gap-4">
            {[
              { id: 'ALL', label: t('All') + ' ' + t('Fashion') },
              { id: 'BAGS', label: t('Leather Bags') },
              { id: 'SHOES', label: t('Footwear & Pumps') },
              { id: 'COUTURE', label: t('Ready-to-Wear') },
              { id: 'ACCESSORIES', label: t('Accessories') }
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
                placeholder={t('Search in Fashion...', 'Search in Fashion...')}
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

      {/* 3. RUNWAY CURATED GRID */}
      <section className="max-w-[1700px] mx-auto px-6 sm:px-12 py-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b border-neutral-100 pb-6 mb-12 gap-4">
          <div>
            <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 block mb-1">
              {t('THE ATELIER CURATION')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-light text-neutral-900 tracking-wide uppercase">
              {t('Runway Creations & Leather Icons')}
            </h2>
          </div>
          <button
            onClick={() => handleNavCatalog('FASHION')}
            className="text-xs uppercase tracking-[0.2em] font-bold text-neutral-900 hover:text-neutral-500 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>{t('View Full Catalogue')}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center text-neutral-400 font-sans text-xs">
            <p className="font-serif text-xl text-neutral-700 mb-2">No runway creations currently listed</p>
            <p className="text-[11px] text-neutral-400">Our curators are preparing the forthcoming haute couture collection.</p>
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

      {/* 4. EDITORIAL STORY SECTION: SAVOIR-FAIRE */}
      <section className="bg-neutral-950 text-white py-24 my-12 overflow-hidden">
        <div className="max-w-[1700px] mx-auto px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-[9px] uppercase tracking-[0.45em] text-amber-300 font-bold block">
              {t('SAVOIR-FAIRE DE LA MAISON')}
            </span>
            <h3 className="text-3xl sm:text-5xl font-serif font-light tracking-wide uppercase leading-tight">
              {t('The Architecture of Quilted Lambskin')}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-300 font-light leading-relaxed font-sans">
              {t('Every iconic cannage handbag is sculpted over curved wooden forms by master leather artisans in Florence. Over eight hours of hand-guided embroidery ensure flawless symmetry and eternal durability.')}
            </p>
            <div className="pt-4 flex items-center gap-4">
              <button
                onClick={() => handleNavCatalog('BAGS')}
                className="px-7 py-3 bg-white text-neutral-950 text-[10px] uppercase font-bold tracking-[0.25em] hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                {t('Discover Handbags')}
              </button>
              <button
                onClick={() => handleNavCollection('nocturne-velvet')}
                className="px-7 py-3 border border-white/40 text-white text-[10px] uppercase font-bold tracking-[0.25em] hover:bg-white/10 transition-colors cursor-pointer"
              >
                {t('The Nocturne Edit')}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4">
            <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
              <img
                src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=85&w=800"
                alt="Lady LANA Cannage"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900 mt-8">
              <img
                src="https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&q=85&w=800"
                alt="Chanel Classic Double Flap"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. FOOTWEAR & SILHOUETTES */}
      <section className="max-w-[1700px] mx-auto px-6 sm:px-12 py-16">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 block">
            {t('HAUTE COUTURE FOOTWEAR')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-light text-neutral-900 tracking-wide uppercase">
            {t('Signature Heels & Mules')}
          </h2>
          <p className="text-xs text-neutral-500 font-sans leading-relaxed">
            {t('From the comma-heeled J’Alana slingback to two-tone Parisian slingbacks and braided espadrilles.')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {fashionProducts.filter((p) => (p.category || '').toUpperCase() === 'SHOES').map((product) => (
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
      </section>
    </div>
  );
};
