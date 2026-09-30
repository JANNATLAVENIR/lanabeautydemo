import React, { useState, useEffect } from 'react';
import { 
  Building2,
  MessageSquare, 
  Share2, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Check, 
  Save, 
  RefreshCw, 
  ShieldCheck, 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube, 
  Sparkles, 
  Tag,
  Plus,
  Trash2,
  AlertCircle,
  Smartphone,
  Truck,
  Package,
  Copy,
  Lock,
  Sliders,
  DollarSign,
  Gift,
  Upload
} from 'lucide-react';
import { HomepageSettings, SocialLinksSettings, StoreContactSettings } from '../../types';

export interface ExecutiveSettingsManagerProps {
  homepageSettings?: HomepageSettings;
  onSaveHomepageSettings: (settings: any) => Promise<void>;
  onRefresh?: () => void;
  adminEmail?: string;
  onNavigateTab?: (tab: string) => void;
}

export function ExecutiveSettingsManager({
  homepageSettings,
  onSaveHomepageSettings,
  onRefresh,
  adminEmail = 'lanamarketplacehq@gmail.com',
  onNavigateTab
}: ExecutiveSettingsManagerProps) {
  // Navigation Section
  const [activeSection, setActiveSection] = useState<
    'boutique' | 'concierge' | 'social' | 'promos' | 'delivery' | 'homepage' | 'security'
  >('boutique');

  // 1. Boutique Identity
  const [storeName, setStoreName] = useState(
    homepageSettings?.contactInfo?.storeName || 'Maison LANA'
  );
  const [storeLogo, setStoreLogo] = useState(
    (homepageSettings as any)?.storeLogo || ''
  );
  const [storeTagline, setStoreTagline] = useState(
    (homepageSettings as any)?.storeTagline || 'Haute Couture, Maroquinerie & Parfumerie Française'
  );
  const [currencySymbol, setCurrencySymbol] = useState(
    (homepageSettings as any)?.currencySymbol || 'USD ($)'
  );
  const [address, setAddress] = useState(
    homepageSettings?.contactInfo?.address || '30 Avenue Montaigne / Olaya Luxury District'
  );
  const [city, setCity] = useState(
    homepageSettings?.contactInfo?.city || 'Paris & Riyadh'
  );
  const [contactEmail, setContactEmail] = useState(
    homepageSettings?.contactInfo?.contactEmail || 'concierge@lanaluxury.com'
  );
  const [contactPhone, setContactPhone] = useState(
    homepageSettings?.contactInfo?.contactPhone || ''
  );
  const [businessHours, setBusinessHours] = useState(
    homepageSettings?.contactInfo?.businessHours || 'Monday – Sunday: 10:00 AM – 11:00 PM (GMT+3)'
  );

  // 2. WhatsApp Concierge
  const [whatsappEnabled, setWhatsappEnabled] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.whatsappEnabled !== undefined) return Boolean(parsed.whatsappEnabled);
        if (parsed.contactInfo?.whatsappEnabled !== undefined) return Boolean(parsed.contactInfo.whatsappEnabled);
      }
    } catch {}
    if (homepageSettings?.whatsappEnabled !== undefined) return Boolean(homepageSettings.whatsappEnabled);
    if (homepageSettings?.contactInfo?.whatsappEnabled !== undefined) return Boolean(homepageSettings.contactInfo.whatsappEnabled);
    return true;
  });

  const [whatsappNumber, setWhatsappNumber] = useState(() => {
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.whatsappNumber) return parsed.whatsappNumber;
        if (parsed.contactInfo?.whatsappNumber) return parsed.contactInfo.whatsappNumber;
      }
    } catch {}
    return homepageSettings?.whatsappNumber || homepageSettings?.contactInfo?.whatsappNumber || '';
  });

  useEffect(() => {
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.whatsappNumber && !whatsappNumber) setWhatsappNumber(parsed.whatsappNumber);
        if (parsed.whatsappEnabled !== undefined) setWhatsappEnabled(parsed.whatsappEnabled);
      }
    } catch {}
  }, []);
  const [whatsappGreeting, setWhatsappGreeting] = useState(
    homepageSettings?.whatsappGreeting || 
    homepageSettings?.contactInfo?.whatsappGreeting || 
    'Salam Maison LANA VIP Concierge, I would like to inquire about your luxury collections.'
  );
  const [whatsappFloatingActive, setWhatsappFloatingActive] = useState(
    homepageSettings?.whatsappFloatingActive ?? homepageSettings?.contactInfo?.whatsappFloatingActive ?? true
  );

  // 3. Social Media Links
  const [whatsappSocial, setWhatsappSocial] = useState(homepageSettings?.socialLinks?.whatsapp || '');
  const [instagram, setInstagram] = useState(homepageSettings?.socialLinks?.instagram || '');
  const [tiktok, setTiktok] = useState(homepageSettings?.socialLinks?.tiktok || '');
  const [snapchat, setSnapchat] = useState(homepageSettings?.socialLinks?.snapchat || '');
  const [youtube, setYoutube] = useState(homepageSettings?.socialLinks?.youtube || '');
  const [twitter, setTwitter] = useState(homepageSettings?.socialLinks?.twitter || '');
  const [facebook, setFacebook] = useState(homepageSettings?.socialLinks?.facebook || '');
  const [pinterest, setPinterest] = useState(homepageSettings?.socialLinks?.pinterest || '');

  // 4. Promo Codes
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoPercent, setNewPromoPercent] = useState('10');
  const [newPromoMinSpend, setNewPromoMinSpend] = useState('0');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 5. Delivery & Policies
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    (homepageSettings as any)?.shippingPolicies?.freeShippingThreshold ?? 500
  );
  const [signatureGiftPackaging, setSignatureGiftPackaging] = useState(
    (homepageSettings as any)?.shippingPolicies?.signatureGiftPackaging ?? true
  );
  const [returnWindowDays, setReturnWindowDays] = useState(
    (homepageSettings as any)?.shippingPolicies?.returnWindowDays ?? 14
  );
  const [courierPartner, setCourierPartner] = useState(
    (homepageSettings as any)?.shippingPolicies?.courierPartner || 'White-Glove VIP Courier & DHL Express'
  );

  // 6. Homepage quick titles
  const [heroFashionTitle, setHeroFashionTitle] = useState(
    homepageSettings?.heroFashionTitle || 'Fashion & Accessories'
  );
  const [heroBeautyTitle, setHeroBeautyTitle] = useState(
    homepageSettings?.heroBeautyTitle || 'Fragrance & Haute Parfumerie'
  );

  // State Management
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Sync state when props update
  useEffect(() => {
    if (homepageSettings) {
      if (homepageSettings.whatsappEnabled !== undefined) setWhatsappEnabled(homepageSettings.whatsappEnabled);
      if (homepageSettings.whatsappNumber) setWhatsappNumber(homepageSettings.whatsappNumber);
      if (homepageSettings.whatsappGreeting) setWhatsappGreeting(homepageSettings.whatsappGreeting);
      if (homepageSettings.whatsappFloatingActive !== undefined) setWhatsappFloatingActive(homepageSettings.whatsappFloatingActive);

      if (homepageSettings.socialLinks) {
        setWhatsappSocial(homepageSettings.socialLinks.whatsapp || '');
        setInstagram(homepageSettings.socialLinks.instagram || '');
        setTiktok(homepageSettings.socialLinks.tiktok || '');
        setFacebook(homepageSettings.socialLinks.facebook || '');
        setPinterest(homepageSettings.socialLinks.pinterest || '');
        setTwitter(homepageSettings.socialLinks.twitter || '');
        setYoutube(homepageSettings.socialLinks.youtube || '');
        setSnapchat(homepageSettings.socialLinks.snapchat || '');
      }

      if (homepageSettings.contactInfo) {
        if (homepageSettings.contactInfo.storeName) setStoreName(homepageSettings.contactInfo.storeName);
        if (homepageSettings.contactInfo.contactEmail) setContactEmail(homepageSettings.contactInfo.contactEmail);
        if (homepageSettings.contactInfo.contactPhone) setContactPhone(homepageSettings.contactInfo.contactPhone);
        if (homepageSettings.contactInfo.address) setAddress(homepageSettings.contactInfo.address);
        if (homepageSettings.contactInfo.city) setCity(homepageSettings.contactInfo.city);
        if (homepageSettings.contactInfo.businessHours) setBusinessHours(homepageSettings.contactInfo.businessHours);
      }

      if (homepageSettings.heroFashionTitle) setHeroFashionTitle(homepageSettings.heroFashionTitle);
      if (homepageSettings.heroBeautyTitle) setHeroBeautyTitle(homepageSettings.heroBeautyTitle);

      const anySettings = homepageSettings as any;
      if (anySettings.storeTagline) setStoreTagline(anySettings.storeTagline);
      if (anySettings.currencySymbol) setCurrencySymbol(anySettings.currencySymbol);
      if (anySettings.shippingPolicies) {
        if (anySettings.shippingPolicies.freeShippingThreshold !== undefined) {
          setFreeShippingThreshold(anySettings.shippingPolicies.freeShippingThreshold);
        }
        if (anySettings.shippingPolicies.signatureGiftPackaging !== undefined) {
          setSignatureGiftPackaging(anySettings.shippingPolicies.signatureGiftPackaging);
        }
        if (anySettings.shippingPolicies.returnWindowDays !== undefined) {
          setReturnWindowDays(anySettings.shippingPolicies.returnWindowDays);
        }
        if (anySettings.shippingPolicies.courierPartner) {
          setCourierPartner(anySettings.shippingPolicies.courierPartner);
        }
      }
    }
  }, [homepageSettings]);

  // Load promo codes
  const fetchPromoCodes = async () => {
    try {
      setPromoLoading(true);
      const res = await fetch('/api/promo-codes');
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setPromoCodes(data);
      }
    } catch (e) {
      console.warn('Failed to load promo codes', e);
    } finally {
      setPromoLoading(false);
    }
  };

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const handleAddPromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    setPromoMsg('');

    try {
      const token = localStorage.getItem('lana_admin_token') || '';
      const res = await fetch('/api/promo-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newPromoCode.trim().toUpperCase(),
          discountPercent: Number(newPromoPercent) || 0,
          discountAmount: 0,
          minOrderAmount: Number(newPromoMinSpend) || 0,
          isActive: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        setPromoMsg(`Koodhka "${newPromoCode.trim().toUpperCase()}" si guul leh ayaa loo abuuray!`);
        setNewPromoCode('');
        fetchPromoCodes();
      } else {
        setPromoMsg(data.error || 'Khalad ayaa dhacay.');
      }
    } catch (err: any) {
      setPromoMsg(err.message || 'Khalad ayaa dhacay koodhka abuuristiisa.');
    }
  };

  const handleDeletePromoCode = async (code: string) => {
    if (!confirm(`Ma hubtaa inaad tirtirto koodhka "${code}"?`)) return;
    try {
      const token = localStorage.getItem('lana_admin_token') || '';
      const res = await fetch(`/api/promo-codes/${encodeURIComponent(code)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPromoCodes();
      }
    } catch (e) {
      console.error('Failed to delete promo code', e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const cleanWaNumber = (num: string) => num.replace(/[^0-9]/g, '');

  const formatSnapchatUrl = (val: string) => {
    const trimmed = (val || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    const cleanHandle = trimmed.replace(/^@+/, '').replace(/^snapchat\.com\/add\//i, '').replace(/^www\.snapchat\.com\/add\//i, '');
    return `https://snapchat.com/add/${cleanHandle}`;
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const formattedSnapchat = snapchat.trim() ? formatSnapchatUrl(snapchat.trim()) : '';

    const isWaReallyActive = Boolean(whatsappEnabled && whatsappNumber.trim());
    const finalWaNumber = isWaReallyActive ? whatsappNumber.trim() : '';
    const finalWaSocial = isWaReallyActive 
      ? (whatsappSocial.trim() || `https://wa.me/${cleanWaNumber(whatsappNumber)}`)
      : '';

    const socialLinks: SocialLinksSettings = {
      whatsapp: finalWaSocial,
      instagram: instagram.trim(),
      tiktok: tiktok.trim(),
      facebook: facebook.trim(),
      pinterest: pinterest.trim(),
      twitter: twitter.trim(),
      youtube: youtube.trim(),
      snapchat: formattedSnapchat
    };

    const contactInfo: StoreContactSettings = {
      storeName: storeName.trim(),
      whatsappNumber: finalWaNumber,
      whatsappGreeting: whatsappGreeting.trim(),
      whatsappFloatingActive: isWaReallyActive && whatsappFloatingActive,
      whatsappEnabled: isWaReallyActive,
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      address: address.trim(),
      city: city.trim(),
      businessHours: businessHours.trim()
    };

    const shippingPolicies = {
      freeShippingThreshold: Number(freeShippingThreshold) || 500,
      signatureGiftPackaging,
      returnWindowDays: Number(returnWindowDays) || 14,
      courierPartner: courierPartner.trim()
    };

    const payload = {
      ...(homepageSettings || {}),
      storeName: storeName.trim(),
      storeLogo: storeLogo.trim(),
      storeTagline: storeTagline.trim(),
      currencySymbol,
      whatsappNumber: finalWaNumber,
      whatsappGreeting: whatsappGreeting.trim(),
      whatsappFloatingActive: isWaReallyActive && whatsappFloatingActive,
      whatsappEnabled: isWaReallyActive,
      socialLinks,
      contactInfo,
      shippingPolicies,
      heroFashionTitle: heroFashionTitle.trim(),
      heroBeautyTitle: heroBeautyTitle.trim()
    };

    try {
      await onSaveHomepageSettings(payload);
      
      if (formattedSnapchat) {
        setSnapchat(formattedSnapchat);
      }
      
      localStorage.setItem('lana_site_settings_cache', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('lana_settings_updated', { detail: payload }));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      onRefresh?.();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const testWhatsAppUrl = `https://wa.me/${cleanWaNumber(whatsappNumber)}?text=${encodeURIComponent(whatsappGreeting)}`;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Top Luxury Banner & Actions */}
      <div className="bg-white border border-neutral-200 p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-neutral-400">
              ATELIER CONFIGURATION SUITE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
              Live Production State
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-neutral-900 font-normal tracking-tight">
            Maison Settings &amp; Global Preferences
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 font-sans max-w-2xl leading-relaxed">
            Halkan waxaad ku maamuli kartaa magaca iyo xogta rasmiga ah ee Maison LANA, xidhiidhka tooska ah ee WhatsApp VIP Concierge, baraha bulshada, koodhadhka qiimo dhimista (Promo Codes), iyo siyaasadda keenista raaxada ah.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-8 py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white text-xs uppercase font-bold tracking-[0.2em] transition-all flex items-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Kaydinayaa...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Waa La Kaydiyey!</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Kaydi Dhammaan (Save Settings)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-3 shadow-xs">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>Dhammaan xogta maamulka ee Maison LANA si guul leh ayaa loo cusboonaysiiyey loona daabacay website-ka oo dhan!</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-900 text-xs font-medium flex items-center gap-3 shadow-xs">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Settings Grid with Sidebar Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white border border-neutral-200 p-2 shadow-xs lg:sticky lg:top-4 z-10">
          <div className="px-3 py-2 lg:px-4 lg:py-3 border-b border-neutral-100 mb-2 lg:mb-1 flex items-center justify-between">
            <span className="text-[9.5px] uppercase font-bold tracking-[0.25em] text-neutral-400 block">
              SETTINGS DIRECTORY
            </span>
            <span className="lg:hidden text-[9px] uppercase font-mono text-neutral-400">Swipe →</span>
          </div>

          <div className="flex flex-row overflow-x-auto lg:flex-col lg:overflow-x-visible gap-1.5 lg:gap-1 pb-1 lg:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSection('boutique')}
              className={`shrink-0 lg:w-full px-3.5 py-2.5 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeSection === 'boutique'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60 lg:border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <Building2 size={14} className="shrink-0" />
                <span className="whitespace-nowrap">1. Maison Identity</span>
              </div>
              {activeSection === 'boutique' && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('concierge')}
              className={`shrink-0 lg:w-full px-3.5 py-2.5 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeSection === 'concierge'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60 lg:border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <Smartphone size={14} className="shrink-0" />
                <span className="whitespace-nowrap">2. VIP Concierge</span>
              </div>
              {activeSection === 'concierge' && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('social')}
              className={`shrink-0 lg:w-full px-3.5 py-2.5 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeSection === 'social'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60 lg:border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <Share2 size={14} className="shrink-0" />
                <span className="whitespace-nowrap">3. Social Channels</span>
              </div>
              {activeSection === 'social' && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('promos')}
              className={`shrink-0 lg:w-full px-3.5 py-2.5 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeSection === 'promos'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60 lg:border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <Tag size={14} className="shrink-0" />
                <span className="whitespace-nowrap">4. Promo Codes ({promoCodes.length})</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('delivery')}
              className={`shrink-0 lg:w-full px-3.5 py-2.5 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeSection === 'delivery'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60 lg:border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <Truck size={14} className="shrink-0" />
                <span className="whitespace-nowrap">5. Delivery &amp; Policies</span>
              </div>
              {activeSection === 'delivery' && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('homepage')}
              className={`shrink-0 lg:w-full px-3.5 py-2.5 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeSection === 'homepage'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60 lg:border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <Sparkles size={14} className="shrink-0" />
                <span className="whitespace-nowrap">6. Campaign Headlines</span>
              </div>
              {activeSection === 'homepage' && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('security')}
              className={`shrink-0 lg:w-full px-3.5 py-2.5 lg:px-4 lg:py-3 text-left text-[11px] lg:text-xs uppercase tracking-wider font-semibold transition-all flex items-center justify-between gap-2 cursor-pointer ${
                activeSection === 'security'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-200/60 lg:border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-3">
                <ShieldCheck size={14} className="shrink-0" />
                <span className="whitespace-nowrap">7. Master Security</span>
              </div>
              {activeSection === 'security' && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
            </button>
          </div>
        </div>

        {/* Content Form Area & Right Live Card */}
        <div className="lg:col-span-9 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Active Section Form */}
          <div className="xl:col-span-8 bg-white border border-neutral-200 p-6 sm:p-8 space-y-8 shadow-xs">
            
            {/* 1. MAISON IDENTITY */}
            {activeSection === 'boutique' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[9.5px] uppercase font-bold tracking-[0.25em] text-neutral-400 block mb-1">
                    SECTION 01
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 font-normal">
                    Maison Identity &amp; Flagship Profile
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans mt-1">
                    Qeex magaca rasmiga ah ee boutique-ka, hal-ku-dhegga, cinwaanka xarunta dhexe, iyo saacadaha shaqada ee ka muuqanaya bogga hore iyo invoice-yada.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-sans">
                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Maison Brand Name *
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g. Maison LANA"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Currency Presentation
                    </label>
                    <select
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs transition-colors"
                    >
                      <option value="USD ($)">USD ($) — Global Luxury Standard</option>
                      <option value="EUR (€)">EUR (€) — European Flagship</option>
                      <option value="SAR (﷼)">SAR (﷼) — Gulf VIP Private Vault</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px]">
                      Maison Footer Logo Image (Sawirka Logo-ga ee Hoose)
                    </label>
                    
                    <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <label className="px-4 py-2 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer transition-colors inline-flex items-center justify-center gap-2 shrink-0">
                          <Upload size={14} />
                          <span>Soo Geli Sawir (File Upload)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (typeof event.target?.result === 'string') {
                                    setStoreLogo(event.target.result);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        <input
                          type="url"
                          value={storeLogo.startsWith('data:') ? '' : storeLogo}
                          onChange={(e) => setStoreLogo(e.target.value)}
                          placeholder="Mise ku dheji Link-ga sawirka (URL e.g. https://.../logo.png)"
                          className="flex-1 px-3.5 py-2 bg-white border border-neutral-200 focus:outline-none focus:border-neutral-900 text-neutral-900 font-mono text-xs"
                        />
                      </div>

                      {storeLogo ? (
                        <div className="p-4 bg-white border border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 border border-neutral-100 bg-white">
                              <img src={storeLogo} alt="Logo Preview" className="h-14 max-w-[220px] object-contain mix-blend-multiply" />
                            </div>
                            <div>
                              <span className="text-[10px] text-emerald-700 font-bold uppercase block">Sawirka Logo-ga Waa Diyaar</span>
                              <p className="text-[10px] text-neutral-500 font-sans">
                                Cabirkiisii waa la weyneeyay (`h-16/h-24`), background-kiina wuu la jaanqaadayaa website-ka!
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStoreLogo('')}
                            className="text-[10px] text-red-600 hover:underline uppercase font-bold shrink-0 cursor-pointer"
                          >
                            Siib Sawirka
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-neutral-500 font-sans">
                          Soo geli sawirka logo-ga dukaankaaga si uu ugu muuqdo hoosta (Footer-ka) website-ka.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Brand Tagline &amp; Atelier Description
                    </label>
                    <input
                      type="text"
                      value={storeTagline}
                      onChange={(e) => setStoreTagline(e.target.value)}
                      placeholder="e.g. Haute Couture, Maroquinerie & Parfumerie Française"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Official Flagship Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 30 Avenue Montaigne / Olaya"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Headquarters City &amp; Country
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Paris & Riyadh"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Concierge Support Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="concierge@lanaluxury.com"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Direct Landline / Telephone
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="Geli lambarka taleefanka..."
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Atelier Operating Hours
                    </label>
                    <input
                      type="text"
                      value={businessHours}
                      onChange={(e) => setBusinessHours(e.target.value)}
                      placeholder="Monday – Sunday: 10:00 AM – 11:00 PM (GMT+3)"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. VIP CONCIERGE & WHATSAPP */}
            {activeSection === 'concierge' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[9.5px] uppercase font-bold tracking-[0.25em] text-neutral-400 block mb-1">
                    SECTION 02
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-serif text-neutral-900 font-normal">
                        VIP Concierge Hotline &amp; WhatsApp Integration
                      </h3>
                      <p className="text-xs text-neutral-500 font-sans mt-1">
                        Halkan waxaad ka xakamayn kartaa WhatsApp-ka: waad shidi kartaa (Add), waadna damin kartaa (Remove) si uu gabi ahaanba uga baxo websayts-ka.
                      </p>
                    </div>

                    {/* Master Switch */}
                    <div className="flex items-center gap-3 bg-white border p-2 px-3 border-neutral-200">
                      <div className="text-right">
                        <span className="block text-[8.5px] uppercase font-bold tracking-wider text-neutral-400">
                          Website Status
                        </span>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${whatsappEnabled && whatsappNumber.trim() ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {whatsappEnabled && whatsappNumber.trim() ? '● ACTIVE (SHIDAN)' : '○ REMOVED (DEMSAN)'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                        className={`px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${
                          whatsappEnabled 
                            ? 'bg-neutral-900 text-white hover:bg-neutral-800' 
                            : 'bg-emerald-800 text-white hover:bg-emerald-900'
                        }`}
                      >
                        {whatsappEnabled ? 'Turn OFF / Demi' : 'Turn ON / Shid'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Banner Indicator */}
                {whatsappEnabled && whatsappNumber.trim() ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[11px] block text-emerald-900">
                        ✓ WhatsApp waa shidan yahay (Active on Website)
                      </span>
                      <p className="text-emerald-700 text-[11px] mt-0.5">
                        Macaamiishu waxay ku arki karaan batoonka WhatsApp-ka Footer-ka, Gaariga, Menu-ga, iyo Badeecadaha.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${cleanWaNumber(whatsappNumber)}?text=${encodeURIComponent(whatsappGreeting)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-800 text-white hover:bg-emerald-900 text-[10px] uppercase font-bold tracking-wider cursor-pointer whitespace-nowrap inline-flex items-center gap-1"
                      >
                        <ExternalLink size={11} />
                        <span>Tijaabi WhatsApp-ka</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setWhatsappEnabled(false)}
                        className="px-3 py-1.5 border border-emerald-700 text-emerald-800 hover:bg-emerald-100 text-[10px] uppercase font-bold tracking-wider cursor-pointer whitespace-nowrap"
                      >
                        Demi (Disable)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold uppercase tracking-wider text-[11px] block text-rose-900">
                        ✕ WhatsApp waa laga saaray websayts-ka (Disabled / Hidden)
                      </span>
                      <p className="text-rose-700 text-[11px] mt-0.5">
                        Wax WhatsApp ah kama muuqdaan websayts-ka (Footer, Menu, Cart, PDP) ilaa aad dib u shido.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWhatsappEnabled(true)}
                      className="px-3 py-1.5 bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-wider cursor-pointer whitespace-nowrap hover:bg-neutral-800"
                    >
                      Dib u Shid (Re-Enable)
                    </button>
                  </div>
                )}

                <div className="space-y-5 text-xs font-sans">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px]">
                        Primary WhatsApp Phone Number (With Country Code)
                      </label>
                      {whatsappNumber.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setWhatsappNumber('');
                            setWhatsappEnabled(false);
                          }}
                          className="text-[10px] text-rose-600 hover:text-rose-800 uppercase font-bold cursor-pointer"
                        >
                          Remove / Tirtir Lambarka
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => {
                          setWhatsappNumber(e.target.value);
                          if (!whatsappEnabled && e.target.value.trim()) setWhatsappEnabled(true);
                        }}
                        placeholder="e.g. +25261XXXXXXX"
                        className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 font-mono text-sm text-neutral-900"
                      />
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 font-mono">
                      Geli lambarka oo wata koodhka dalka (tusaale: +25261XXXXXXX). Haddii aad banaan uga tagto, WhatsApp kama muuqanayo websayts-ka.
                    </p>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Default VIP Greeting Message (Fariinta Hor-u-dhaca ah ee Macmiilka)
                    </label>
                    <textarea
                      rows={3}
                      value={whatsappGreeting}
                      onChange={(e) => setWhatsappGreeting(e.target.value)}
                      placeholder="Fariinta uu macmiilku tooska u arkayo marka uu WhatsApp-ka furo..."
                      className="w-full p-3 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-xs text-neutral-900 font-sans leading-relaxed"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Macmiilku marka uu gujiyo batoonka WhatsApp Concierge, qoraalkan ayaa si toos ah ugu qormaya fariintiisa WhatsApp.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-xs">
                        Floating WhatsApp Concierge Widget
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Muuji batoonka sabaynaya ee geeska hoose ee bog kasta si macmiilku u helo kaalmo degdeg ah.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWhatsappFloatingActive(!whatsappFloatingActive)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        whatsappFloatingActive ? 'bg-neutral-900 justify-end' : 'bg-neutral-200 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. SOCIAL MEDIA CHANNELS */}
            {activeSection === 'social' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[9.5px] uppercase font-bold tracking-[0.25em] text-neutral-400 block mb-1">
                    SECTION 03
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 font-normal">
                    Official Social Channels &amp; Global Footprint
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans mt-1">
                    Ku xir link-yada rasmiga ah ee baraha bulshada ee Maison LANA. <strong>Haddii aad banaan uga tagto ama aad taabato &quot;Remove&quot;, app-kaas gabi ahaanba kama muuqan doono websayts-ka.</strong>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  {/* Instagram */}
                  <div className="space-y-1.5 p-3.5 bg-neutral-50/70 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold uppercase tracking-wider text-neutral-800 text-[10.5px] flex items-center gap-2">
                        <Instagram size={14} className="text-neutral-700" />
                        <span>Instagram URL</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 ${instagram.trim() ? 'bg-emerald-100 text-emerald-850' : 'bg-neutral-200 text-neutral-500'}`}>
                          {instagram.trim() ? '● Active' : '○ Hidden'}
                        </span>
                        {instagram.trim() && (
                          <button
                            type="button"
                            onClick={() => setInstagram('')}
                            className="text-[10px] text-rose-600 hover:text-rose-800 uppercase font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        {instagram.trim() && (
                          <a href={instagram} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-900 flex items-center gap-1 text-[10px]">
                            Test <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <input
                      type="url"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="https://instagram.com/maisonlana"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 focus:outline-none focus:border-neutral-900 text-xs font-mono"
                    />
                  </div>

                  {/* TikTok */}
                  <div className="space-y-1.5 p-3.5 bg-neutral-50/70 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold uppercase tracking-wider text-neutral-800 text-[10.5px] flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-neutral-900">TT</span>
                        <span>TikTok URL</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 ${tiktok.trim() ? 'bg-emerald-100 text-emerald-850' : 'bg-neutral-200 text-neutral-500'}`}>
                          {tiktok.trim() ? '● Active' : '○ Hidden'}
                        </span>
                        {tiktok.trim() && (
                          <button
                            type="button"
                            onClick={() => setTiktok('')}
                            className="text-[10px] text-rose-600 hover:text-rose-800 uppercase font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        {tiktok.trim() && (
                          <a href={tiktok} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-900 flex items-center gap-1 text-[10px]">
                            Test <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <input
                      type="url"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="https://tiktok.com/@maisonlana"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 focus:outline-none focus:border-neutral-900 text-xs font-mono"
                    />
                  </div>

                  {/* Snapchat */}
                  <div className="space-y-1.5 p-3.5 bg-neutral-50/70 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold uppercase tracking-wider text-neutral-800 text-[10.5px] flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] text-neutral-900 border border-neutral-400 px-1">SC</span>
                        <span>Snapchat URL</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 ${snapchat.trim() ? 'bg-emerald-100 text-emerald-850' : 'bg-neutral-200 text-neutral-500'}`}>
                          {snapchat.trim() ? '● Active' : '○ Hidden'}
                        </span>
                        {snapchat.trim() && (
                          <button
                            type="button"
                            onClick={() => setSnapchat('')}
                            className="text-[10px] text-rose-600 hover:text-rose-800 uppercase font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        {snapchat.trim() && (
                          <a href={snapchat.startsWith('http') ? snapchat : `https://snapchat.com/add/${snapchat.replace(/^@+/, '')}`} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-900 flex items-center gap-1 text-[10px]">
                            Test <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={snapchat}
                      onChange={(e) => setSnapchat(e.target.value)}
                      placeholder="https://snapchat.com/add/maisonlana"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 focus:outline-none focus:border-neutral-900 text-xs font-mono"
                    />
                  </div>

                  {/* YouTube */}
                  <div className="space-y-1.5 p-3.5 bg-neutral-50/70 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold uppercase tracking-wider text-neutral-800 text-[10.5px] flex items-center gap-2">
                        <Youtube size={14} className="text-neutral-700" />
                        <span>YouTube URL</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 ${youtube.trim() ? 'bg-emerald-100 text-emerald-850' : 'bg-neutral-200 text-neutral-500'}`}>
                          {youtube.trim() ? '● Active' : '○ Hidden'}
                        </span>
                        {youtube.trim() && (
                          <button
                            type="button"
                            onClick={() => setYoutube('')}
                            className="text-[10px] text-rose-600 hover:text-rose-800 uppercase font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        {youtube.trim() && (
                          <a href={youtube} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-900 flex items-center gap-1 text-[10px]">
                            Test <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <input
                      type="url"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="https://youtube.com/@maisonlana"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 focus:outline-none focus:border-neutral-900 text-xs font-mono"
                    />
                  </div>

                  {/* Facebook */}
                  <div className="space-y-1.5 p-3.5 bg-neutral-50/70 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold uppercase tracking-wider text-neutral-800 text-[10.5px] flex items-center gap-2">
                        <Facebook size={14} className="text-neutral-700" />
                        <span>Facebook URL</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 ${facebook.trim() ? 'bg-emerald-100 text-emerald-850' : 'bg-neutral-200 text-neutral-500'}`}>
                          {facebook.trim() ? '● Active' : '○ Hidden'}
                        </span>
                        {facebook.trim() && (
                          <button
                            type="button"
                            onClick={() => setFacebook('')}
                            className="text-[10px] text-rose-600 hover:text-rose-800 uppercase font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        {facebook.trim() && (
                          <a href={facebook} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-900 flex items-center gap-1 text-[10px]">
                            Test <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <input
                      type="url"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="https://facebook.com/maisonlana"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 focus:outline-none focus:border-neutral-900 text-xs font-mono"
                    />
                  </div>

                  {/* X / Twitter */}
                  <div className="space-y-1.5 p-3.5 bg-neutral-50/70 border border-neutral-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold uppercase tracking-wider text-neutral-800 text-[10.5px] flex items-center gap-2">
                        <Twitter size={14} className="text-neutral-700" />
                        <span>X / Twitter URL</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 ${twitter.trim() ? 'bg-emerald-100 text-emerald-850' : 'bg-neutral-200 text-neutral-500'}`}>
                          {twitter.trim() ? '● Active' : '○ Hidden'}
                        </span>
                        {twitter.trim() && (
                          <button
                            type="button"
                            onClick={() => setTwitter('')}
                            className="text-[10px] text-rose-600 hover:text-rose-800 uppercase font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                        {twitter.trim() && (
                          <a href={twitter} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-neutral-900 flex items-center gap-1 text-[10px]">
                            Test <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <input
                      type="url"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="https://x.com/maisonlana"
                      className="w-full px-3 py-2 bg-white border border-neutral-200 focus:outline-none focus:border-neutral-900 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. PRIVILÈGE PROMO CODES */}
            {activeSection === 'promos' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[9.5px] uppercase font-bold tracking-[0.25em] text-neutral-400 block mb-1">
                    SECTION 04
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 font-normal">
                    Privilège &amp; Promotional Discount Codes
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans mt-1">
                    U samee koodhadh qiimo dhimis ah macaamiishaada gaarka ah (VIP clients). Macaamiishu waxay koodhka ku qori karaan bogga Checkout-ka si ay u helaan dhimista.
                  </p>
                </div>

                {/* Creator Form */}
                <form onSubmit={handleAddPromoCode} className="p-4 sm:p-5 bg-neutral-50 border border-neutral-200 space-y-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 block">
                    Create New Luxury Promo Code
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">
                        Promo Code *
                      </label>
                      <input
                        type="text"
                        value={newPromoCode}
                        onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                        placeholder="e.g. VIP2026, DIOR15"
                        required
                        className="w-full px-3 py-2 bg-white border border-neutral-300 focus:border-neutral-900 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">
                        Discount Percentage (%) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={newPromoPercent}
                        onChange={(e) => setNewPromoPercent(e.target.value)}
                        placeholder="10"
                        required
                        className="w-full px-3 py-2 bg-white border border-neutral-300 focus:border-neutral-900 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-neutral-700 mb-1">
                        Min Spend Required ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newPromoMinSpend}
                        onChange={(e) => setNewPromoMinSpend(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white border border-neutral-300 focus:border-neutral-900 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {promoMsg ? (
                      <span className="text-xs text-neutral-800 font-medium">{promoMsg}</span>
                    ) : <span />}
                    <button
                      type="submit"
                      disabled={promoLoading}
                      className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs uppercase font-bold tracking-widest flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Create Code</span>
                    </button>
                  </div>
                </form>

                {/* Active Codes Ledger */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-neutral-500 pb-1">
                    <span className="uppercase font-bold tracking-wider text-[10px]">Active Privilège Codes ({promoCodes.length})</span>
                    <button onClick={fetchPromoCodes} className="hover:text-black flex items-center gap-1 cursor-pointer">
                      <RefreshCw size={11} className={promoLoading ? 'animate-spin' : ''} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {promoCodes.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400 bg-neutral-50 border border-neutral-200">
                      Hadda ma jiro koodh firfircoon. Isticmaal foomka kore si aad u abuurto koodhkii ugu horreeyey.
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 border border-neutral-200 bg-white">
                      {promoCodes.map((pc: any, idx: number) => (
                        <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-sm text-neutral-900 tracking-wider">
                              {pc.code}
                            </span>
                            <span className="text-[11px] text-neutral-600 font-sans">
                              {pc.discount_percent || pc.discountPercent}% Off
                            </span>
                            {Number(pc.min_order_amount || pc.minOrderAmount) > 0 && (
                              <span className="text-[10px] text-neutral-400 font-mono">
                                Min: ${pc.min_order_amount || pc.minOrderAmount}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(pc.code)}
                              className="text-neutral-400 hover:text-neutral-900 transition-colors cursor-pointer text-xs flex items-center gap-1"
                              title="Copy code"
                            >
                              {copiedCode === pc.code ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                              <span className="text-[10px] uppercase font-mono">{copiedCode === pc.code ? 'Copied' : 'Copy'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePromoCode(pc.code)}
                              className="text-neutral-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                              title="Delete code"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. DELIVERY & POLICIES */}
            {activeSection === 'delivery' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[9.5px] uppercase font-bold tracking-[0.25em] text-neutral-400 block mb-1">
                    SECTION 05
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 font-normal">
                    White-Glove Delivery &amp; Luxury Policies
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans mt-1">
                    Qeex heerarka keenista bilaashka ah ee White-Glove Courier, hadiyadaha xariirta ah ee Signature Packaging, iyo muddada celinta alaabta.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-sans">
                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Complimentary Delivery Minimum Spend ($)
                    </label>
                    <input
                      type="number"
                      value={freeShippingThreshold}
                      onChange={(e) => setFreeShippingThreshold(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-mono text-xs"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Dalabaadka ka sarreeya cadadkan waxay helayaan keenis bilaash ah oo gaar ah.
                    </p>
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Return &amp; Exchange Window (Days)
                    </label>
                    <input
                      type="number"
                      value={returnWindowDays}
                      onChange={(e) => setReturnWindowDays(Number(e.target.value) || 14)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-mono text-xs"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Muddada macmiilku ku beddelan karo ama ku soo celin karo alaabta (tusaale: 14 ama 30 maalmood).
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Designated Luxury Courier Service Name
                    </label>
                    <input
                      type="text"
                      value={courierPartner}
                      onChange={(e) => setCourierPartner(e.target.value)}
                      placeholder="e.g. White-Glove VIP Courier & DHL Express"
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2 pt-3 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-xs flex items-center gap-2">
                        <Gift size={14} className="text-neutral-700" />
                        <span>Maison Signature Gift Wrapping (Baakaynta Xariirta &amp; Shaabadda)</span>
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Sanduuqa Maison LANA oo lagu xiray xariir dahab ah iyo kaarka hambalyada oo gacanta lagu qoray.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSignatureGiftPackaging(!signatureGiftPackaging)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                        signatureGiftPackaging ? 'bg-neutral-900 justify-end' : 'bg-neutral-200 justify-start'
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-xs" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. CAMPAIGN HEADLINES */}
            {activeSection === 'homepage' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[9.5px] uppercase font-bold tracking-[0.25em] text-neutral-400 block mb-1">
                    SECTION 06
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 font-normal">
                    Editorial Headlines &amp; Hero Campaigns
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans mt-1">
                    Bedel ciwaannada waaweyn ee labada qaybood ee ugu muhiimsan bogga hore (Campaign I: Fashion &amp; Campaign II: Haute Parfumerie).
                  </p>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Campaign I Headline (Fashion &amp; Maroquinerie)
                    </label>
                    <input
                      type="text"
                      value={heroFashionTitle}
                      onChange={(e) => setHeroFashionTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-700 font-bold uppercase tracking-wider text-[10px] mb-1.5">
                      Campaign II Headline (Fragrance &amp; Beauty)
                    </label>
                    <input
                      type="text"
                      value={heroBeautyTitle}
                      onChange={(e) => setHeroBeautyTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 text-neutral-900 font-medium text-xs"
                    />
                  </div>

                  {onNavigateTab && (
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <p className="text-[11px] text-neutral-500">
                        Ma doonaysaa inaad sawirrada iyo fiidiyowyada beddesho?
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigateTab('media')}
                        className="px-4 py-2 border border-neutral-300 hover:border-black text-[10px] uppercase font-bold tracking-widest text-neutral-900 transition-colors cursor-pointer"
                      >
                        Open Media Playground
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 7. MASTER SECURITY */}
            {activeSection === 'security' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <span className="text-[9.5px] uppercase font-bold tracking-[0.25em] text-neutral-400 block mb-1">
                    SECTION 07
                  </span>
                  <h3 className="text-xl font-serif text-neutral-900 font-normal">
                    Master Administrator &amp; Session Credentials
                  </h3>
                  <p className="text-xs text-neutral-500 font-sans mt-1">
                    Hubi xaaladda amniga ee maamulka, email-ka rasmiga ah ee ogolaanshaha haysta, iyo xogta kalfadhiga.
                  </p>
                </div>

                <div className="space-y-4 text-xs font-sans">
                  <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block">
                      AUTHORIZED MASTER ACCOUNT
                    </span>
                    <p className="font-mono text-sm font-bold text-neutral-900">
                      {adminEmail}
                    </p>
                    <div className="flex items-center gap-2 text-emerald-700 text-[11px] pt-1">
                      <ShieldCheck size={14} />
                      <span>Maison Administrative Security Active &amp; Verified</span>
                    </div>
                  </div>

                  <div className="p-4 border border-neutral-200 space-y-2">
                    <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
                      Access Protocols
                    </h4>
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Waxaad ku soo gashay fure sir ah oo heer sare ah. Kalfadhigan waxa si ammaan ah loogu xafiday kaydkaaga gudaha (session token). Marka aad dhameyso hawshaada, riix badhanka &quot;Exit Atelier&quot; ee geeska sare si aad u xirto xarunta maamulka.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right Live Simulation Card */}
          <div className="xl:col-span-4 bg-[#FAF9F6] border border-neutral-200 p-6 space-y-6 shadow-xs sticky top-4">
            <div className="border-b border-neutral-200 pb-3">
              <span className="text-[9.5px] uppercase font-bold tracking-[0.3em] text-neutral-400 block">
                LIVE BOUTIQUE SIMULATION
              </span>
              <h4 className="text-lg font-serif text-neutral-900 font-normal mt-0.5">
                Client Experience Preview
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Sida macaamiishu u arki doonaan xogta aad halkan ku kaydiso.
              </p>
            </div>

            {/* Preview Box 1: VIP Concierge Card */}
            <div className="bg-white border border-neutral-200 p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-neutral-400">
                <span>VIP WHATSAPP CONCIERGE</span>
                <span className={whatsappFloatingActive ? 'text-emerald-700' : 'text-neutral-400'}>
                  {whatsappFloatingActive ? 'Active' : 'Hidden'}
                </span>
              </div>
              <div className="space-y-1">
                <p className="font-mono font-bold text-xs text-neutral-900">
                  {whatsappNumber || 'No number set'}
                </p>
                <p className="text-[11px] text-neutral-500 font-sans italic line-clamp-2">
                  &ldquo;{whatsappGreeting}&rdquo;
                </p>
              </div>
              <a
                href={testWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] uppercase font-bold tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
              >
                <MessageSquare size={12} />
                <span>Test Live WhatsApp</span>
                <ExternalLink size={10} />
              </a>
            </div>

            {/* Preview Box 2: Footer & Contact Overview */}
            <div className="bg-white border border-neutral-200 p-4 space-y-2.5 text-xs shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block">
                FOOTER DIRECTORY
              </span>
              <div className="space-y-1 text-[11px] text-neutral-600">
                <p className="font-bold text-neutral-900">{storeName}</p>
                <p>{address}, {city}</p>
                <p className="font-mono text-[10px]">{contactPhone}</p>
                <p className="font-mono text-[10px]">{contactEmail}</p>
              </div>
              <div className="pt-2 border-t border-neutral-100 flex items-center gap-2 flex-wrap text-neutral-500">
                {instagram && <span className="font-bold text-[9px] uppercase">IG</span>}
                {tiktok && <span className="font-bold text-[9px] uppercase">TT</span>}
                {snapchat && <span className="font-bold text-[9px] uppercase">SC</span>}
                {youtube && <span className="font-bold text-[9px] uppercase">YT</span>}
                {facebook && <span className="font-bold text-[9px] uppercase">FB</span>}
                {twitter && <span className="font-bold text-[9px] uppercase">X</span>}
              </div>
            </div>

            {/* Preview Box 3: Delivery Guarantee */}
            <div className="bg-white border border-neutral-200 p-4 space-y-1.5 text-xs shadow-xs">
              <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 block">
                DELIVERY POLICY
              </span>
              <p className="font-semibold text-neutral-900 text-[11px]">
                Complimentary White-Glove above ${freeShippingThreshold}
              </p>
              <p className="text-[11px] text-neutral-500">
                {returnWindowDays}-Day Concierge Return Window
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
