import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import fashionModelHeroImg from '../assets/images/dior_portrait_studio_couture_model_1789029662765.jpg';
import beautyModelHeroImg from '../assets/images/dior_lightbrown_beauty_diamonds_perfume_1788954970837.jpg';
import { HomepageSettings } from '../types';
import { useI18n } from '../i18n';
import { isVideoUrl } from '../lib/media';

export interface HeroCampaignProps {
  onNavigateFashion: () => void;
  onNavigateBeauty: () => void;
  onNavigateView?: (view: any) => void;
  settings?: HomepageSettings;
  hideBeauty?: boolean;
}

const getObjectPosition = (pos?: string, isFashion?: boolean) => {
  if (pos && pos !== 'object-center' && pos !== 'object-[50%_35%]') {
    const match = pos.match(/object-\[(.*)\]/);
    if (match && match[1]) {
      return match[1].replace(/_/g, ' ');
    }
    return pos.replace('object-', '');
  }
  return isFashion ? '50% 50%' : '50% 35%';
};

const getOverlayGradient = (opacity?: string) => {
  if (opacity === 'light') {
    return 'from-transparent via-black/5 to-black/30';
  }
  if (opacity === 'medium') {
    return 'from-black/10 via-black/15 to-black/45';
  }
  if (opacity === 'default') {
    return 'from-transparent via-black/10 to-black/50';
  }
  if (opacity === 'dark') {
    return 'from-black/30 via-black/45 to-black/75';
  }
  return 'from-transparent via-black/10 to-black/45';
};

const getImageStyle = (crop?: any, defaultPos?: string, isFashion?: boolean, isActive?: boolean): React.CSSProperties => {
  const baseZoom = (crop?.zoom && crop.zoom > 0) ? Number(crop.zoom) : 1;
  const currentScale = isActive ? baseZoom * 1.04 : baseZoom;
  const focalX = crop?.focalX ?? 50;
  const focalY = crop?.focalY ?? 20;

  if (crop) {
    return {
      objectPosition: `${focalX}% ${focalY}%`,
      objectFit: 'cover',
      transform: `scale(${currentScale})`,
      transformOrigin: `${focalX}% ${focalY}%`,
      width: '100%',
      height: '100%'
    };
  }
  return {
    objectPosition: getObjectPosition(defaultPos, isFashion),
    objectFit: 'cover',
    transform: `scale(${currentScale})`,
    transformOrigin: '50% 25%',
    width: '100%',
    height: '100%'
  };
};

interface InteractiveHeroSlideProps {
  id: string;
  primaryImage: string;
  slideImages?: string[];
  autoSlide?: boolean;
  slideInterval?: number;
  crop?: any;
  imagePosition?: string;
  overlayOpacity?: string;
  isFashion?: boolean;
  title?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
  titleElement?: 'h1' | 'h2' | 'h3';
  fetchPriority?: 'high' | 'low' | 'auto';
  idAttr?: string;
}

