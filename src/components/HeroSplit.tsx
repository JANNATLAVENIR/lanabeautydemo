import { useState } from 'react';
import { motion } from 'motion/react';
import { Pause, Play } from 'lucide-react';
import diorCampaignHeroImg from '../assets/images/dior_portrait_studio_couture_model_1789029662765.jpg';
import beautyHeroImg from '../assets/images/dior_lightbrown_beauty_diamonds_perfume_1788954970837.jpg';

interface HeroSplitProps {
  onSelectCategory: (category: string) => void;
  onNavigateCatalog: () => void;
}

export function HeroSplit({ onSelectCategory, onNavigateCatalog }: HeroSplitProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [leftHovered, setLeftHovered] = useState(false);
  const [rightHovered, setRightHovered] = useState(false);

  const handleLeftClick = () => {
    onSelectCategory('FASHION');
    onNavigateCatalog();
  };

  const handleRightClick = () => {
    onSelectCategory('BEAUTY');
    onNavigateCatalog();
  };

  return (
    <section className="relative w-full h-[100svh] min-h-[640px] max-h-[1200px] overflow-hidden bg-neutral-950 select-none">
      {/* 50 / 50 Split Grid Container */}
      <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 relative">
        
        {/* ================= LEFT PANEL: FASHION & ACCESSORIES ================= */}
        <div
          onClick={handleLeftClick}
          onMouseEnter={() => setLeftHovered(true)}
          onMouseLeave={() => setLeftHovered(false)}
          className="relative h-[50svh] md:h-full w-full overflow-hidden cursor-pointer group border-b md:border-b-0 md:border-r border-white/10"
          id="hero-panel-fashion"
        >
          {/* Background Image with Ken Burns / Hover Zoom */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={diorCampaignHeroImg}
              alt="LANA Haute Fashion & Accessories Campaign"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover object-center transition-transform duration-[1200ms] ease-out will-change-transform ${
                isPlaying ? (leftHovered ? 'scale-108' : 'scale-103') : (leftHovered ? 'scale-105' : 'scale-100')
              }`}
            />
          </div>

          {/* Translucent Dark Overlay */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              leftHovered ? 'bg-black/35' : 'bg-black/48'
            }`}
          />
          {/* Ambient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

          {/* Left Panel Typography / CTA */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 md:p-16 lg:p-20 z-10">
            <div
              className={`transform transition-transform duration-500 ease-out ${
                leftHovered ? '-translate-y-2' : 'translate-y-0'
              }`}
            >
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-neutral-300 font-sans font-medium block mb-2 sm:mb-3 drop-shadow-sm">
                CAMPAIGN I
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white uppercase tracking-[0.06em] font-light leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                Fashion &amp; <br className="hidden sm:inline" />
                <span className="italic font-normal font-serif lowercase text-neutral-200">Accessories</span>
              </h2>

              {/* Animated Underline CTA */}
              <div className="inline-flex items-center gap-2 mt-4 sm:mt-6 group/cta">
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.26em] text-white font-sans font-semibold">
                  Shop Now
                </span>
                <span
                  className={`block h-[1.5px] bg-white transition-all duration-400 ease-out ${
                    leftHovered ? 'w-12 sm:w-16' : 'w-6 sm:w-8'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANEL: BEAUTY & BODYCARE ================= */}
        <div
          onClick={handleRightClick}
          onMouseEnter={() => setRightHovered(true)}
          onMouseLeave={() => setRightHovered(false)}
          className="relative h-[50svh] md:h-full w-full overflow-hidden cursor-pointer group"
          id="hero-panel-beauty"
        >
          {/* Background Image with Ken Burns / Hover Zoom */}
          <div className="absolute inset-0 overflow-hidden">
            <img
              src={beautyHeroImg}
              alt="LANA Haute Fragrance & Beauty Campaign"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover object-center transition-transform duration-[1200ms] ease-out will-change-transform ${
                isPlaying ? (rightHovered ? 'scale-108' : 'scale-103') : (rightHovered ? 'scale-105' : 'scale-100')
              }`}
            />
          </div>

          {/* Translucent Dark Overlay */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              rightHovered ? 'bg-black/35' : 'bg-black/48'
            }`}
          />
          {/* Ambient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

          {/* Right Panel Typography / CTA */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 md:p-16 lg:p-20 z-10">
            <div
              className={`transform transition-transform duration-500 ease-out ${
                rightHovered ? '-translate-y-2' : 'translate-y-0'
              }`}
            >
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-neutral-300 font-sans font-medium block mb-2 sm:mb-3 drop-shadow-sm">
                CAMPAIGN II
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white uppercase tracking-[0.06em] font-light leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
                Fragrance &amp; <br className="hidden sm:inline" />
                <span className="italic font-normal font-serif lowercase text-neutral-200">Beauty</span>
              </h2>

              {/* Animated Underline CTA */}
              <div className="inline-flex items-center gap-2 mt-4 sm:mt-6 group/cta">
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.26em] text-white font-sans font-semibold">
                  Shop Now
                </span>
                <span
                  className={`block h-[1.5px] bg-white transition-all duration-400 ease-out ${
                    rightHovered ? 'w-12 sm:w-16' : 'w-6 sm:w-8'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ================= CENTER FLOATING BRANDING (LANA) ================= */}
      {/* Floating between the two 50% panels */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none text-center select-none w-full max-w-xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-light text-white tracking-[0.28em] uppercase leading-none drop-shadow-[0_4px_24px_rgba(0,0,0,0.7)]">
            LANA
          </h1>
          <p className="text-[9px] sm:text-[11px] md:text-xs font-sans uppercase tracking-[0.6em] text-white/85 font-medium mt-3 sm:mt-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            HAUTE COUTURE &amp; BEAUTÉ
          </p>
        </motion.div>
      </div>

      {/* ================= MINIMAL HERO CAMPAIGN CONTROL ================= */}
      <div className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10 z-20 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsPlaying(!isPlaying);
          }}
          className="p-2 text-white/50 hover:text-white transition-all duration-300 cursor-pointer rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-xs border border-white/10"
          title={isPlaying ? 'Pause Motion' : 'Play Motion'}
          aria-label="Toggle Hero Ambient Motion"
          id="hero-ambient-toggle"
        >
          {isPlaying ? <Pause size={13} strokeWidth={1.5} /> : <Play size={13} strokeWidth={1.5} />}
        </button>
      </div>
    </section>
  );
}
