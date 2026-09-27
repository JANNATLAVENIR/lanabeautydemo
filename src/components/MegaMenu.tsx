import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { Category } from '../types';

interface MegaMenuProps {
  isOpen: boolean;
  activeMenu: string | null;
  onClose: () => void;
  onSelectCategory: (category: string) => void;
  onNavigateToView: (view: any, extra?: any) => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  activeMenu,
  onClose,
  onSelectCategory,
  onNavigateToView
}) => {
  if (!isOpen || !activeMenu) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        onMouseLeave={onClose}
        className="absolute top-full left-0 w-full bg-white/98 backdrop-blur-xl border-b border-neutral-200/80 shadow-2xl z-50 text-neutral-900"
      >
        <div className="max-w-[1700px] mx-auto px-8 sm:px-12 py-10 lg:py-12">
          {/* FASHION MEGA MENU */}
          {activeMenu === 'fashion' && (
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-3 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  WOMEN'S READY-TO-WEAR
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    'Dresses & Gowns',
                    'Jackets & Blazers',
                    'Coats & Outerwear',
                    'Silk Tops & Shirts',
                    'Skirts & Trousers',
                    'Knitwear & Cashmere',
                    'Evening & Gala'
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory('FASHION');
                          onNavigateToView('catalog', { subCategory: item });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-3 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  DIOR MEN'S DRESS
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    { label: 'Dior Men Shirts', cat: 'SHIRT' },
                    { label: 'Selvedge Jeans & Denim', cat: 'JEANS' },
                    { label: 'B23 / B27 Sneakers & Shoes', cat: 'SHOES' },
                    { label: 'Chiffre Rouge Watches', cat: 'WATCHES' },
                    { label: "All Men's Dress", cat: 'MEN' }
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory(item.cat);
                          onNavigateToView('catalog', { category: item.cat, department: 'FASHION', gender: 'Men' });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-3 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  LEATHER &amp; FOOTWEAR
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    'Iconic Handbags',
                    'Tote & Travel Bags',
                    'Crossbody Bags',
                    'Slingback Pumps',
                    'Mules & Slides',
                    'Couture Sneakers',
                    'Small Leather Goods'
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory(item.includes('Bags') || item.includes('Handbags') ? 'BAGS' : 'SHOES');
                          onNavigateToView('catalog', { subCategory: item });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Editorial Visual Feature */}
              <div className="col-span-3">
                <div 
                  onClick={() => {
                    onNavigateToView('catalog', { category: 'MEN', department: 'FASHION' });
                    onClose();
                  }}
                  className="group relative h-[260px] overflow-hidden bg-neutral-100 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&q=85&w=800"
                    alt="Dior Men Haute Couture"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[8.5px] uppercase tracking-[0.3em] text-neutral-300 font-semibold block mb-1">
                      DIOR MEN COUTURE
                    </span>
                    <h4 className="text-lg font-serif font-light uppercase tracking-wider">
                      Men's Dress & Tailoring
                    </h4>
                    <span className="text-[9.5px] uppercase tracking-widest text-neutral-200 mt-1 flex items-center gap-1">
                      <span>Explore Collection</span>
                      <ChevronRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MEN'S DRESS MEGA MENU */}
          {activeMenu === 'men' && (
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-3 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  CATEGORIES
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    { label: 'Shirt (Silk & Poplin)', cat: 'SHIRT' },
                    { label: 'Jeans (Selvedge & Raw)', cat: 'JEANS' },
                    { label: 'Shoes (Sneakers & Loafers)', cat: 'SHOES' },
                    { label: 'Watches (Haute Horlogerie)', cat: 'WATCHES' }
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory(item.cat);
                          onNavigateToView('catalog', { category: item.cat, department: 'FASHION', gender: 'Men' });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer font-medium"
                      >
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-3 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  THE DIOR MEN ICONS
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    { label: 'Dior Oblique Silk Shirt', cat: 'SHIRT' },
                    { label: 'Dior Selvedge Slim Jeans', cat: 'JEANS' },
                    { label: 'Dior B23 High-Top Sneakers', cat: 'SHOES' },
                    { label: 'Chiffre Rouge Automatic Watch', cat: 'WATCHES' }
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory(item.cat);
                          onNavigateToView('catalog', { category: item.cat, department: 'FASHION', gender: 'Men' });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-3 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  HORLOGERIE & ACCESSORIES
                </span>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      onSelectCategory('WATCHES');
                      onNavigateToView('catalog', { category: 'WATCHES', department: 'FASHION', gender: 'Men' });
                      onClose();
                    }}
                    className="block text-left group cursor-pointer"
                  >
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-900 group-hover:text-neutral-500 transition-colors flex items-center gap-1.5">
                      <span>Chiffre Rouge Timepieces</span>
                      <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1">Manufacture calibre automatic chronometers.</p>
                  </button>

                  <button
                    onClick={() => {
                      onSelectCategory('MEN');
                      onNavigateToView('catalog', { category: 'MEN', department: 'FASHION', gender: 'Men' });
                      onClose();
                    }}
                    className="block text-left group cursor-pointer pt-2"
                  >
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-900 group-hover:text-neutral-500 transition-colors flex items-center gap-1.5">
                      <span>View All Men's Dress</span>
                      <Sparkles size={11} className="text-amber-700" />
                    </span>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1">Complete Dior Men ready-to-wear runway edit.</p>
                  </button>
                </div>
              </div>

              {/* Men Visual Feature */}
              <div className="col-span-3">
                <div 
                  onClick={() => {
                    onSelectCategory('MEN');
                    onNavigateToView('catalog', { category: 'MEN', department: 'FASHION', gender: 'Men' });
                    onClose();
                  }}
                  className="group relative h-[260px] overflow-hidden bg-neutral-100 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=85&w=800"
                    alt="Dior Men Tailoring"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[8.5px] uppercase tracking-[0.3em] text-neutral-300 font-semibold block mb-1">
                      NEW SEASON
                    </span>
                    <h4 className="text-lg font-serif font-light uppercase tracking-wider">
                      Dior Men Runway 2026
                    </h4>
                    <span className="text-[9.5px] uppercase tracking-widest text-neutral-200 mt-1 flex items-center gap-1">
                      <span>Shop Now</span>
                      <ChevronRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BEAUTY MEGA MENU */}
          {activeMenu === 'beauty' && (
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-3 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  HAUTE PARFUMERIE
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    'Extraits de Parfum',
                    'Eau de Parfum',
                    'Private Blends',
                    'Hair Mists',
                    'Travel Atomizers',
                    'Discovery Sets'
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory('FRAGRANCE');
                          onNavigateToView('catalog', { subCategory: item });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-3 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  SKINCARE &amp; MAKEUP
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    'Prestige Serums',
                    'Cellular Cremes',
                    'Velvet Lipsticks',
                    'Complexion & Tints',
                    'Luminizers & Powders',
                    'Backstage Brushes'
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory(item.includes('Serum') || item.includes('Cremes') ? 'SKINCARE' : 'MAKEUP');
                          onNavigateToView('catalog', { subCategory: item });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-3 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  BEAUTY SERVICES &amp; EDITS
                </span>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      onNavigateToView('beauty');
                      onClose();
                    }}
                    className="block text-left group cursor-pointer"
                  >
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-900 group-hover:text-neutral-500 transition-colors flex items-center gap-1.5">
                      <span>Explore Beauty Sanctuary</span>
                      <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1">Scent finder, backstage rituals, and masterclasses.</p>
                  </button>

                  <button
                    onClick={() => {
                      onNavigateToView('stories');
                      onClose();
                    }}
                    className="block text-left group cursor-pointer pt-2"
                  >
                    <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-900 group-hover:text-neutral-500 transition-colors flex items-center gap-1.5">
                      <span>The Art of Fragrance Layering</span>
                      <Sparkles size={11} className="text-amber-700" />
                    </span>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1">Read the masterclass on custom scent trails.</p>
                  </button>
                </div>
              </div>

              {/* Editorial Visual Feature */}
              <div className="col-span-3">
                <div 
                  onClick={() => {
                    onNavigateToView('beauty');
                    onClose();
                  }}
                  className="group relative h-[260px] overflow-hidden bg-neutral-100 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1541604193435-22287d32c2c2?auto=format&fit=crop&q=85&w=800"
                    alt="High Perfumery"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[8.5px] uppercase tracking-[0.3em] text-neutral-300 font-semibold block mb-1">
                      MAISON EXCLUSIVE
                    </span>
                    <h4 className="text-lg font-serif font-light uppercase tracking-wider">
                      L'Élixir Privé
                    </h4>
                    <span className="text-[9.5px] uppercase tracking-widest text-neutral-200 mt-1 flex items-center gap-1">
                      <span>Explore Collection</span>
                      <ChevronRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BODYCARE MEGA MENU */}
          {activeMenu === 'bodycare' && (
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-4 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  BODY &amp; BATH RITUALS
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    'Scented Body Cremes',
                    'Botanical Bath & Shower Oils',
                    'Perfumed Hair Mists',
                    'Deodorant Sticks',
                    'Hand & Cuticle Balms'
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory('BODYCARE');
                          onNavigateToView('catalog', { subCategory: item });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-4 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  SIGNATURE SCENTS
                </span>
                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                  Infuse your daily ritual with nourishing body balms formulated with Damascus rose wax, Mediterranean citrus oils, and velvet musks.
                </p>
                <button
                  onClick={() => {
                    onSelectCategory('BODYCARE');
                    onNavigateToView('catalog');
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-neutral-900 text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Shop Bodycare Collection
                </button>
              </div>

              <div className="col-span-4">
                <div 
                  onClick={() => {
                    onSelectCategory('BODYCARE');
                    onNavigateToView('catalog');
                    onClose();
                  }}
                  className="group relative h-[240px] overflow-hidden bg-neutral-100 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85&w=800"
                    alt="Body Rituals"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h4 className="text-base font-serif font-light uppercase tracking-wide">
                      Sensorial Rose Nectars
                    </h4>
                    <span className="text-[9px] uppercase tracking-widest text-neutral-300">
                      Discover Rituals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACCESSORIES MEGA MENU */}
          {activeMenu === 'accessories' && (
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-4 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  HAUTE ACCESSORIES
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    'Vanity Cases & Wallets',
                    'Silk Twill Scarves',
                    'Designer Sunglasses',
                    'Fine Leather Belts',
                    'Facial Sculpting Rollers'
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory('ACCESSORIES');
                          onNavigateToView('catalog', { subCategory: item });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-4 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  THE ART OF FINISHING
                </span>
                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                  Sculpted in Saffiano leathers, gold-finish hardware, and hand-rolled silk twill. The definitive accents to elevate any silhouette.
                </p>
                <button
                  onClick={() => {
                    onSelectCategory('ACCESSORIES');
                    onNavigateToView('catalog');
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-neutral-900 text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors"
                >
                  Explore All Accessories
                </button>
              </div>

              <div className="col-span-4">
                <div 
                  onClick={() => {
                    onSelectCategory('ACCESSORIES');
                    onNavigateToView('catalog');
                    onClose();
                  }}
                  className="group relative h-[240px] overflow-hidden bg-neutral-100 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=85&w=800"
                    alt="Vanity Case"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h4 className="text-base font-serif font-light uppercase tracking-wide">
                      Travel Vanities &amp; Wallets
                    </h4>
                    <span className="text-[9px] uppercase tracking-widest text-neutral-300">
                      Explore Leather Goods
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NEW ARRIVALS MEGA MENU */}
          {activeMenu === 'new' && (
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-4 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  THE NEW EDIT
                </span>
                <ul className="space-y-2.5 text-xs font-sans tracking-wide">
                  {[
                    'Latest Fashion Arrivals',
                    'Haute Parfumerie Launches',
                    'Runway Leather Bags',
                    'Limited Edition Lip Velvets',
                    'Atelier Exclusives'
                  ].map((item, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => {
                          onSelectCategory('ALL');
                          onNavigateToView('catalog', { filterNew: true });
                          onClose();
                        }}
                        className="text-neutral-600 hover:text-black hover:translate-x-1 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{item}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="col-span-4 space-y-6">
                <span className="text-[9.5px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block border-b border-neutral-100 pb-2">
                  SEASONAL CAMPAIGN
                </span>
                <h3 className="text-xl font-serif font-light uppercase tracking-wide">
                  Autumn / Winter 2026 Archive
                </h3>
                <p className="text-xs text-neutral-500 font-sans leading-relaxed">
                  Discover new season silhouettes, velvety textures, and concentrated extrait perfumes crafted for the connoisseur.
                </p>
                <button
                  onClick={() => {
                    onSelectCategory('ALL');
                    onNavigateToView('catalog', { filterNew: true });
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-neutral-900 text-white text-[10px] uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors"
                >
                  View All New Creations
                </button>
              </div>

              <div className="col-span-4">
                <div 
                  onClick={() => {
                    onSelectCategory('ALL');
                    onNavigateToView('catalog', { filterNew: true });
                    onClose();
                  }}
                  className="group relative h-[240px] overflow-hidden bg-neutral-100 cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1547887538-e3a2f32cb1cc?auto=format&fit=crop&q=85&w=800"
                    alt="New Arrivals"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h4 className="text-base font-serif font-light uppercase tracking-wide">
                      The Seasonal Edit
                    </h4>
                    <span className="text-[9px] uppercase tracking-widest text-neutral-300">
                      Explore Creations
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
