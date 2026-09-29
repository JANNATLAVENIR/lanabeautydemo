import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, ChevronDown, X, RotateCcw, Check, ArrowRight } from 'lucide-react';
import { Product, HomepageSettings } from '../types';
import { ProductCard } from './ProductCard';
import { useI18n } from '../i18n';

const FASHION_CATEGORIES = [
  'FASHION',
  'BAGS',
  'SHOES',
  'ACCESSORIES',
  'CLOTHING',
  'HAUTE COUTURE',
  'LEATHER CRAFT',
  'MEN',
  "MEN'S DRESS",
  'MEN DRESS',
  'SHIRT',
  'SHIRTS',
  'JEANS',
  'DENIM',
  'WATCHES',
  'WATCH'
];

const BEAUTY_CATEGORIES = [
  'BEAUTY',
  'FRAGRANCE',
  'PERFUME',
  'MAKEUP',
  'SKINCARE',
  'BODY CARE',
  'BODYCARE',
  'DEODORANT',
  'HAIRCARE',
  'HAUTE PARFUMERIE',
  'BEAUTY MASTERCLASS',
  'COSMETICS'
];

interface PLPViewProps {
  products?: Product[];
  allProducts?: Product[];
  selectedCategory?: string;
  initialCategory?: string;
  initialDepartment?: string;
  customDepartment?: string;
  homepageSettings?: HomepageSettings;
  categories?: any[];
  wishlistIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onSelectCategory?: (category: string) => void;
  searchQuery?: string;
  initialSearchQuery?: string;
  subCategoryFilter?: string;
  brandFilter?: string;
  genderFilter?: string;
  onNavigateHome?: () => void;
}

