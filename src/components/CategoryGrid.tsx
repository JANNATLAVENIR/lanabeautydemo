import { ArrowRight } from 'lucide-react';

interface CategoryGridProps {
  onSelectCategory: (category: string) => void;
  onNavigateCatalog: () => void;
}

export function CategoryGrid({ onSelectCategory, onNavigateCatalog }: CategoryGridProps) {
  const categories = [
    {
      id: 'fashion',
      title: 'Fashion',
      subtitle: 'HAUTE COUTURE & LEATHER ICONS',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=85&w=1200',
      categoryKey: 'FASHION'
    },
    {
      id: 'beauty',
      title: 'Beauty',
      subtitle: 'PERFUMERY & VELVET PIGMENTS',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=85&w=1200',
      categoryKey: 'BEAUTY'
    },
    {
      id: 'bodycare',
      title: 'Bodycare',
      subtitle: 'SCENTED CREAMS & NOURISHING ELIXIRS',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=85&w=1200',
      categoryKey: 'BODYCARE'
    },
    {
      id: 'accessories',
      title: 'Accessories',
      subtitle: 'VANITY CASES & BESPOKE INSTRUMENTS',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=85&w=1200',
      categoryKey: 'ACCESSORIES'
    }
  ];

  const handleClick = (key: string) => {
    onSelectCategory(key);
    onNavigateCatalog();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="py-24 sm:py-32 bg-white border-b border-neutral-200">
      <div className="max-w-[1700px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Section Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.45em] font-sans font-semibold text-neutral-400 block">
              CURATED DEPARTMENTS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-light uppercase tracking-[0.05em] text-neutral-900">
              Shop by <span className="italic font-normal font-serif lowercase">Category</span>
            </h2>
          </div>

          <button
            onClick={() => {
              onSelectCategory('ALL');
              onNavigateCatalog();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="text-[10.5px] uppercase tracking-[0.25em] font-semibold text-neutral-900 hover:text-neutral-500 transition-colors flex items-center gap-2 group cursor-pointer"
          >
            <span>View All Collections</span>
            <ArrowRight size={13} className="group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* 4 Luxury Editorial Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleClick(cat.categoryKey)}
              className="group relative aspect-[3/4] overflow-hidden bg-neutral-100 cursor-pointer flex flex-col justify-end p-8 text-white transition-all duration-700"
              id={`category-tile-${cat.id}`}
            >
              {/* Campaign Image */}
              {cat.image && cat.image.trim() !== '' ? (
                <img
                  src={cat.image}
                  alt={cat.title}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-106"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 w-full h-full bg-neutral-800" />
              )}

              {/* Translucent Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 group-hover:via-black/25 transition-colors duration-500" />

              {/* Tile Content */}
              <div className="relative z-10 space-y-2 transform transition-transform duration-500 group-hover:-translate-y-1">
                <span className="text-[8.5px] uppercase tracking-[0.35em] text-neutral-300 font-sans font-medium block">
                  {cat.subtitle}
                </span>

                <h3 className="text-2xl sm:text-3xl font-serif font-light uppercase tracking-[0.08em] text-white">
                  {cat.title}
                </h3>

                <div className="pt-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] font-medium text-white/90 group-hover:text-white transition-colors">
                  <span>Discover</span>
                  <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
