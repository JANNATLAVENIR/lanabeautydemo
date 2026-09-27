import React, { useState, memo } from 'react';
import { Heart } from 'lucide-react';
import { Product } from '../types';
import { useI18n } from '../i18n';

export interface ProductCardProps {
  key?: React.Key;
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export function getProductBrand(product: Product): string {
  if (product.brand) return product.brand.toUpperCase();
  const name = product.name.toLowerCase();
  const desc = product.description?.toLowerCase() || '';
  if (name.includes('hermes') || name.includes('hermès') || desc.includes('hermes') || desc.includes('hermès') || desc.includes('birkin') || desc.includes('kelly')) return 'HERMÈS';
  if (name.includes('dior') || desc.includes('dior')) return 'CHRISTIAN DIOR';
  if (name.includes('chanel') || desc.includes('chanel')) return 'CHANEL';
  if (name.includes('saint laurent') || name.includes('ysl') || desc.includes('saint laurent')) return 'SAINT LAURENT';
  if (name.includes('bottega') || desc.includes('bottega')) return 'BOTTEGA VENETA';
  if (name.includes('la mer') || desc.includes('la mer')) return 'LA MER';
  if (name.includes('augustinus') || desc.includes('augustinus')) return 'AUGUSTINUS BADER';
  if (name.includes('guerlain') || desc.includes('guerlain')) return 'GUERLAIN';
  return 'MAISON LANA';
}

export const ProductCard = memo(function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onViewDetails
}: ProductCardProps) {
  const { t } = useI18n();
  const brand = getProductBrand(product);

  return (
    <div
      className="group relative flex flex-col justify-between bg-white text-neutral-900 cursor-pointer select-none contain-content"
      onClick={() => onViewDetails(product)}
      id={`product-card-${product.id}`}
    >
      {/* Product Image Area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-100">
        {product.image && product.image.trim() !== '' ? (
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            decoding="async"
            className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-104"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs bg-neutral-100">
            No Image
          </div>
        )}

        {/* Subtle Dark Vignette on Hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {/* Wishlist Heart Icon (Top Right) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-10 p-2 rounded-full transition-all duration-200 cursor-pointer ${
            isWishlisted
              ? 'bg-black text-white opacity-100 shadow-sm'
              : 'bg-white/90 sm:bg-white/75 text-neutral-800 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-white hover:text-black shadow-xs'
          }`}
          title={isWishlisted ? t('Remove from Wishlist') : t('Add to Wishlist')}
          aria-label={t('Wishlist')}
        >
          <Heart
            size={14}
            strokeWidth={1.5}
            className={isWishlisted ? 'fill-white text-white' : ''}
          />
        </button>
      </div>

      {/* Product Information */}
      <div className="pt-3 pb-1 flex flex-col space-y-0.5 sm:space-y-1">
        {/* Brand */}
        <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.22em] font-medium text-neutral-400 truncate">
          {brand}
        </span>

        {/* Name */}
        <h3 className="text-xs sm:text-sm font-sans font-light text-neutral-900 tracking-normal line-clamp-1 group-hover:text-neutral-600 transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="pt-0.5 flex items-baseline justify-between">
          <span className="text-xs sm:text-sm font-sans font-medium text-neutral-900 tracking-wide">
            ${product.retailPrice.toLocaleString()}
          </span>

          {product.volume && (
            <span className="text-[9px] sm:text-[10px] text-neutral-400 font-light truncate max-w-[80px]">
              {product.volume}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
