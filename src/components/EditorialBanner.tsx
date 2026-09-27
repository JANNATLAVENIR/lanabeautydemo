import coutureEditorialImg from '../assets/images/dior_portrait_studio_couture_model_1789029662765.jpg';

interface EditorialBannerProps {
  onDiscover: () => void;
}

export function EditorialBanner({ onDiscover }: EditorialBannerProps) {
  return (
    <section className="relative w-full py-36 sm:py-48 bg-neutral-950 overflow-hidden flex items-center justify-center text-center text-white">
      {/* Cinematic Editorial Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={coutureEditorialImg}
          alt="LANA The New Collection Editorial"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-70 scale-102 hover:scale-100 transition-transform duration-[4000ms] ease-out"
          loading="lazy"
        />
        {/* Subtle Dark Translucent Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950" />
      </div>

      {/* Editorial Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 space-y-6">
        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.5em] text-neutral-300 font-sans font-medium block">
          SUMMER &amp; AUTUMN COUTURE EDIT
        </span>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif font-light uppercase tracking-[0.08em] text-white leading-tight">
          THE NEW <br />
          <span className="italic font-normal font-serif lowercase text-neutral-200">collection</span>
        </h2>

        <p className="text-xs sm:text-sm md:text-base text-neutral-300 font-sans font-light max-w-xl mx-auto leading-relaxed tracking-wide">
          A timeless dialogue between Parisian haute perfumery and handcrafted leather accessories, celebrating understated elegance and contemporary silhouette.
        </p>

        <div className="pt-6">
          <button
            onClick={onDiscover}
            className="px-12 py-4.5 bg-white text-neutral-900 text-[11px] uppercase tracking-[0.28em] font-sans font-semibold hover:bg-neutral-200 transition-all duration-300 cursor-pointer shadow-xl hover:shadow-2xl"
          >
            Discover
          </button>
        </div>
      </div>
    </section>
  );
}
