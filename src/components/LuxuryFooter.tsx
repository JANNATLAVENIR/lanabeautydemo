import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Check, Shield, Globe, ChevronDown } from 'lucide-react';
import { ActiveView, SocialLinksSettings, StoreContactSettings } from '../types';
import { useI18n, Language } from '../i18n';

export interface LuxuryFooterProps {
  onOpenTracker: () => void;
  onOpenAdmin: () => void;
  onSelectCategory: (category: string) => void;
  onNavigateToView: (view: ActiveView, extra?: any) => void;
  onOpenCountrySelector: () => void;
  onOpenAccessibility: () => void;
  onOpenLegalPolicy?: (tab?: 'shipping' | 'returns' | 'authenticity' | 'privacy' | 'terms') => void;
  onOpenFAQ?: () => void;
  onOpenConcierge?: () => void;
  selectedCountryName?: string;
  highContrast?: boolean;
  onToggleHighContrast?: () => void;
  onSubscribeEmail?: (email: string) => void;
  socialLinks?: SocialLinksSettings;
  contactInfo?: StoreContactSettings;
}

export const LuxuryFooter: React.FC<LuxuryFooterProps> = ({
  onOpenTracker,
  onOpenAdmin,
  onSelectCategory,
  onNavigateToView,
  onOpenCountrySelector,
  onOpenAccessibility,
  onOpenLegalPolicy,
  onOpenFAQ,
  onOpenConcierge,
  selectedCountryName = 'International',
  highContrast = false,
  onToggleHighContrast,
  onSubscribeEmail,
  socialLinks: initialSocialLinks,
  contactInfo: initialContactInfo
}) => {
  const { language, setLanguage, t } = useI18n();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [dynamicSocial, setDynamicSocial] = useState<SocialLinksSettings | undefined>(initialSocialLinks);
  const [dynamicContact, setDynamicContact] = useState<StoreContactSettings | undefined>(initialContactInfo);

  useEffect(() => {
    // Load initial from cache if not provided
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.socialLinks && !dynamicSocial) setDynamicSocial(parsed.socialLinks);
        if (parsed.contactInfo && !dynamicContact) setDynamicContact(parsed.contactInfo);
      }
    } catch {}

    const handleSettingsUpdated = (e: any) => {
      const detail = e.detail;
      if (detail?.socialLinks) setDynamicSocial(detail.socialLinks);
      if (detail?.contactInfo) setDynamicContact(detail.contactInfo);
    };

    window.addEventListener('lana_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('lana_settings_updated', handleSettingsUpdated);
  }, []);

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('lana_client_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem('lana_client_session');
        setCurrentUser(saved ? JSON.parse(saved) : null);
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const handleTouchStart = () => {
    isLongPressRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onOpenAdmin();
    }, 5000);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressRef.current = false;
      return;
    }
    onNavigateToView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEmailConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const emailVal = email.trim();
    if (!emailVal) return;
    if (onSubscribeEmail) {
      onSubscribeEmail(emailVal);
    }
    setSubscribed(true);
    setTimeout(() => {
      setEmail('');
      setSubscribed(false);
    }, 4000);
  };

  const currentLanguageLabel = 
    language === 'so' ? 'Af-Soomaali' :
    language === 'ar' ? 'العربية' : 'English';

  const availableLanguages: { code: Language; name: string; nativeName: string; flag: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'so', name: 'Soomaali', nativeName: 'Af-Soomaali', flag: '🇸🇴' },
    { code: 'ar', name: 'العربية', nativeName: 'العربية', flag: '🇸🇦' },
  ];

  return (
    <footer className="w-full bg-white text-neutral-900 font-sans border-t border-neutral-200 select-none">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 md:px-12 lg:px-16 pt-12 pb-16 space-y-12">
        {/* 1. NEWSLETTER & ACCESSIBILITY HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 pb-8">
          <div className="space-y-4 max-w-md">
            <h3 className="text-lg font-serif text-neutral-900 tracking-wide">
              {t('Sign up for exclusive previews and private sales')}
            </h3>

            {currentUser ? (
              <div className="p-4 bg-neutral-50 border border-neutral-100 rounded-none space-y-3">
                <p className="text-xs text-neutral-600 font-light">
                  {t('Welcome back')}, <span className="font-medium text-neutral-900">{currentUser.name || currentUser.email}</span>!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onNavigateToView('account')}
                    className="flex-1 h-11 bg-[#2B2B2B] hover:bg-black text-white text-xs font-medium uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center"
                  >
                    {t('My Account')}
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('lana_client_session');
                      setCurrentUser(null);
                      window.dispatchEvent(new Event('storage'));
                    }}
                    className="px-4 h-11 border border-neutral-300 hover:border-neutral-800 text-neutral-700 text-xs font-medium uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center"
                  >
                    {t('Sign Out')}
                  </button>
                </div>
              </div>
            ) : subscribed ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                {t('Thank you for subscribing')}
              </div>
            ) : (
              <form onSubmit={handleEmailConfirm} className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('Enter your email address')}
                  className="flex-1 h-11 px-4 bg-white border border-neutral-300 rounded-none text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:border-neutral-900 transition-colors"
                  aria-label="Email address"
                />

                <button
                  type="submit"
                  className="h-11 px-8 bg-[#2B2B2B] hover:bg-black text-white text-sm font-medium rounded-none transition-colors flex items-center justify-center cursor-pointer uppercase tracking-wider"
                >
                  {t('Subscribe')}
                </button>
              </form>
            )}
          </div>

          {/* Accessibility toggle */}
          <div className="flex flex-col items-start gap-2 self-start">
            <span className="text-xs text-neutral-400 uppercase tracking-widest font-medium">
              {t('Accessibility')}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-600 font-light">
                {t('High Contrast')}
              </span>
              <button
                onClick={onToggleHighContrast}
                type="button"
                role="switch"
                aria-checked={highContrast}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  highContrast ? 'bg-neutral-900' : 'bg-neutral-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    highContrast ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 2. FOUR COLUMNS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-10 lg:gap-16 pt-10 border-t border-neutral-200">
          
          {/* COLUMN 1: LANA BOUTIQUES / DEPARTMENTS */}
          <div className="space-y-4">
            <h4 className="text-sm font-serif font-bold text-neutral-900 tracking-wide uppercase">
              {t('LANA')} {t('Collections')}
            </h4>
            <div className="space-y-2.5 text-[13px] text-neutral-600 font-light flex flex-col items-start">
              <button onClick={() => { onSelectCategory('ALL'); onNavigateToView('catalog', { category: 'ALL', department: 'FASHION' }); }} className="hover:text-black hover:underline transition-colors cursor-pointer text-left">
                {t('Fashion')}
              </button>
              <button onClick={() => { onSelectCategory('ALL'); onNavigateToView('catalog', { category: 'ALL', department: 'BEAUTY' }); }} className="hover:text-black hover:underline transition-colors cursor-pointer text-left">
                {t('Beauty')}
              </button>
              <button onClick={() => { onSelectCategory('SKINCARE'); onNavigateToView('catalog'); }} className="hover:text-black hover:underline transition-colors cursor-pointer text-left">
                {t('Skincare')}
              </button>
              <button onClick={() => { onSelectCategory('BODYCARE'); onNavigateToView('catalog'); }} className="hover:text-black hover:underline transition-colors cursor-pointer text-left">
                {t('Bodycare')}
              </button>
              <button onClick={() => { onSelectCategory('ACCESSORIES'); onNavigateToView('catalog'); }} className="hover:text-black hover:underline transition-colors cursor-pointer text-left">
                {t('Accessories')}
              </button>
              <button onClick={() => { onSelectCategory('ALL'); onNavigateToView('catalog'); }} className="hover:text-black hover:underline transition-colors cursor-pointer text-left">
                {t('New Arrivals')}
              </button>
            </div>
          </div>

          {/* COLUMN 2: CLIENT SERVICES */}
          <div className="space-y-4">
            <h4 className="text-sm font-serif font-bold text-neutral-900 tracking-wide uppercase">
              {t('Customer Care')}
            </h4>
            <div className="space-y-2.5 text-[13px] text-neutral-600 font-light flex flex-col items-start w-full">
              <button 
                onClick={() => onOpenConcierge ? onOpenConcierge() : onNavigateToView('stories')} 
                className="hover:text-black hover:underline transition-colors cursor-pointer text-left flex items-center gap-1 w-full justify-between pr-2 border-b border-neutral-100 pb-1.5 md:border-none md:pb-0"
              >
                <span>{t('Contact VIP Concierge')}</span>
                <ChevronRight size={12} className="text-neutral-400 rotate-90" />
              </button>
              <button 
                onClick={() => onOpenLegalPolicy ? onOpenLegalPolicy('shipping') : onNavigateToView('stories')} 
                className="hover:text-black hover:underline transition-colors cursor-pointer text-left flex items-center gap-1 w-full justify-between pr-2 border-b border-neutral-100 pb-1.5 md:border-none md:pb-0"
              >
                <span>{t('Shipping & Returns')}</span>
                <ChevronRight size={12} className="text-neutral-400 rotate-90" />
              </button>
              <button 
                onClick={() => onOpenFAQ ? onOpenFAQ() : onNavigateToView('stories')} 
                className="hover:text-black hover:underline transition-colors cursor-pointer text-left flex items-center gap-1 w-full justify-between pr-2 border-b border-neutral-100 pb-1.5 md:border-none md:pb-0"
              >
                <span>{t('FAQs')}</span>
                <ChevronRight size={12} className="text-neutral-400 rotate-90" />
              </button>
              <button onClick={onOpenTracker} className="hover:text-black hover:underline transition-colors cursor-pointer text-left pt-1 font-medium text-neutral-900">
                {t('Track Order Status')}
              </button>
            </div>
          </div>

          {/* COLUMN 3: THE HOUSE OF LANA */}
          <div className="space-y-4">
            <h4 className="text-sm font-serif font-bold text-neutral-900 tracking-wide uppercase">
              {t('The Maison')}
            </h4>
            <div className="space-y-2.5 text-[13px] text-neutral-600 font-light flex flex-col items-start">
              <button onClick={() => onNavigateToView('stories')} className="hover:text-black hover:underline transition-colors cursor-pointer text-left">
                {t('Details & Heritage')}
              </button>
              <button 
                onClick={() => onOpenLegalPolicy ? onOpenLegalPolicy('authenticity') : onNavigateToView('stories')} 
                className="hover:text-black hover:underline transition-colors cursor-pointer text-left"
              >
                {t('Authenticity Guaranteed')}
              </button>
              <button 
                onClick={() => onOpenConcierge ? onOpenConcierge() : onNavigateToView('stories')} 
                className="hover:text-black hover:underline transition-colors cursor-pointer text-left"
              >
                {t('VIP WhatsApp Concierge')}
              </button>
            </div>
          </div>

          {/* COLUMN 4: LEGAL NOTICES */}
          <div className="space-y-4">
            <h4 className="text-sm font-serif font-bold text-neutral-900 tracking-wide uppercase">
              {t('Legal & Privacy')}
            </h4>
            <div className="space-y-2.5 text-[13px] text-neutral-600 font-light flex flex-col items-start w-full">
              <button 
                onClick={() => onOpenLegalPolicy ? onOpenLegalPolicy('privacy') : onOpenAccessibility()} 
                className="hover:text-black hover:underline transition-colors cursor-pointer text-left flex items-center gap-1 w-full justify-between pr-2 border-b border-neutral-100 pb-1.5 md:border-none md:pb-0"
              >
                <span>{t('Privacy Policy')}</span>
                <ChevronRight size={12} className="text-neutral-400 rotate-90" />
              </button>
              <button 
                onClick={() => onOpenLegalPolicy ? onOpenLegalPolicy('terms') : onOpenAccessibility()} 
                className="hover:text-black hover:underline transition-colors cursor-pointer text-left flex items-center gap-1 w-full justify-between pr-2 border-b border-neutral-100 pb-1.5 md:border-none md:pb-0"
              >
                <span>{t('Terms & Conditions')}</span>
                <ChevronRight size={12} className="text-neutral-400 rotate-90" />
              </button>
              <button onClick={onOpenAccessibility} className="hover:text-black hover:underline transition-colors cursor-pointer text-left pt-1">
                {t('Accessibility Settings')}
              </button>
            </div>
          </div>

        </div>

        {/* 3. BOTTOM METADATA SECTION: Country, Region & Language */}
        <div className="pt-10 border-t border-neutral-200 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Country / Region & Interactive Language Switcher */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
            <button
              id="footer-country-btn"
              type="button"
              onClick={onOpenCountrySelector}
              className="flex items-center gap-2 group cursor-pointer text-left py-1 hover:text-black"
            >
              <Globe size={15} className="text-neutral-500 group-hover:text-black transition-colors" />
              <span className="text-xs text-neutral-400 font-light">{t('Country / Region:')}</span>
              <span className="text-[13px] text-neutral-800 font-medium group-hover:text-black group-hover:underline">
                {selectedCountryName}
              </span>
            </button>

            {/* Interactive 3-Language Dropdown Selector */}
            <div className="relative inline-flex items-center" ref={langDropdownRef}>
              <button
                id="footer-language-dropdown-btn"
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                aria-expanded={isLangDropdownOpen}
                aria-haspopup="listbox"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-400 text-neutral-900 text-xs font-medium tracking-wide transition-all cursor-pointer rounded-none"
                title={t('Select Language')}
              >
                <span>({currentLanguageLabel})</span>
                <ChevronDown
                  size={12}
                  className={`text-neutral-500 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu with 3 Languages */}
              {isLangDropdownOpen && (
                <div
                  role="listbox"
                  className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-neutral-200 shadow-xl py-1 z-40"
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-neutral-400 font-semibold border-b border-neutral-100">
                    {t('Select Language')}
                  </div>
                  {availableLanguages.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-semibold'
                            : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-sm">{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        {isSelected && <Check size={13} className="text-white" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Social Links from Admin Portal */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-neutral-600 font-light">
            {dynamicSocial?.instagram && (
              <a href={dynamicSocial.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">Instagram</a>
            )}
            {dynamicSocial?.tiktok && (
              <a href={dynamicSocial.tiktok} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">TikTok</a>
            )}
            {/* WhatsApp Social Link */}
            <a 
              href={dynamicSocial?.whatsapp || (dynamicContact?.whatsappNumber ? `https://wa.me/${dynamicContact.whatsappNumber.replace(/[^0-9]/g, '')}` : (dynamicContact?.contactPhone ? `https://wa.me/${dynamicContact.contactPhone.replace(/[^0-9]/g, '')}` : 'https://wa.me/252611234567'))} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-neutral-900 transition-colors"
            >
              WhatsApp
            </a>
            {dynamicSocial?.snapchat && dynamicSocial.snapchat.trim() !== '' && (
              <a 
                href={dynamicSocial.snapchat.startsWith('http') ? dynamicSocial.snapchat : `https://snapchat.com/add/${dynamicSocial.snapchat.replace(/^@+/, '')}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-neutral-900 transition-colors"
              >
                Snapchat
              </a>
            )}
            {dynamicSocial?.facebook && (
              <a href={dynamicSocial.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">Facebook</a>
            )}
            {dynamicSocial?.pinterest && (
              <a href={dynamicSocial.pinterest} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">Pinterest</a>
            )}
            {dynamicSocial?.twitter && (
              <a href={dynamicSocial.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">X (Twitter)</a>
            )}
            {dynamicSocial?.youtube && (
              <a href={dynamicSocial.youtube} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">YouTube</a>
            )}
            {!dynamicSocial && (
              <>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">Instagram</a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">TikTok</a>
                <a href="https://wa.me/252611234567" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">WhatsApp</a>
              </>
            )}
          </div>
        </div>

        {/* 4. LOGO & COPYRIGHT */}
        <div className="pt-8 pb-4 text-center flex flex-col items-center justify-center gap-3 border-t border-neutral-100">
          <button
            onClick={handleLogoClick}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
            className="font-serif text-[30px] text-neutral-900 font-light tracking-[0.25em] hover:opacity-75 transition-opacity cursor-pointer select-none py-1"
            title="LANA"
          >
            LANA
          </button>

          <div className="text-[10px] sm:text-[11px] text-neutral-400 font-sans tracking-wider select-none flex flex-col items-center gap-2">
            <span>{t('© 2026 LANA. All rights reserved.')}</span>
            
            {/* Ultra-luxury 'Crafted & Powered by Jannat L'avenir' credit line - Mobile Optimized */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 text-[8.5px] sm:text-[9.5px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-neutral-400 font-sans text-center">
              <span className="hidden sm:inline-block w-5 h-[0.5px] bg-neutral-200" />
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-neutral-400 font-light">Crafted &amp; Powered by</span>
                <span className="font-serif text-[10.5px] sm:text-[11.5px] font-medium tracking-[0.18em] sm:tracking-[0.22em] text-neutral-900">
                  JANNAT L'AVENIR
                </span>
              </div>
              <span className="hidden sm:inline-block w-5 h-[0.5px] bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
