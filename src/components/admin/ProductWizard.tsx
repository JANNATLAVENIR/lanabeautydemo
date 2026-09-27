import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Package, Layers, DollarSign, Store, Tag, Sparkles, Check, ArrowRight, ArrowLeft, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Product, Category, LocalStore } from '../../types';
import { MediaManager } from './MediaManager';

interface ProductWizardProps {
  categories: Category[];
  stores: LocalStore[];
  editingProduct: Product | null;
  onClose: () => void;
  onRefresh: () => void;
  adminToken: string;
}

export function ProductWizard({ categories, stores, editingProduct, onClose, onRefresh, adminToken }: ProductWizardProps) {
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Guided Form states
  const [prodName, setProdName] = useState('');
  const [prodBrand, setProdBrand] = useState('LANA');
  const [prodCategory, setProdCategory] = useState('Fragrance');
  const [prodDepartment, setProdDepartment] = useState<string>('Beauty');
  const [prodGender, setProdGender] = useState<'Women' | 'Men' | 'Unisex'>('Women');
  const [prodPrice, setProdPrice] = useState('250');
  const [prodImage, setProdImage] = useState('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600');
  const [prodDesc, setProdDesc] = useState('');
  const [prodVolume, setProdVolume] = useState('100ml');
  const [prodIsActive, setProdIsActive] = useState(true);

  // Departments list including any custom created departments
  const departmentList = useMemo(() => {
    const base = ['Fashion & Accessories', 'Fragrance & Beauty', 'Beauty', 'Fashion', 'Bodycare', 'Accessories', 'Fragrance'];
    const custom = (categories || [])
      .map(c => c.department)
      .filter((d): d is string => Boolean(d && !base.includes(d)));
    return Array.from(new Set([...base, ...custom]));
  }, [categories]);

  // Categories belonging to the selected department
  const departmentCategories = useMemo(() => {
    if (!prodDepartment) return categories;
    const deptLower = prodDepartment.toLowerCase();
    const matches = (categories || []).filter(c => (c.department || '').toLowerCase() === deptLower);
    if (matches.length > 0) return matches;
    
    // Smart fallbacks
    if (deptLower.includes('fashion')) {
      return [
        { id: 'cat-f-1', name: 'BAGS', department: 'Fashion & Accessories' },
        { id: 'cat-f-2', name: 'HANDBAGS', department: 'Fashion & Accessories' },
        { id: 'cat-f-3', name: 'SHOES', department: 'Fashion & Accessories' },
        { id: 'cat-f-4', name: 'ACCESSORIES', department: 'Fashion & Accessories' },
        { id: 'cat-f-5', name: 'READY-TO-WEAR', department: 'Fashion & Accessories' }
      ];
    }
    if (deptLower.includes('fragrance') || deptLower.includes('beauty')) {
      return [
        { id: 'cat-b-1', name: 'FRAGRANCE', department: 'Fragrance & Beauty' },
        { id: 'cat-b-2', name: 'MAKEUP', department: 'Fragrance & Beauty' },
        { id: 'cat-b-3', name: 'SKINCARE', department: 'Fragrance & Beauty' },
        { id: 'cat-b-4', name: 'BODYCARE', department: 'Fragrance & Beauty' },
        { id: 'cat-b-5', name: 'PARFUM', department: 'Fragrance & Beauty' }
      ];
    }
    return categories.length > 0 ? categories : [
      { id: 'cat-d-1', name: 'ALL', department: prodDepartment }
    ];
  }, [categories, prodDepartment]);

  // Special Marketing flags
  const [isNew, setIsNew] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);

  // Dark store cost values (ProductId -> cost mapping logic)
  const [storeCosts, setStoreCosts] = useState<Record<string, { wholesaleCost: number; stock: number }>>({});

  useEffect(() => {
    if (editingProduct) {
      setProdName(editingProduct.name);
      setProdBrand(editingProduct.brand || 'LANA');
      setProdCategory(editingProduct.category);
      setProdDepartment(editingProduct.department || 'Beauty');
      setProdGender(editingProduct.gender || 'Women');
      setProdPrice(String(editingProduct.retailPrice));
      setProdImage(editingProduct.image);
      setProdDesc(editingProduct.description || '');
      setProdVolume(editingProduct.volume || '100ml');
      setProdIsActive(editingProduct.isActive !== false);
      setIsNew(!!editingProduct.isNew);
      setIsFeatured(!!editingProduct.isFeatured);
      setIsBestSeller(!!editingProduct.isBestSeller);
      setIsExclusive(!!editingProduct.isExclusive);

      // Map existing store suppliers or fill with defaults
      const costsMap: Record<string, { wholesaleCost: number; stock: number }> = {};
      stores.forEach(st => {
        const matchingSupplier = editingProduct.supplierInventory?.find(inv => inv.storeId === st.id);
        costsMap[st.id] = {
          wholesaleCost: matchingSupplier?.wholesaleCost || Math.round(editingProduct.retailPrice * 0.55),
          stock: matchingSupplier?.stock !== undefined ? matchingSupplier.stock : 10
        };
      });
      setStoreCosts(costsMap);
    } else {
      setProdName('');
      setProdBrand('LANA');
      setProdCategory(categories[0]?.name || 'Fragrance');
      setProdDepartment('Beauty');
      setProdGender('Women');
      setProdPrice('250');
      setProdImage('https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=600');
      setProdDesc('');
      setProdVolume('100ml');
      setProdIsActive(true);
      setIsNew(false);
      setIsFeatured(false);
      setIsBestSeller(false);
      setIsExclusive(false);

      // Default cost structure for new products
      const costsMap: Record<string, { wholesaleCost: number; stock: number }> = {};
      stores.forEach(st => {
        costsMap[st.id] = {
          wholesaleCost: Math.round(250 * 0.55),
          stock: 10
        };
      });
      setStoreCosts(costsMap);
    }
    setStep(1);
    setErrorMsg('');
    setSuccessMsg('');
  }, [editingProduct, stores, categories]);

  // Handle retail price changes to auto-recompute supplier wholesale costs dynamically at 55% as a helpful starting point
  const handlePriceChange = (val: string) => {
    setProdPrice(val);
    const numPrice = Number(val) || 0;
    const updated = { ...storeCosts };
    Object.keys(updated).forEach(storeId => {
      updated[storeId].wholesaleCost = Math.round(numPrice * 0.55);
    });
    setStoreCosts(updated);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!prodName.trim()) {
        setErrorMsg('Product name/title is required.');
        return;
      }
      if (!prodPrice.trim() || Number(prodPrice) <= 0) {
        setErrorMsg('A valid customer retail price is required.');
        return;
      }
    }
    setErrorMsg('');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrorMsg('');
    setStep(prev => prev - 1);
  };

  const handlePublish = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Structure supplier inventory array from storeCosts mapping state
      const supplierInventory = Object.keys(storeCosts).map(storeId => ({
        storeId,
        wholesaleCost: storeCosts[storeId].wholesaleCost,
        stock: storeCosts[storeId].stock
      }));

      const payload = {
        name: prodName.trim(),
        brand: prodBrand.trim() || 'LANA',
        category: prodCategory,
        department: prodDepartment,
        gender: prodGender,
        retailPrice: Number(prodPrice),
        image: prodImage,
        description: prodDesc.trim() || `${prodName.trim()} exquisite luxury piece.`,
        volume: prodVolume,
        isActive: prodIsActive,
        isNew,
        isFeatured,
        isBestSeller,
        isExclusive,
        supplierInventory
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(`Product "${prodName}" was successfully published to the live master catalog!`);
        setTimeout(() => {
          onRefresh();
          onClose();
        }, 1200);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to publish luxury product.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 shadow-xl max-w-2xl w-full p-6 text-xs text-neutral-800 space-y-6">
      {/* HEADER BAR */}
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 font-sans block mb-0.5">
            Maison Lana Guided Creator
          </span>
          <h4 className="text-xl font-serif text-neutral-900 font-normal">
            {editingProduct ? 'Edit Luxury Product' : 'Add Luxury Product to Catalog'}
          </h4>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 border text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
        >
          <X size={16} />
        </button>
      </div>

      {/* STEP INDICATORS */}
      <div className="flex items-center justify-between bg-neutral-50 p-2.5 border">
        {[
          { num: 1, label: 'Identity' },
          { num: 2, label: 'Media Vault' },
          { num: 3, label: 'Costs & Suppliers' },
          { num: 4, label: 'Placements' },
          { num: 5, label: 'Audit Preview' }
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] border ${
              step === s.num 
                ? 'bg-neutral-900 text-white border-neutral-900' 
                : step > s.num 
                ? 'bg-amber-500 text-white border-amber-500' 
                : 'bg-white text-neutral-400 border-neutral-200'
            }`}>
              {step > s.num ? <Check size={10} /> : s.num}
            </span>
            <span className={`hidden sm:inline font-sans font-bold text-[9px] uppercase tracking-wider ${
              step === s.num ? 'text-neutral-900' : 'text-neutral-400'
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 flex items-center gap-2 font-bold">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-bold">
          <Check size={14} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CORE GUIDED VIEWS */}
      <div className="min-h-[260px]">
        {step === 1 && (
          /* STEP 1: IDENTITY & CATEGORIZATION */
          <div className="space-y-4">
            <div className="bg-amber-50/50 p-3 border border-amber-200/40 text-neutral-700 leading-relaxed">
              <h6 className="font-bold text-amber-800 uppercase text-[9px] tracking-wider mb-1">
                WHAT AM I CREATING? (Product Information)
              </h6>
              Define the luxury identity, brand heritage, and core sizing metrics. Ensure that the categorization matches perfectly so that the product appears inside the correct storefront filtering channels.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">Product Name / Title *</label>
                  <input 
                    type="text" 
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Chanel Chance Eau Tendre"
                    className="w-full p-2.5 border focus:outline-none focus:border-neutral-900"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">Brand Heritage</label>
                    <input 
                      type="text" 
                      value={prodBrand}
                      onChange={(e) => setProdBrand(e.target.value)}
                      placeholder="e.g. CHANEL, DIOR"
                      className="w-full p-2.5 border focus:outline-none focus:border-neutral-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">Volume / Sizes</label>
                    <input 
                      type="text" 
                      value={prodVolume}
                      onChange={(e) => setProdVolume(e.target.value)}
                      placeholder="e.g. 100ml, EU 38"
                      className="w-full p-2.5 border focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">Retail Price ($) *</label>
                    <input 
                      type="number" 
                      value={prodPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      placeholder="250"
                      className="w-full p-2.5 border focus:outline-none focus:border-neutral-900 font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">Gender Tag</label>
                    <select 
                      value={prodGender}
                      onChange={(e) => setProdGender(e.target.value as any)}
                      className="w-full p-2.5 border focus:outline-none focus:border-neutral-900"
                    >
                      <option value="Women">Women</option>
                      <option value="Men">Men</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">Department</label>
                    <select 
                      value={prodDepartment}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        setProdDepartment(newDept);
                        const matchingCats = (categories || []).filter(
                          (c) => (c.department || '').toLowerCase() === newDept.toLowerCase()
                        );
                        if (matchingCats.length > 0) {
                          setProdCategory(matchingCats[0].name);
                        }
                      }}
                      className="w-full p-2.5 border focus:outline-none focus:border-neutral-900"
                    >
                      {departmentList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">Category Group</label>
                    <select 
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="w-full p-2.5 border focus:outline-none focus:border-neutral-900"
                    >
                      {departmentCategories.map((c, idx) => (
                        <option key={c.id ? `${c.id}-${idx}` : `wiz-cat-${idx}`} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">Product Description</label>
                  <textarea 
                    rows={4}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Describe materials, notes, scent details..."
                    className="w-full p-2.5 border focus:outline-none focus:border-neutral-900 resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          /* STEP 2: MASTER MEDIA & ALIGNMENTS */
          <div className="space-y-3">
            <div className="bg-amber-50/50 p-3 border border-amber-200/40 text-neutral-700 leading-relaxed">
              <h6 className="font-bold text-amber-800 uppercase text-[9px] tracking-wider mb-1">
                WHAT IMAGE IS BEING USED? (Product Media Vault)
              </h6>
              Configure the primary high-resolution display photo for this luxury catalog item. Ensure the focal point target is placed correctly.
            </div>

            <MediaManager 
              label="Primary Product Hero Photo"
              imageUrl={prodImage}
              onImageChange={(url) => setProdImage(url)}
              required
            />
          </div>
        )}

        {step === 3 && (
          /* STEP 3: DARK STORE SUPPLIER COSTS & PRICING */
          <div className="space-y-4">
            <div className="bg-amber-50/50 p-3 border border-amber-200/40 text-neutral-700 leading-relaxed">
              <h6 className="font-bold text-amber-800 uppercase text-[9px] tracking-wider mb-1">
                WHAT IS THE LOGISTICS ENGINE? (Supplier Costs & Margins)
              </h6>
              Maison Lana operates on a zero-inventory aggregator model. Define the wholesale cost paid to each regional dark store. This computes your exact real-time platform profit margins on successful white-labeled order fulfillment.
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {stores.map((st) => {
                const values = storeCosts[st.id] || { wholesaleCost: Math.round(Number(prodPrice) * 0.55), stock: 10 };
                const margin = Number(prodPrice) - values.wholesaleCost;
                const marginPercent = Math.round((margin / Number(prodPrice)) * 100) || 0;

                return (
                  <div key={st.id} className="p-3 bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] uppercase font-mono text-amber-600 block">{st.id} • {st.neighborhood}</span>
                      <h5 className="font-bold text-neutral-900 truncate">{st.name}</h5>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div>
                        <label className="block text-[8px] uppercase text-neutral-500 mb-0.5 font-bold">Wholesale cost ($)</label>
                        <input 
                          type="number"
                          value={values.wholesaleCost}
                          onChange={(e) => {
                            setStoreCosts(prev => ({
                              ...prev,
                              [st.id]: { ...prev[st.id], wholesaleCost: Number(e.target.value) || 0 }
                            }));
                          }}
                          className="w-20 p-1.5 border font-mono text-center focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] uppercase text-neutral-500 mb-0.5 font-bold">In-Stock Qty</label>
                        <input 
                          type="number"
                          value={values.stock}
                          onChange={(e) => {
                            setStoreCosts(prev => ({
                              ...prev,
                              [st.id]: { ...prev[st.id], stock: Number(e.target.value) || 0 }
                            }));
                          }}
                          className="w-16 p-1.5 border font-mono text-center focus:outline-none"
                        />
                      </div>

                      <div className="text-right w-24">
                        <span className="block text-[8px] uppercase text-neutral-500 font-bold">Net Margin</span>
                        <span className="font-mono font-bold text-emerald-700 text-xs">
                          +${margin}.00 ({marginPercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          /* STEP 4: PLACEMENTS & BADGES */
          <div className="space-y-4">
            <div className="bg-amber-50/50 p-3 border border-amber-200/40 text-neutral-700 leading-relaxed">
              <h6 className="font-bold text-amber-800 uppercase text-[9px] tracking-wider mb-1">
                WHERE WILL IT APPEAR? (Storefront Visibility & Campaigns)
              </h6>
              Determine catalog visibility status and attach promotional marketing tags to customize storefront placement in recommendations and home layouts.
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-neutral-50 border space-y-3">
                <h5 className="font-bold uppercase tracking-wider text-[10px] text-neutral-800 border-b pb-1">
                  Draft & Visibility Status
                </h5>

                <label className="flex items-center gap-2.5 cursor-pointer p-1">
                  <input 
                    type="checkbox"
                    checked={prodIsActive}
                    onChange={(e) => setProdIsActive(e.target.checked)}
                    className="w-4.5 h-4.5 accent-neutral-900"
                  />
                  <div>
                    <span className="font-bold text-neutral-900 block">Published & Active on Storefront</span>
                    <span className="text-[10px] text-neutral-500">Clients can view and add to bag instantly.</span>
                  </div>
                </label>
              </div>

              <div className="p-4 bg-neutral-50 border space-y-3">
                <h5 className="font-bold uppercase tracking-wider text-[10px] text-neutral-800 border-b pb-1">
                  Promotional Badging Placement
                </h5>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { state: isFeatured, set: setIsFeatured, label: 'Featured Item', desc: 'Home grids' },
                    { state: isNew, set: setIsNew, label: 'New Arrival', desc: 'Badge displayed' },
                    { state: isBestSeller, set: setIsBestSeller, label: 'Best Seller', desc: 'Popular list' },
                    { state: isExclusive, set: setIsExclusive, label: 'Exclusive Piece', desc: 'VIP clients only' }
                  ].map((flag, idx) => (
                    <label key={idx} className="flex items-center gap-1.5 cursor-pointer bg-white border p-2 hover:border-neutral-400 transition-colors">
                      <input 
                        type="checkbox"
                        checked={flag.state}
                        onChange={(e) => flag.set(e.target.checked)}
                        className="w-4 h-4 accent-neutral-900"
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-neutral-800 block text-[10px] leading-tight truncate">{flag.label}</span>
                        <span className="text-[8px] text-neutral-500 block leading-none">{flag.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          /* STEP 5: REVIEW & COMPLETED PDP MOCKUP */
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 leading-relaxed">
              <h6 className="font-bold text-emerald-800 uppercase text-[9px] tracking-wider mb-1">
                CMS AUDIT PASSED: WHAT DOES THE CUSTOMER SEE?
              </h6>
              Verify all parameters. Below is a realistic high-end storefront mobile viewport mockup. Ensure styling, alignment, and information structure are impeccable before hitting Publish.
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Product information summary panel */}
              <div className="p-4 bg-neutral-50 border text-[11px] space-y-2.5">
                <h5 className="font-bold uppercase tracking-widest text-[9px] text-neutral-800 border-b pb-1">
                  Master Product Audit Sheet
                </h5>
                <div className="space-y-1 font-sans text-neutral-700">
                  <p><strong>Title:</strong> {prodName}</p>
                  <p><strong>Brand Heritage:</strong> <span className="font-mono font-bold text-neutral-900">{prodBrand}</span></p>
                  <p><strong>Categorization:</strong> {prodCategory} • {prodDepartment} Department</p>
                  <p><strong>Retail Price:</strong> <span className="font-bold text-neutral-900">${prodPrice}.00</span></p>
                  <p><strong>Status:</strong> {prodIsActive ? 'Published (Active)' : 'Draft (Hidden)'}</p>
                  <p><strong>Sizing/Volume:</strong> {prodVolume}</p>
                  <p><strong>Fulfillment Partners ({stores.length}):</strong></p>
                  <p className="text-neutral-500 text-[10px]">
                    {Object.keys(storeCosts).map(id => `${id}: $${storeCosts[id].wholesaleCost} (qty: ${storeCosts[id].stock})`).join(' | ')}
                  </p>
                </div>
              </div>

              {/* PDP Mobile Grid Card Mockup */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Customer PDP Storefront Mockup
                </span>
                <div className="border bg-white p-3.5 shadow-xs max-w-sm mx-auto">
                  <div className="aspect-3/4 bg-neutral-100 overflow-hidden relative border">
                    {prodImage && prodImage.trim() !== '' ? (
                      <img src={prodImage} alt={prodName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                        Sawir lama dooran
                      </div>
                    )}
                    
                    {/* Floating badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {isNew && <span className="bg-neutral-950 text-white text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5">NEW</span>}
                      {isExclusive && <span className="bg-amber-600 text-white text-[8px] uppercase tracking-widest font-bold px-1.5 py-0.5">EXCLUSIVE</span>}
                    </div>
                  </div>

                  <div className="pt-3 space-y-1 text-left font-sans">
                    <span className="text-[8px] uppercase tracking-[0.2em] font-bold text-amber-600 font-mono">{prodBrand}</span>
                    <h4 className="text-sm font-serif font-bold text-neutral-900 truncate leading-tight">{prodName}</h4>
                    <p className="text-[10px] text-neutral-500 truncate">{prodVolume} • {prodGender}</p>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-mono font-bold text-sm text-neutral-900">${prodPrice}.00</span>
                      <button type="button" className="bg-neutral-950 text-white text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-none">
                        Add to bag
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER NAV CONTROLS */}
      <div className="pt-4 border-t flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 1 || isSaving}
          className="px-4 py-2 border font-bold uppercase text-[10px] tracking-wider text-neutral-600 hover:bg-neutral-50 flex items-center gap-1.5 disabled:opacity-40"
        >
          <ArrowLeft size={13} /> Back
        </button>

        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-5 py-2.5 bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-amber-600 transition-colors flex items-center gap-1.5"
          >
            Continue <ArrowRight size={13} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="px-6 py-2.5 bg-amber-600 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-neutral-900 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Publishing Product...</span>
              </>
            ) : (
              <>
                <Check size={14} />
                <span>Publish to Storefront</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
