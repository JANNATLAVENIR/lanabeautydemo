import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useI18n } from '../i18n';

export interface ProductGridSectionProps {
  title: string;
  subtitle?: string;
  categoryTag?: string;
  products: Product[];
  wishlistIds: string[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onViewAll?: () => void;
}

export const ProductGridSection: React.FC<ProductGridSectionProps> = ({
  title,
  subtitle,
  categoryTag,
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onViewDetails,
  onViewAll
}) => {
  const { t, localizeCategory } = useI18n();
  if (!products || products.length === 0) return null;

  return (
    <section className="w-full py-12 sm:py-20 bg-white font-sans">
      <div className="max-w-[1700px] mx-auto px-5 sm:px-12">
        {/* Header with Title & Navigation Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 pb-4 border-b border-neutral-100 space-y-4 sm:space-y-0">
          <div className="space-y-1">
            {categoryTag && (
              <span className="text-[9.5px] uppercase tracking-[0.35em] font-medium text-neutral-400 block">
                {localizeCategory(categoryTag)}
              </span>
            )}
            <h2 className="font-serif text-[28px] sm:text-4xl text-neutral-900 font-light uppercase">
              {t(title, title)}
            </h2>
            {subtitle && (
              <p className="text-xs text-neutral-500 font-light hidden sm:block">
                {t(subtitle, subtitle)}
              </p>
            )}
          </div>

          <div>
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="group flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] font-medium text-neutral-900 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <span>{t('View all')}</span>
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Grid on Mobile, 4-Column on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {products.slice(0, 4).map((product) => (
            <div key={product.id}>
              <ProductCard
                product={product}
                isWishlisted={wishlistIds.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
