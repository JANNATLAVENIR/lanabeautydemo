interface BrandSectionProps {
  onSelectBrand?: (brand: string) => void;
}

export function BrandSection({ onSelectBrand }: BrandSectionProps) {
  const brands = [
    { name: 'CHRISTIAN DIOR', origin: 'Paris, 1946' },
    { name: 'HERMÈS', origin: 'Paris, 1837' },
    { name: 'CHANEL', origin: 'Paris, 1910' },
    { name: 'SAINT LAURENT', origin: 'Paris, 1961' },
    { name: 'BOTTEGA VENETA', origin: 'Vicenza, 1966' },
    { name: 'LA MER', origin: 'New York, 1965' },
    { name: 'AUGUSTINUS BADER', origin: 'Leipzig, 2018' },
    { name: 'GUERLAIN', origin: 'Paris, 1828' }
  ];

  return (
    <section className="py-24 sm:py-32 bg-[#FAF9F6] border-b border-neutral-200">
      <div className="max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Editorial Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] uppercase tracking-[0.45em] font-sans font-semibold text-neutral-400 block">
            MAISON PARTNERS
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-light uppercase tracking-[0.06em] text-neutral-900">
            Selected <span className="italic font-normal font-serif lowercase">Houses</span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans font-light leading-relaxed">
            Authentic luxury brands and storied parfumeries, procured through certified regional boutiques and verified suppliers.
          </p>
        </div>

        {/* Minimal Luxury Brand Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 text-center items-center justify-center">
          {brands.map((b) => (
            <div
              key={b.name}
              onClick={() => onSelectBrand?.(b.name)}
              className="group cursor-pointer py-6 px-4 transition-all duration-300 hover:bg-white/80 rounded-xs"
            >
              <span className="block font-serif text-2xl sm:text-3xl md:text-3xl tracking-[0.22em] text-neutral-800 group-hover:text-black transition-colors">
                {b.name}
              </span>
              <span className="text-[8.5px] uppercase tracking-[0.3em] font-sans text-neutral-400 font-medium mt-1.5 block opacity-0 group-hover:opacity-100 transition-opacity">
                {b.origin}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