export const PLPView: React.FC<PLPViewProps> = ({
  products = [],
  allProducts = [],
  selectedCategory = 'ALL',
  initialCategory,
  initialDepartment,
  customDepartment,
  homepageSettings,
  categories = [],
  wishlistIds = [],
  onToggleWishlist = () => {},
  onAddToCart = () => {},
  onViewDetails = () => {},
  onQuickView,
  onSelectCategory,
  searchQuery = '',
  initialSearchQuery = '',
  subCategoryFilter,
  brandFilter,
  genderFilter,
  onNavigateHome = () => {}
}) => {
  const { t, localizeCategory } = useI18n();
  const productsList = (allProducts && allProducts.length > 0) ? allProducts : (products || []);

  // Track parent department context (FASHION vs BEAUTY vs ALL)
  const departmentContext = useMemo(() => {
    const custom = (customDepartment || initialDepartment || '').toUpperCase();
    if (custom.includes('FASHION') || custom.includes('COUTURE') || custom.includes('READY')) return 'FASHION';
    if (custom.includes('BEAUTY') || custom.includes('FRAGRANCE') || custom.includes('PERFUME')) return 'BEAUTY';
    if (custom.includes('BODYCARE') || custom.includes('BODY CARE')) return 'BODYCARE';
    if (custom.includes('ACCESSORIES') || custom.includes('JEWELRY')) return 'ACCESSORIES';

    const sel = (selectedCategory || initialCategory || 'ALL').toUpperCase();
    if (FASHION_CATEGORIES.some(c => sel === c || sel.includes(c) || c.includes(sel))) return 'FASHION';
    if (BEAUTY_CATEGORIES.some(c => sel === c || sel.includes(c) || c.includes(sel))) return 'BEAUTY';
    return 'ALL';
  }, [selectedCategory, initialCategory, initialDepartment, customDepartment]);

  // Resolve custom department name (created dynamically by admin)
  const customDeptName = useMemo(() => {
    if (customDepartment && customDepartment !== 'ALL' && customDepartment !== 'FASHION' && customDepartment !== 'BEAUTY') {
      return customDepartment;
    }
    if (initialDepartment && initialDepartment !== 'ALL' && initialDepartment !== 'FASHION' && initialDepartment !== 'BEAUTY' && initialDepartment !== 'BODYCARE' && initialDepartment !== 'ACCESSORIES') {
      return initialDepartment;
    }
    
    // Check if searchQuery or activeSearch corresponds to an additional custom banner in homepageSettings
    const query = (initialSearchQuery || searchQuery || '').trim().toLowerCase();
    if (query && homepageSettings?.additionalBanners) {
      const match = homepageSettings.additionalBanners.find(b => {
        const titleLower = (b.title || '').toLowerCase();
        const slug = (b.linkView || '').toLowerCase();
        const idClean = (b.id || '').replace('dept-banner-', '').toLowerCase();
        return titleLower === query || slug === query || idClean === query || (titleLower && (query.includes(titleLower) || titleLower.includes(query)));
      });
      if (match && match.title) {
        return match.title;
      }
    }
    
    // Check if category list contains a matching department
    if (query && categories && categories.length > 0) {
      const matchedCatDept = categories.find(c => (c.department || '').toLowerCase() === query || (c.name || '').toLowerCase() === query);
      if (matchedCatDept && matchedCatDept.department && !['Fashion', 'Beauty', 'Accessories'].includes(matchedCatDept.department)) {
        return matchedCatDept.department;
      }
    }

    return null;
  }, [customDepartment, initialDepartment, initialSearchQuery, searchQuery, homepageSettings, categories]);

  // Combined effective department for breadcrumb and editorial placement
  const effectiveDepartment = useMemo(() => {
    if (departmentContext === 'FASHION') return 'FASHION';
    if (departmentContext === 'BEAUTY') return 'BEAUTY';
    if (departmentContext === 'BODYCARE') return 'BODYCARE';
    if (departmentContext === 'ACCESSORIES') return 'ACCESSORIES';
    if (customDeptName) return customDeptName;
    return null;
  }, [departmentContext, customDeptName]);

  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (initialCategory && initialCategory !== 'FASHION' && initialCategory !== 'BEAUTY' && initialCategory !== 'BODYCARE' && initialCategory !== 'ACCESSORIES') {
      return initialCategory;
    }
    if (selectedCategory && selectedCategory !== 'ALL' && selectedCategory !== 'FASHION' && selectedCategory !== 'BEAUTY' && selectedCategory !== 'BODYCARE' && selectedCategory !== 'ACCESSORIES') {
      return selectedCategory;
    }
    return 'ALL';
  });

  useEffect(() => {
    if (selectedCategory) {
      if (selectedCategory === 'FASHION' || selectedCategory === 'BEAUTY' || selectedCategory === 'BODYCARE' || selectedCategory === 'ACCESSORIES' || selectedCategory === 'ALL') {
        setActiveCategory('ALL');
      } else {
        setActiveCategory(selectedCategory);
      }
    }
  }, [selectedCategory, customDepartment, initialDepartment]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>(brandFilter || 'ALL');
  const [selectedGender, setSelectedGender] = useState<string>(genderFilter || 'ALL');
  const [priceRange, setPriceRange] = useState<number>(10000);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest' | 'rating'>('featured');

  useEffect(() => {
    if (brandFilter) {
      setSelectedBrand(brandFilter);
    } else {
      setSelectedBrand('ALL');
    }
  }, [brandFilter, selectedCategory, customDepartment]);

  const activeSearch = initialSearchQuery || searchQuery;

  // Dynamic Sub-Category Pills strictly isolated per Department
  const availablePills = useMemo(() => {
    // 1. If inside a custom department (created dynamically by admin)
    if (customDeptName && !['ALL', 'FASHION', 'BEAUTY', 'BODYCARE', 'ACCESSORIES'].includes(customDeptName.toUpperCase())) {
      const targetDept = customDeptName.trim().toLowerCase();

      // Find categories assigned to this department from categories list
      const matchedCats = (categories || [])
        .filter(c => (c.department || '').trim().toLowerCase() === targetDept || (c.name || '').trim().toLowerCase() === targetDept)
        .map(c => c.name.toUpperCase());

      // Find categories from products that belong to this department
      const matchedProdCats = (productsList || [])
        .filter(p => (p.department || '').trim().toLowerCase() === targetDept)
        .map(p => (p.category || '').toUpperCase());

      const subPills = Array.from(new Set([...matchedCats, ...matchedProdCats])).filter(Boolean);
      
      if (subPills.length > 0) {
        return ['ALL', ...subPills];
      }
      return ['ALL'];
    }

    // 2. Strict isolation for Bodycare
    if (departmentContext === 'BODYCARE' || initialDepartment === 'BODYCARE') {
      const bodycareCats = (categories || [])
        .filter(c => (c.department || '').toUpperCase() === 'BODYCARE' || (c.department || '').toUpperCase() === 'BODY CARE')
        .map(c => c.name.toUpperCase());
      return Array.from(new Set(['ALL', 'BODYCARE', 'DEODORANT', 'HAIRCARE', ...bodycareCats]));
    }

    // 3. Strict isolation for Accessories
    if (departmentContext === 'ACCESSORIES' || initialDepartment === 'ACCESSORIES') {
      const accCats = (categories || [])
        .filter(c => (c.department || '').toUpperCase() === 'ACCESSORIES')
        .map(c => c.name.toUpperCase());
      return Array.from(new Set(['ALL', 'BAGS', 'ACCESSORIES', 'WATCHES', 'SHOES', ...accCats]));
    }

    // 4. Men's Dress specific context
    if (activeCategory === 'MEN' || activeCategory === "MEN'S DRESS" || activeCategory === 'SHIRT' || activeCategory === 'JEANS' || activeCategory === 'WATCHES' || selectedGender === 'Men' || selectedGender === 'MEN') {
      return ['ALL', 'SHIRT', 'JEANS', 'SHOES', 'WATCHES', 'BAGS', 'ACCESSORIES'];
    }

    // 5. Strict isolation for Fashion
    if (departmentContext === 'FASHION') {
      const fashionCats = (categories || [])
        .filter(c => (c.department || '').toUpperCase() === 'FASHION')
        .map(c => c.name.toUpperCase());
      return Array.from(new Set(['ALL', "MEN'S DRESS", 'SHIRT', 'JEANS', 'SHOES', 'WATCHES', 'BAGS', 'ACCESSORIES', ...fashionCats]));
    }

    // 6. Strict isolation for Beauty
    if (departmentContext === 'BEAUTY') {
      const beautyCats = (categories || [])
        .filter(c => (c.department || '').toUpperCase() === 'BEAUTY')
        .map(c => c.name.toUpperCase());
      return Array.from(new Set(['ALL', 'FRAGRANCE', 'SKINCARE', 'MAKEUP', 'BODYCARE', 'HAIRCARE', 'DEODORANT', ...beautyCats]));
    }

    // 7. General catalog fallback (only when no department is active)
    return ['ALL', "MEN'S DRESS", 'SHIRT', 'JEANS', 'SHOES', 'WATCHES', 'FRAGRANCE', 'SKINCARE', 'MAKEUP', 'BAGS', 'BODYCARE', 'ACCESSORIES'];
  }, [departmentContext, initialDepartment, customDeptName, categories, productsList, activeCategory, selectedGender]);

  // Available brands list strictly isolated by department context
  const brands = useMemo(() => {
    const list = new Set<string>();
    if (Array.isArray(productsList)) {
      productsList.forEach((p) => {
        if (!p || !p.brand) return;
        const prodCat = (p.category || '').toUpperCase();
        const prodDept = (p.department || '').toUpperCase();

        if (customDeptName && !['ALL', 'FASHION', 'BEAUTY', 'BODYCARE', 'ACCESSORIES'].includes(customDeptName.toUpperCase())) {
          const targetDept = customDeptName.trim().toLowerCase();
          const pDept = (p.department || '').trim().toLowerCase();
          const pCat = (p.category || '').trim().toLowerCase();
          const matchesDept = pDept === targetDept || pDept.includes(targetDept) || targetDept.includes(pDept);
          const catObj = (categories || []).find(c => (c.name || '').trim().toLowerCase() === pCat || (c.id || '').trim().toLowerCase() === pCat);
          const catDeptMatches = catObj && ((catObj.department || '').trim().toLowerCase() === targetDept || (catObj.department || '').trim().toLowerCase().includes(targetDept));
          if (!matchesDept && !catDeptMatches) return;
        } else if (departmentContext === 'FASHION') {
          const isBeautyExclusive = (prodDept.includes('BEAUTY') || prodDept.includes('FRAGRANCE')) && BEAUTY_CATEGORIES.includes(prodCat);
          if (isBeautyExclusive) return;
          const isFashion = prodDept.includes('FASHION') || prodDept.includes('COUTURE') || prodDept.includes('ACCESSORIES') || FASHION_CATEGORIES.includes(prodCat) || prodCat.includes('BAG') || prodCat.includes('SHOE') || prodCat.includes('DRESS');
          if (!isFashion) return;
        } else if (departmentContext === 'BEAUTY') {
          const isFashionExclusive = (prodDept.includes('FASHION') || prodDept.includes('COUTURE')) && FASHION_CATEGORIES.includes(prodCat);
          if (isFashionExclusive) return;
          const isBeauty = prodDept.includes('BEAUTY') || prodDept.includes('FRAGRANCE') || prodDept.includes('SKINCARE') || prodDept.includes('BODYCARE') || BEAUTY_CATEGORIES.includes(prodCat) || prodCat.includes('PERFUME') || prodCat.includes('PARFUM') || prodCat.includes('OUD');
          if (!isBeauty) return;
        } else if (departmentContext === 'BODYCARE' || initialDepartment === 'BODYCARE') {
          if (!['BODYCARE', 'BODY CARE', 'DEODORANT', 'HAIRCARE'].includes(prodCat) && !prodDept.includes('BODYCARE')) return;
        } else if (departmentContext === 'ACCESSORIES' || initialDepartment === 'ACCESSORIES') {
          if (!['ACCESSORIES', 'BAGS', 'WATCHES', 'SHOES'].includes(prodCat) && !prodDept.includes('ACCESSORIES')) return;
        }
        list.add(p.brand);
      });
    }
    return Array.from(list);
  }, [productsList, departmentContext, initialDepartment, customDeptName, categories]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(productsList)) return [];

    return productsList
      .filter((product) => {
        if (!product) return false;
        const prodCat = (product.category || '').toUpperCase();
        const prodSub = (product.subCategory || '').toUpperCase();
        const prodDept = (product.department || '').toUpperCase();
        const prodName = (product.name || '').toLowerCase();
        const prodDesc = (product.description || '').toLowerCase();

        // 0. Exclude any children/kids items ("dhar caruurna ka ilaali")
        const isChildItem =
          prodName.includes('child') ||
          prodName.includes('kid') ||
          prodName.includes('baby') ||
          prodName.includes('infant') ||
          prodName.includes('toddler') ||
          prodDesc.includes('children') ||
          prodDesc.includes('infant');
        if (isChildItem) return false;

        // 1. Strict Department Context Isolation
        if (customDeptName && !['ALL', 'FASHION', 'BEAUTY', 'BODYCARE', 'ACCESSORIES'].includes(customDeptName.toUpperCase())) {
          const targetDept = customDeptName.trim().toLowerCase();
          const pDept = (product.department || '').trim().toLowerCase();
          const pCat = (product.category || '').trim().toLowerCase();

          const matchesDept = pDept === targetDept || pDept.includes(targetDept) || targetDept.includes(pDept);
          const catObj = (categories || []).find(c => (c.name || '').trim().toLowerCase() === pCat || (c.id || '').trim().toLowerCase() === pCat);
          const catDeptMatches = catObj && ((catObj.department || '').trim().toLowerCase() === targetDept || (catObj.department || '').trim().toLowerCase().includes(targetDept));

          if (!matchesDept && !catDeptMatches) {
            return false;
          }
        }
        // In Fashion domain, NEVER show Skincare, Makeup, Fragrance unless department says Fashion
        else if (departmentContext === 'FASHION') {
          const isBeautyExclusive = (prodDept.includes('BEAUTY') || prodDept.includes('FRAGRANCE')) && (BEAUTY_CATEGORIES.includes(prodCat) || prodCat.includes('PARFUM'));
          if (isBeautyExclusive) {
            return false;
          }
          const isFashion = prodDept.includes('FASHION') || prodDept.includes('COUTURE') || prodDept.includes('ACCESSORIES') || FASHION_CATEGORIES.includes(prodCat) || prodCat.includes('BAG') || prodCat.includes('SHOE') || prodCat.includes('DRESS') || prodCat.includes('CLOTH');
          if (!isFashion) {
            return false;
          }
        } 
        // In Beauty domain, NEVER show Dresses, Couture, Men's dress, Bags, Shoes unless department says Beauty
        else if (departmentContext === 'BEAUTY') {
          const isFashionExclusive = (prodDept.includes('FASHION') || prodDept.includes('COUTURE')) && (FASHION_CATEGORIES.includes(prodCat) || prodCat.includes('BAG'));
          if (isFashionExclusive) {
            return false;
          }
          const isBeauty = prodDept.includes('BEAUTY') || prodDept.includes('FRAGRANCE') || prodDept.includes('SKINCARE') || prodDept.includes('BODYCARE') || BEAUTY_CATEGORIES.includes(prodCat) || prodCat.includes('PERFUME') || prodCat.includes('PARFUM') || prodCat.includes('OUD');
          if (!isBeauty) {
            return false;
          }
        }
        // In Bodycare department
        else if (departmentContext === 'BODYCARE' || initialDepartment === 'BODYCARE') {
          if (!['BODYCARE', 'BODY CARE', 'DEODORANT', 'HAIRCARE'].includes(prodCat) && !prodDept.includes('BODYCARE')) {
            return false;
          }
        }
        // In Accessories department
        else if (departmentContext === 'ACCESSORIES' || initialDepartment === 'ACCESSORIES') {
          if (!['ACCESSORIES', 'BAGS', 'WATCHES', 'SHOES'].includes(prodCat) && !prodDept.includes('ACCESSORIES')) {
            return false;
          }
        }

        // 2. Department filter (e.g. Bodycare, Accessories pages)
        if (initialDepartment) {
          const dept = initialDepartment.toUpperCase();
          if (dept === 'BODYCARE' && !['BODYCARE', 'BODY CARE', 'DEODORANT', 'HAIRCARE'].includes(prodCat) && prodDept !== 'BODYCARE') {
            return false;
          }
          if (dept === 'ACCESSORIES' && !['ACCESSORIES', 'BAGS', 'WATCHES', 'SHOES'].includes(prodCat) && prodDept !== 'ACCESSORIES') {
            return false;
          }
        }

        // 3. Sub-Category match with absolute mutual exclusivity
        if (activeCategory && activeCategory !== 'ALL') {
          const cat = activeCategory.toUpperCase();

          if (cat === 'SKINCARE') {
            // Strictly skincare only - no clothes, no perfumes, no makeup, no bags
            if (prodCat !== 'SKINCARE') return false;
          } else if (cat === 'MEN' || cat === "MEN'S DRESS" || cat === 'MEN DRESS') {
            const isMen = product.gender === 'Men' || prodCat === 'MEN' || prodCat === "MEN'S DRESS" || ['SHIRT', 'JEANS', 'SHOES', 'WATCHES'].includes(prodSub);
            if (!isMen) return false;
          } else if (cat === 'SHIRT' || cat === 'SHIRTS') {
            const isShirt = prodSub.includes('SHIRT') || prodCat.includes('SHIRT') || prodName.includes('shirt') || prodName.includes('jacquard');
            if (!isShirt) return false;
          } else if (cat === 'JEANS' || cat === 'DENIM') {
            const isJeans = prodSub.includes('JEAN') || prodSub.includes('DENIM') || prodCat.includes('JEAN') || prodName.includes('jean') || prodName.includes('denim');
            if (!isJeans) return false;
          } else if (cat === 'WATCHES' || cat === 'WATCH') {
            const isWatch = prodSub.includes('WATCH') || prodCat.includes('WATCH') || prodName.includes('watch') || prodName.includes('chronograph') || prodName.includes('chiffre');
            if (!isWatch) return false;
          } else if (cat === 'FASHION' || cat === 'CLOTHING' || cat === 'DRESSES') {
            // Strictly fashion apparel / couture - no skincare, no makeup, no fragrance
            if (!['FASHION', 'CLOTHING', 'HAUTE COUTURE', 'MEN', "MEN'S DRESS"].includes(prodCat)) return false;
          } else if (cat === 'BAGS') {
            if (!['BAGS', 'LEATHER CRAFT'].includes(prodCat)) return false;
          } else if (cat === 'SHOES') {
            if (!['SHOES', 'FOOTWEAR'].includes(prodCat) && !prodSub.includes('SHOE') && !prodSub.includes('SNEAKER') && !prodName.includes('sneaker') && !prodName.includes('loafer')) return false;
          } else if (cat === 'FRAGRANCE') {
            if (!['FRAGRANCE', 'PERFUME', 'HAUTE PARFUMERIE'].includes(prodCat)) return false;
          } else if (cat === 'MAKEUP') {
            if (!['MAKEUP', 'COSMETICS'].includes(prodCat)) return false;
          } else if (cat === 'BODYCARE') {
            if (!['BODY CARE', 'BODYCARE', 'DEODORANT', 'HAIRCARE'].includes(prodCat)) return false;
          } else if (cat === 'ACCESSORIES') {
            if (!['ACCESSORIES'].includes(prodCat)) return false;
          } else if (cat === 'BEAUTY') {
            if (!BEAUTY_CATEGORIES.includes(prodCat)) return false;
          } else {
            const catUpper = cat.toUpperCase();
            const matchesCat = prodCat === catUpper || 
                               prodSub.toUpperCase() === catUpper || 
                               prodSub.toUpperCase().includes(catUpper) ||
                               prodName.toUpperCase().includes(catUpper);
            if (!matchesCat) return false;
          }
        }

        // 4. Sub-category string match
        if (
          subCategoryFilter &&
          product.subCategory &&
          !product.subCategory.toLowerCase().includes(subCategoryFilter.toLowerCase())
        ) {
          return false;
        }

        // 5. Brand filter
        if (selectedBrand !== 'ALL') {
          const bSel = selectedBrand.trim().toLowerCase();
          const pBrand = (product.brand || '').trim().toLowerCase();
          const matchesBrand = pBrand === bSel ||
            (bSel.includes('hermes') && pBrand.includes('hermes')) ||
            (bSel.includes('hermès') && pBrand.includes('hermès')) ||
            (bSel.includes('dior') && pBrand.includes('dior')) ||
            (bSel.includes('chanel') && pBrand.includes('chanel')) ||
            (bSel.includes('saint laurent') && pBrand.includes('saint laurent')) ||
            (bSel.includes('bottega') && pBrand.includes('bottega')) ||
            (bSel.includes('la mer') && pBrand.includes('la mer')) ||
            (bSel.includes('augustinus') && pBrand.includes('augustinus')) ||
            (bSel.includes('guerlain') && pBrand.includes('guerlain'));
          if (!matchesBrand) {
            return false;
          }
        }

        // 6. Gender filter
        if (
          selectedGender !== 'ALL' &&
          product.gender &&
          product.gender.toUpperCase() !== selectedGender.toUpperCase()
        ) {
          return false;
        }

        // 7. Price limit
        if (product.retailPrice && product.retailPrice > priceRange) {
          return false;
        }

        // 8. Search query matching
        if (activeSearch.trim() && (!customDeptName || activeSearch.trim().toLowerCase() !== customDeptName.trim().toLowerCase())) {
          const q = activeSearch.toLowerCase().trim();
          const cleanQ = q.replace(/[^a-z0-9]/g, ' ');
          const words = cleanQ.split(/\s+/).filter((w) => w.length > 1);

          const matchDept = (product.department || '').toLowerCase().includes(q) || words.some((w) => (product.department || '').toLowerCase().includes(w));
          const matchCat = (product.category || '').toLowerCase().includes(q) || words.some((w) => (product.category || '').toLowerCase().includes(w));
          const matchName = (product.name || '').toLowerCase().includes(q) || words.some((w) => (product.name || '').toLowerCase().includes(w));
          const matchBrand = (product.brand || '').toLowerCase().includes(q);
          const matchDesc = (product.description || '').toLowerCase().includes(q);

          if (!matchDept && !matchCat && !matchName && !matchBrand && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.retailPrice || 0) - (b.retailPrice || 0);
        if (sortBy === 'price-desc') return (b.retailPrice || 0) - (a.retailPrice || 0);
        if (sortBy === 'rating') return (b.rating || 5) - (a.rating || 5);
        if (sortBy === 'newest') return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        return 0;
      });
  }, [
    productsList,
    departmentContext,
    initialDepartment,
    activeCategory,
    subCategoryFilter,
    selectedBrand,
    selectedGender,
    priceRange,
    activeSearch,
    sortBy
  ]);

  const activeFiltersCount =
    (activeCategory !== 'ALL' && activeCategory !== departmentContext ? 1 : 0) +
    (selectedBrand !== 'ALL' ? 1 : 0) +
    (selectedGender !== 'ALL' ? 1 : 0) +
    (priceRange < 10000 ? 1 : 0);

  const resetAllFilters = () => {
    setActiveCategory('ALL');
    setSelectedBrand('ALL');
    setSelectedGender('ALL');
    setPriceRange(10000);
  };

  const getCategoryTitle = () => {
    if (effectiveDepartment && effectiveDepartment !== 'FASHION' && effectiveDepartment !== 'BEAUTY') {
      if (activeCategory !== 'ALL' && activeCategory.toUpperCase() !== effectiveDepartment.toUpperCase()) {
        return `${t(effectiveDepartment)} / ${localizeCategory(activeCategory)}`;
      }
      return t(effectiveDepartment);
    }
    if (activeSearch && !effectiveDepartment) return `${t('Search')}: "${activeSearch}"`;
    if (departmentContext === 'FASHION') {
      if (activeCategory === 'ALL' || activeCategory === 'FASHION') return t('Fashion & Accessories');
      if (activeCategory === 'BAGS') return t('Bags');
      if (activeCategory === 'SHOES') return t('Shoes');
      if (activeCategory === 'ACCESSORIES') return t('Accessories');
      return `${t('Fashion')} / ${localizeCategory(activeCategory)}`;
    }
    if (departmentContext === 'BEAUTY') {
      if (activeCategory === 'ALL' || activeCategory === 'BEAUTY') return t('Fragrance & Beauty');
      if (activeCategory === 'FRAGRANCE') return t('Fragrance');
      if (activeCategory === 'SKINCARE') return t('Skincare');
      if (activeCategory === 'MAKEUP') return t('Makeup');
      if (activeCategory === 'BODYCARE') return t('Bodycare');
      return `${t('Beauty')} / ${localizeCategory(activeCategory)}`;
    }
    if (activeCategory === 'ALL') return t('Haute Selection');
    if (activeCategory === 'FASHION') return t('Fashion & Accessories');
    if (activeCategory === 'BEAUTY') return t('Fragrance & Beauty');
    if (activeCategory === 'FRAGRANCE') return t('Fragrance');
    if (activeCategory === 'SKINCARE') return t('Skincare');
    if (activeCategory === 'MAKEUP') return t('Makeup');
    if (activeCategory === 'BODYCARE') return t('Bodycare');
    if (activeCategory === 'BAGS') return t('Bags');
    if (activeCategory === 'SHOES') return t('Shoes');
    if (activeCategory === 'ACCESSORIES') return t('Accessories');
    return localizeCategory(activeCategory);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pt-20 sm:pt-28 pb-24">
      {/* 1. TOP BREADCRUMB */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-12 py-3 border-b border-neutral-100">
        <nav className="flex items-center gap-2 text-[9.5px] uppercase tracking-[0.25em] text-neutral-400">
          <button onClick={onNavigateHome} className="hover:text-black cursor-pointer">
            {t('Home')}
          </button>
          <span>/</span>
          <button
            onClick={() => {
              setActiveCategory('ALL');
              if (onSelectCategory) onSelectCategory('ALL');
            }}
            className="hover:text-black cursor-pointer"
          >
            {t('Collections')}
          </button>
          {effectiveDepartment && (
            <>
              <span>/</span>
              <span className="text-neutral-900 font-semibold">
                {effectiveDepartment === 'FASHION'
                  ? t('Fashion & Accessories')
                  : effectiveDepartment === 'BEAUTY'
                  ? t('Fragrance & Beauty')
                  : t(effectiveDepartment)}
              </span>
            </>
          )}
          {activeCategory !== 'ALL' && 
           activeCategory !== departmentContext && 
           activeCategory.toUpperCase() !== (effectiveDepartment || '').toUpperCase() && (
            <>
              <span>/</span>
              <span className="text-neutral-900 font-semibold">{localizeCategory(activeCategory)}</span>
            </>
          )}
        </nav>
      </div>

      {/* 2. CATEGORY EDITORIAL HEADER */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-12 pt-8 pb-6 sm:pt-12 sm:pb-10">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="font-serif text-3xl sm:text-5xl font-light tracking-[0.04em] text-neutral-900 uppercase">
            {getCategoryTitle()}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 font-light leading-relaxed">
            {departmentContext === 'BEAUTY'
              ? t('Rare floral absolutes from Grasse, precious Oriental resins, haute skincare elixirs, and bespoke makeup signatures.')
              : departmentContext === 'FASHION'
              ? t('Architectural evening gowns, tailored silk garments, handcrafted leather bags, and fine jewelry designed in Paris and Milan.')
              : customDeptName
              ? t(`Exclusive curated ${customDeptName} creations engineered with uncompromising luxury and savoir-faire.`)
              : t('Discover curated creations engineered with pristine savoir-faire, rare ingredients, and uncompromising luxury.')}
          </p>
          <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-neutral-400 block pt-1">
            {filteredProducts.length} {filteredProducts.length === 1 ? t('Creation', 'Creation') : t('Creations', 'Creations')}
          </span>
        </div>
      </div>

      {/* 3. MOBILE FILTER & SORT BAR (STICKY) */}
      <div className="sticky top-14 sm:top-16 lg:top-20 z-30 bg-white sm:bg-white/95 sm:backdrop-blur-md border-y border-neutral-200/80 py-3 px-4 sm:px-12">
        <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
          {/* Filter Button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 py-2 px-4 border border-neutral-200 hover:border-black text-xs uppercase tracking-[0.2em] font-semibold text-neutral-900 transition-colors cursor-pointer"
            id="plp-filter-btn"
          >
            <SlidersHorizontal size={14} />
            <span>{t('Filter')}</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 bg-black text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Quick Categories Pills (Desktop & Tablet) */}
          <div className="hidden lg:flex items-center gap-2 overflow-x-auto scrollbar-none">
            {availablePills.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  if (onSelectCategory) onSelectCategory(cat);
                }}
                className={`py-1.5 px-3.5 text-[10.5px] uppercase tracking-[0.18em] font-medium transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200'
                }`}
              >
                {cat === 'ALL'
                  ? departmentContext === 'FASHION'
                    ? t('All') + ' ' + t('Fashion')
                    : departmentContext === 'BEAUTY'
                    ? t('All') + ' ' + t('Beauty')
                    : t('All')
                  : localizeCategory(cat)}
              </button>
            ))}
          </div>

          {/* Sort Selector Button */}
          <button
            onClick={() => setIsSortOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 py-2 px-4 border border-neutral-200 hover:border-black text-xs uppercase tracking-[0.2em] font-semibold text-neutral-900 transition-colors cursor-pointer"
            id="plp-sort-btn"
          >
            <span>
              {t('Sort by')}: {sortBy === 'featured' ? t('Featured') : sortBy === 'price-asc' ? t('Price: Low to High') : sortBy === 'price-desc' ? t('Price: High to Low') : sortBy === 'newest' ? t('New Arrivals') : t('Featured')}
            </span>
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* 4. PRODUCT GRID (2 COLUMNS MOBILE / 3-4 DESKTOP) */}
      <div className="max-w-[1700px] mx-auto px-4 sm:px-12 py-8 sm:py-12">
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center space-y-4">
            <h3 className="font-serif text-2xl text-neutral-800">{t('No products found')}</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              {t('We could not find any items matching your search. Please try different keywords or filters.')}
            </p>
            <button
              onClick={resetAllFilters}
              className="px-6 py-2.5 bg-neutral-900 text-white text-xs uppercase tracking-[0.2em] font-medium cursor-pointer"
            >
              {t('Clear all')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
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
      </div>

      {/* 5. FILTER BOTTOM-SHEET / DRAWER MODAL */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
            onClick={() => setIsFilterOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-full max-w-[420px] h-full bg-white text-neutral-900 flex flex-col font-sans shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Filter Drawer Header */}
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} />
                  <h3 className="font-serif text-xl tracking-wider text-neutral-900">
                    {t('Filters')}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1.5 text-neutral-500 hover:text-black cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Filter Options Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Category Selection */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-neutral-400 block">
                    {t('Categories')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {availablePills.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setActiveCategory(cat);
                          if (onSelectCategory) onSelectCategory(cat);
                        }}
                        className={`py-2 px-3 text-xs uppercase tracking-wider font-medium border transition-colors cursor-pointer ${
                          activeCategory === cat
                            ? 'bg-neutral-950 text-white border-neutral-950'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {cat === 'ALL'
                          ? departmentContext === 'FASHION'
                            ? t('All') + ' ' + t('Fashion')
                            : departmentContext === 'BEAUTY'
                            ? t('All') + ' ' + t('Beauty')
                            : t('All')
                          : localizeCategory(cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand Selection */}
                {brands.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-neutral-400 block">
                      {t('Brand')}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedBrand('ALL')}
                        className={`py-2 px-3 text-xs uppercase tracking-wider font-medium border transition-colors cursor-pointer ${
                          selectedBrand === 'ALL'
                            ? 'bg-neutral-950 text-white border-neutral-950'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {t('All Brands')}
                      </button>
                      {brands.map((b) => (
                        <button
                          key={b}
                          onClick={() => setSelectedBrand(b)}
                          className={`py-2 px-3 text-xs uppercase tracking-wider font-medium border transition-colors cursor-pointer ${
                            selectedBrand === b
                              ? 'bg-neutral-950 text-white border-neutral-950'
                              : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gender Refinement */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-neutral-400 block">
                    {t('Gender', 'Gender')}
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {['ALL', 'Women', 'Men', 'Unisex'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGender(g)}
                        className={`py-2 text-center text-xs uppercase tracking-wider font-medium border transition-colors cursor-pointer ${
                          selectedGender === g
                            ? 'bg-neutral-950 text-white border-neutral-950'
                            : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                        }`}
                      >
                        {g === 'ALL' ? t('All') : g === 'Women' ? t('Women') : g === 'Men' ? t('Men') : t('Unisex')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Limit Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-neutral-400">
                      {t('Price Range')}
                    </span>
                    <span className="text-xs font-semibold text-neutral-900">
                      ${priceRange.toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={10000}
                    step={50}
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-black cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>$50</span>
                    <span>$10,000+</span>
                  </div>
                </div>
              </div>

              {/* Filter Bottom Action Bar */}
              <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center gap-3">
                <button
                  onClick={resetAllFilters}
                  className="flex items-center justify-center gap-1.5 py-3 px-4 border border-neutral-300 text-xs uppercase tracking-wider font-semibold text-neutral-700 hover:text-black hover:border-black transition-colors cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>{t('Reset')}</span>
                </button>

                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3 bg-neutral-950 text-white text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-colors cursor-pointer text-center"
                >
                  {t('Apply Filters')} ({filteredProducts.length})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. SORT BOTTOM-DRAWER MODAL */}
      <AnimatePresence>
        {isSortOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setIsSortOpen(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-w-md bg-white text-neutral-900 flex flex-col font-sans shadow-2xl rounded-t-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="font-serif text-lg tracking-wider text-neutral-900">
                  {t('Sort by')}
                </h3>
                <button onClick={() => setIsSortOpen(false)} className="p-1.5 text-neutral-500 hover:text-black cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 divide-y divide-neutral-100">
                {[
                  { key: 'featured', label: t('Featured') },
                  { key: 'newest', label: t('New Arrivals') },
                  { key: 'price-asc', label: t('Price: Low to High') },
                  { key: 'price-desc', label: t('Price: High to Low') },
                  { key: 'rating', label: t('Highest Rated') }
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setSortBy(s.key as any);
                      setIsSortOpen(false);
                    }}
                    className="w-full py-3.5 px-3 flex items-center justify-between text-left text-xs uppercase tracking-wider font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <span className={sortBy === s.key ? 'text-black font-bold' : 'text-neutral-600'}>
                      {s.label}
                    </span>
                    {sortBy === s.key && <Check size={16} className="text-black" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
