import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, FolderPlus, Layers, HelpCircle, Check, ArrowRight, ArrowLeft, RefreshCw, Eye, Tag, AlertCircle } from 'lucide-react';
import { Category } from '../../types';
import { MediaManager } from './MediaManager';

interface CategoryWizardProps {
  categories: Category[];
  editingCategory: Category | null;
  onClose: () => void;
  onRefresh: () => void;
  adminToken: string;
}

export function CategoryWizard({ categories, editingCategory, onClose, onRefresh, adminToken }: CategoryWizardProps) {
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Guided Form states
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800');
  const [catDept, setCatDept] = useState<string>('Fashion');
  const [customDeptInput, setCustomDeptInput] = useState('');
  
  // Interactive tags list for subcategories
  const [subCatInput, setSubCatInput] = useState('');
  const [subCategories, setSubCategories] = useState<string[]>([]);

  // Calculate unique departments from existing categories
  const departmentOptions = useMemo(() => {
    const defaultDepts = [
      { id: 'Fashion', desc: 'Dresses, Bags, Gowns, Outerwear' },
      { id: 'Beauty', desc: 'Fragrances, Premium Oils, Cosmetics' },
      { id: 'Bodycare', desc: 'Moisturizing Crèmes, Scented Lotions' },
      { id: 'Accessories', desc: 'Jewelry, Luxury Watches, Scarves' }
    ];
    const existingCustomDepts = Array.from(
      new Set(
        (categories || [])
          .map((c) => c.department)
          .filter((d): d is string => Boolean(d && !['Fashion', 'Beauty', 'Bodycare', 'Accessories'].includes(d)))
      )
    ).map((d) => ({
      id: d,
      desc: 'Custom Created Department'
    }));

    return [...defaultDepts, ...existingCustomDepts];
  }, [categories]);

  useEffect(() => {
    if (editingCategory) {
      setCatName(editingCategory.name);
      setCatDesc(editingCategory.description);
      setCatImage(editingCategory.image);
      setCatDept(editingCategory.department || 'Fashion');
      setSubCategories(editingCategory.subCategories || []);
      setCustomDeptInput(
        editingCategory.department && !['Fashion', 'Beauty', 'Bodycare', 'Accessories'].includes(editingCategory.department)
          ? editingCategory.department
          : ''
      );
    } else {
      setCatName('');
      setCatDesc('');
      setCatImage('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800');
      setCatDept('Fashion');
      setSubCategories([]);
      setCustomDeptInput('');
    }
    setStep(1);
    setErrorMsg('');
    setSuccessMsg('');
  }, [editingCategory]);

  const handleAddSubCategory = () => {
    if (!subCatInput.trim()) return;
    const cleanSub = subCatInput.trim();
    if (subCategories.includes(cleanSub)) {
      setErrorMsg('This subcategory already exists.');
      return;
    }
    setSubCategories(prev => [...prev, cleanSub]);
    setSubCatInput('');
    setErrorMsg('');
  };

  const handleRemoveSubCategory = (sub: string) => {
    setSubCategories(prev => prev.filter(item => item !== sub));
  };

  const handleNext = () => {
    if (step === 1 && !catName.trim()) {
      setErrorMsg('Category name is required.');
      return;
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
      const payload = {
        id: editingCategory?.id || catName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: catName.trim(),
        description: catDesc.trim() || `${catName.trim()} luxury collection.`,
        image: catImage,
        department: catDept,
        subCategories: subCategories
      };

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(`Category "${catName}" has been successfully published to the live catalog!`);
        setTimeout(() => {
          onRefresh();
          onClose();
        }, 1200);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to save category');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 shadow-xl max-w-2xl w-full p-6 text-xs text-neutral-800 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-600 font-sans block mb-0.5">
            Maison Lana Guided Creator
          </span>
          <h4 className="text-xl font-serif text-neutral-900 font-normal">
            {editingCategory ? 'Edit Store Category' : 'Create Luxury Category'}
          </h4>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 border text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
        >
          <X size={16} />
        </button>
      </div>

      {/* STEP INDICATOR DOTS BAR */}
      <div className="flex items-center justify-between bg-neutral-50 p-2.5 border">
        {[
          { num: 1, label: 'Identity & Metadata' },
          { num: 2, label: 'Department' },
          { num: 3, label: 'Media Adjustment' },
          { num: 4, label: 'Subcategories' },
          { num: 5, label: 'Review & Publish' }
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

      {/* CORE GUIDED VIEWPORTS */}
      <div className="min-h-[220px]">
        {step === 1 && (
          /* STEP 1: IDENTITY & METADATA */
          <div className="space-y-4">
            <div className="bg-amber-50/50 p-3 border border-amber-200/40 text-neutral-700 leading-relaxed">
              <h6 className="font-bold text-amber-800 uppercase text-[9px] tracking-wider mb-1">
                WHAT AM I CREATING? (Aqoonsiga Qeybta)
              </h6>
              Provide a premium, high-converting title and an exquisite, editorial short description for this category. Customers will see these titles and descriptions in catalog grids and navigation headers.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  Category Name / Title *
                </label>
                <input 
                  type="text" 
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Fine Jewelry, Silk Scarves, Ouds"
                  className="w-full p-2.5 border focus:outline-none focus:border-neutral-900 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">
                  Editorial Description (Short Slogan)
                </label>
                <textarea 
                  rows={4}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="e.g. Crafted meticulously with premium ingredients and curated designs that capture the heart of French-Arabian prestige."
                  className="w-full p-2.5 border focus:outline-none focus:border-neutral-900 text-xs resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          /* STEP 2: DEPARTMENT ASSIGNMENT */
          <div className="space-y-4">
            <div className="bg-amber-50/50 p-3 border border-amber-200/40 text-neutral-700 leading-relaxed">
              <h6 className="font-bold text-amber-800 uppercase text-[9px] tracking-wider mb-1">
                WHERE WILL IT APPEAR? (Goobta Meelaynta)
              </h6>
              Assign this category to one of Maison Lana’s master departments. This determines which section of the shop layout, mega-menu dropdown, and sidebar filter the category automatically renders under.
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
              {departmentOptions.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    setCatDept(d.id);
                    setCustomDeptInput('');
                  }}
                  className={`p-4 border text-left flex flex-col justify-between transition-all cursor-pointer hover:border-neutral-900 ${
                    catDept.toLowerCase() === d.id.toLowerCase() ? 'border-neutral-900 bg-neutral-50 shadow-xs' : 'border-neutral-200'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-bold text-neutral-900">{d.id}</span>
                    {catDept.toLowerCase() === d.id.toLowerCase() && <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">{d.desc}</p>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t">
              <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">
                Or Type a Custom Department Name
              </label>
              <input 
                type="text" 
                value={customDeptInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDeptInput(val);
                  if (val.trim()) {
                    setCatDept(val.trim());
                  }
                }}
                placeholder="e.g. Watches, Men's Luxury, Oud & Bakhoor"
                className="w-full p-2.5 border focus:outline-none focus:border-neutral-900 text-xs"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          /* STEP 3: MEDIA ADJUSTMENT & PRESENTATION */
          <div className="space-y-3">
            <div className="bg-amber-50/50 p-3 border border-amber-200/40 text-neutral-700 leading-relaxed">
              <h6 className="font-bold text-amber-800 uppercase text-[9px] tracking-wider mb-1">
                WHAT IMAGE IS BEING USED? / HOW WILL THAT IMAGE APPEAR?
              </h6>
              Provide a premium campaign photograph for this category and refine how it scales for Desktop and Mobile screens.
            </div>

            <MediaManager 
              label="Category Banner Image"
              imageUrl={catImage}
              onImageChange={(url) => setCatImage(url)}
              required
            />
          </div>
        )}

        {step === 4 && (
          /* STEP 4: INTERACTIVE SUBCATEGORY TAGS */
          <div className="space-y-4">
            <div className="bg-amber-50/50 p-3 border border-amber-200/40 text-neutral-700 leading-relaxed">
              <h6 className="font-bold text-amber-800 uppercase text-[9px] tracking-wider mb-1">
                WHAT PRODUCTS BELONG TO IT? (Subcategories Setup)
              </h6>
              Add specific product groupings (subcategories) under this category. This helps clients filter down easily (e.g. adding 'Rings' and 'Earrings' under Category 'Jewelry').
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={subCatInput}
                  onChange={(e) => setSubCatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubCategory(); } }}
                  placeholder="e.g. Necklaces, Fragrance Oil, Evening Bags..."
                  className="w-full p-2.5 border focus:outline-none focus:border-neutral-900 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSubCategory}
                  className="px-4 bg-neutral-900 text-white uppercase font-bold text-[10px] hover:bg-amber-600 transition-colors"
                >
                  Add Subcategory
                </button>
              </div>

              {/* Subcategories tags display */}
              <div className="p-4 border min-h-[80px] bg-neutral-50 flex flex-wrap gap-2 items-start">
                {subCategories.length === 0 ? (
                  <span className="text-neutral-400 italic font-sans text-[11px] self-center mx-auto">
                    No subcategories added yet. Type above and press Enter.
                  </span>
                ) : (
                  subCategories.map((sub) => (
                    <span 
                      key={sub} 
                      className="px-2.5 py-1 bg-white border font-bold text-neutral-800 inline-flex items-center gap-1.5 shadow-2xs hover:border-red-400 transition-colors"
                    >
                      <span>{sub}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSubCategory(sub)}
                        className="text-neutral-400 hover:text-red-600 p-0.5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          /* STEP 5: REVIEW & PUBLISH MOCKUP DISPLAY */
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200/50 p-3 text-emerald-800 leading-relaxed">
              <h6 className="font-bold text-emerald-800 uppercase text-[9px] tracking-wider mb-1">
                CMS AUDIT PASSED: WHAT DOES THE CUSTOMER SEE?
              </h6>
              Verify details below. The client storefront will render a responsive, elegant category card matching your configuration perfectly.
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Data Summary Column */}
              <div className="space-y-3 bg-neutral-50 p-4 border text-[11px]">
                <h5 className="font-bold text-neutral-800 uppercase tracking-widest text-[9px] border-b pb-1">
                  Catalog Manifest Overview
                </h5>
                <div className="space-y-1.5 font-sans">
                  <p><strong>Category Title:</strong> {catName}</p>
                  <p><strong>Assigned Department:</strong> {catDept}</p>
                  <p><strong>Description:</strong> <span className="text-neutral-600">{catDesc || '—'}</span></p>
                  <p><strong>Subcategories ({subCategories.length}):</strong></p>
                  <p className="text-neutral-500">{subCategories.join(', ') || 'None'}</p>
                </div>
              </div>

              {/* Live Category Card Mockup on Storefront */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Storefront Card Mockup
                </span>
                <div className="border bg-white p-3 shadow-xs">
                  <div className="relative aspect-3/4 overflow-hidden border">
                    {catImage && catImage.trim() !== '' ? (
                      <img 
                        src={catImage} 
                        alt={catName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-xs">
                        Sawir lama helin
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                      <span className="text-[8px] font-sans font-bold tracking-widest text-amber-400 uppercase mb-0.5">
                        {catDept} Department
                      </span>
                      <h4 className="text-lg font-serif font-bold tracking-wider uppercase mb-1">{catName}</h4>
                      <p className="text-[10px] text-white/70 line-clamp-2 leading-relaxed">{catDesc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER WIZARD NAVIGATION BAR */}
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
                <span>Publishing Category...</span>
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