export const InteractiveHeroSlide: React.FC<InteractiveHeroSlideProps> = ({
  id,
  primaryImage,
  slideImages = [],
  autoSlide = true,
  slideInterval = 5,
  crop,
  imagePosition,
  overlayOpacity,
  isFashion,
  title,
  ctaText,
  onCtaClick,
  className = '',
  titleElement = 'h3',
  fetchPriority,
  idAttr
}) => {
  const { t } = useI18n();
  const fallbackHeroImage = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200';
  // Combine primary image and additional slide images ensuring no empty strings
  const allSlides = React.useMemo(() => {
    const validPrimary = (primaryImage && typeof primaryImage === 'string' && primaryImage.trim() !== '') ? primaryImage.trim() : fallbackHeroImage;
    const list = [validPrimary, ...(slideImages || [])].filter((img): img is string => typeof img === 'string' && img.trim() !== '');
    if (list.length === 0) {
      list.push(fallbackHeroImage);
    }
    return Array.from(new Set(list));
  }, [primaryImage, slideImages]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAutoSlide] = useState(autoSlide !== false);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  // Smooth Dior progress timeline & auto-transition with optimized frame interval
  useEffect(() => {
    if (!isAutoSlide || allSlides.length <= 1 || isHovered) return;
    const durationMs = Math.max(3, slideInterval || 5) * 1000;
    const tickMs = 200;
    const step = (tickMs / durationMs) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((c) => (c + 1) % allSlides.length);
          return 0;
        }
        return prev + step;
      });
    }, tickMs);

    return () => clearInterval(timer);
  }, [isAutoSlide, allSlides.length, slideInterval, isHovered]);

  // Reset progress when slide changes manually or automatically
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % allSlides.length);
    setProgress(0);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + allSlides.length) % allSlides.length);
    setProgress(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || e.changedTouches.length === 0) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
  };

  const hasMultipleSlides = allSlides.length > 1;

  return (
    <section
      id={idAttr}
      className={`relative w-full overflow-hidden group select-none flex flex-col justify-end text-white ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Images with Haute Couture Ken Burns Dissolve */}
      <div className="absolute inset-0 overflow-hidden bg-black">
        {allSlides.map((imgUrl, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={`${imgUrl}-${idx}`}
              className={`absolute inset-0 w-full h-full transition-opacity duration-[1600ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
                isActive ? 'opacity-100 z-0' : 'opacity-0 z-[-1] pointer-events-none'
              }`}
            >
              {isVideoUrl(imgUrl) ? (
                <video
                  src={imgUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={false}
                  style={getImageStyle(crop, imagePosition, isFashion, isActive)}
                  className="w-full h-full object-cover transition-transform duration-[8000ms] ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
                />
              ) : (
                <img
                  src={imgUrl}
                  alt={`${title || 'Campaign'} slide ${idx + 1}`}
                  style={getImageStyle(crop, imagePosition, isFashion, isActive)}
                  className="w-full h-full object-cover transition-transform duration-[8000ms] ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
                  fetchPriority={idx === 0 && fetchPriority === 'high' ? 'high' : 'auto'}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          );
        })}
        <div className={`absolute inset-0 bg-gradient-to-b ${getOverlayGradient(overlayOpacity)} z-[1] pointer-events-none`} />
      </div>



      {/* Haute Couture Editorial Content: Dior Title & Signature Link */}
      <div className="relative z-10 w-full px-4 pb-14 sm:pb-16 text-center flex flex-col items-center">
        <motion.div
          key={`text-${title}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
          className="space-y-3.5 max-w-2xl"
        >
          {title && title.trim() !== '' && (
            titleElement === 'h1' ? (
              <h1 className="font-serif text-[28px] sm:text-[38px] md:text-[46px] font-normal text-white tracking-[0.06em] sm:tracking-[0.08em] uppercase drop-shadow-[0_2px_24px_rgba(0,0,0,0.65)]">
                {t(title)}
              </h1>
            ) : titleElement === 'h2' ? (
              <h2 className="font-serif text-[28px] sm:text-[38px] md:text-[46px] font-normal text-white tracking-[0.06em] sm:tracking-[0.08em] uppercase drop-shadow-[0_2px_24px_rgba(0,0,0,0.65)]">
                {t(title)}
              </h2>
            ) : (
              <h3 className="font-serif text-3xl sm:text-4xl md:text-[42px] font-normal text-white tracking-[0.06em] sm:tracking-[0.08em] uppercase drop-shadow-[0_2px_24px_rgba(0,0,0,0.65)]">
                {t(title)}
              </h3>
            )
          )}

          {ctaText && (
            <div>
              <button
                type="button"
                onClick={onCtaClick}
                className="group/cta inline-flex items-center gap-2 text-[11px] sm:text-[12px] uppercase tracking-[0.28em] sm:tracking-[0.32em] text-white font-light transition-all duration-300 cursor-pointer drop-shadow-md py-1"
              >
                <span className="relative pb-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white/80 group-hover/cta:after:bg-white group-hover/cta:after:h-[1.5px] group-hover/cta:tracking-[0.38em] transition-all duration-500">
                  {t(ctaText)}
                </span>
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dior Minimalist Segmented Progress Line */}
      {hasMultipleSlides && (
        <div 
          className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 w-auto px-2 py-1 select-none pointer-events-auto"
          aria-label="Slide progress"
        >
          {allSlides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
                setProgress(0);
              }}
              className="group/seg relative h-4 flex items-center cursor-pointer px-0.5"
              aria-label={`Slide ${idx + 1}`}
            >
              <div className="w-8 sm:w-11 h-[1.5px] bg-white/30 group-hover/seg:bg-white/60 transition-colors rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{
                    width: idx === currentIndex
                      ? `${progress}%`
                      : idx < currentIndex ? '100%' : '0%',
                    transition: idx === currentIndex ? 'width 200ms linear' : 'none'
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export const HeroCampaign: React.FC<HeroCampaignProps> = ({
  onNavigateFashion,
  onNavigateBeauty,
  onNavigateView,
  settings,
  hideBeauty
}) => {
  const { t } = useI18n();

  const defaultFashionModelImg = fashionModelHeroImg;
  const defaultBeautyModelImg = beautyModelHeroImg;

  const rawFashionMedia = settings?.heroFashionVideo || settings?.heroFashionImage;
  const fashionImg = rawFashionMedia && rawFashionMedia.trim() ? rawFashionMedia.trim() : defaultFashionModelImg;
  const fashionTitle = (settings?.heroFashionTitle && settings.heroFashionTitle.trim()) 
    ? t(settings.heroFashionTitle) 
    : t('Fashion & Accessories');
  const fashionCta = settings?.heroFashionCta ? t(settings.heroFashionCta) : t('Discover Collection');

  const rawBeautyMedia = settings?.heroBeautyVideo || settings?.heroBeautyImage;
  const beautyImg = rawBeautyMedia && rawBeautyMedia.trim() ? rawBeautyMedia.trim() : defaultBeautyModelImg;
  const beautyTitle = (settings?.heroBeautyTitle && settings.heroBeautyTitle.trim())
    ? t(settings.heroBeautyTitle) 
    : t('Fragrance & Beauty');
  const beautyCta = settings?.heroBeautyCta ? t(settings.heroBeautyCta) : t('Discover Perfumes');

  const extraBanners = (settings?.additionalBanners || []).filter(b => b.active);

  const handleCtaClick = (linkView?: string, fallbackFn?: () => void) => {
    if (linkView && onNavigateView) {
      onNavigateView(linkView);
    } else if (fallbackFn) {
      fallbackFn();
    }
  };

  const showFashion = settings?.heroFashionActive !== false;
  const showBeauty = !hideBeauty && (settings?.heroBeautyActive !== false);
  const showDualHero = showFashion || showBeauty;

  return (
    <div className="w-full flex flex-col font-sans select-none">
      {/* 1. PRIMARY HOMEPAGE DUAL HERO */}
      {showDualHero && (
        <div className="w-full h-[100svh] flex flex-col md:flex-row">
          {/* 1. FIRST HERO: FASHION & ACCESSORIES */}
          {showFashion && (
            <InteractiveHeroSlide
              id="hero-fashion"
              idAttr="hero-fashion-section"
              primaryImage={fashionImg}
              slideImages={settings?.heroFashionSlideImages}
              autoSlide={settings?.heroFashionAutoSlide}
              slideInterval={settings?.heroFashionSlideInterval}
              crop={settings?.heroFashionCrop}
              imagePosition={settings?.heroFashionImagePosition}
              overlayOpacity={settings?.heroFashionOverlayOpacity}
              isFashion={true}
              title={fashionTitle}
              ctaText={fashionCta}
              onCtaClick={onNavigateFashion}
              className={showBeauty ? 'h-1/2 md:h-full md:w-1/2' : 'h-full w-full'}
              titleElement="h1"
              fetchPriority="high"
            />
          )}

          {/* 2. SECOND HERO: BEAUTY & BODYCARE */}
          {showBeauty && (
            <InteractiveHeroSlide
              id="hero-beauty"
              idAttr="hero-beauty-section"
              primaryImage={beautyImg}
              slideImages={settings?.heroBeautySlideImages}
              autoSlide={settings?.heroBeautyAutoSlide}
              slideInterval={settings?.heroBeautySlideInterval}
              crop={settings?.heroBeautyCrop}
              imagePosition={settings?.heroBeautyImagePosition}
              overlayOpacity={settings?.heroBeautyOverlayOpacity}
              isFashion={false}
              title={beautyTitle}
              ctaText={beautyCta}
              onCtaClick={onNavigateBeauty}
              className={showFashion ? 'h-1/2 md:h-full md:w-1/2' : 'h-full w-full'}
              titleElement="h2"
            />
          )}
        </div>
      )}

      {/* 2. ADDITIONAL ADMIN-ADDED HOMEPAGE BANNERS (WITH SLIDE & AUTO-SLIDE SUPPORT) */}
      {(() => {
        const seenBannerIds = new Set<string>();
        const uniqueExtraBanners = extraBanners.filter(b => {
          if (!b.id) return true;
          if (seenBannerIds.has(b.id)) return false;
          seenBannerIds.add(b.id);
          return true;
        });

        if (uniqueExtraBanners.length === 0) return null;

        return (
          <div className={`w-full grid ${uniqueExtraBanners.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {uniqueExtraBanners.map((banner, index) => {
              const isLastOdd = uniqueExtraBanners.length % 2 !== 0 && index === uniqueExtraBanners.length - 1 && uniqueExtraBanners.length > 1;
              return (
                <InteractiveHeroSlide
                  key={`${banner.id}-${index}`}
                  id={banner.id}
                  primaryImage={banner.videoUrl || banner.image || fashionImg}
                  slideImages={banner.slideImages}
                  autoSlide={banner.autoSlide}
                  slideInterval={banner.slideInterval}
                  crop={banner.crop}
                  imagePosition={banner.imagePosition}
                  overlayOpacity={banner.overlayOpacity}
                  title={banner.title}
                  ctaText={banner.ctaText || 'Shop now'}
                  onCtaClick={() => handleCtaClick(banner.linkView, onNavigateFashion)}
                  className={`${isLastOdd ? 'md:col-span-2' : ''} h-[65svh] min-h-[460px] md:h-[80svh] md:min-h-[560px] lg:h-[85svh]`}
                  titleElement="h3"
                />
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};
