import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Globe, Languages } from 'lucide-react';
import { useI18n, Language } from '../i18n';

export interface CountrySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCountry: string;
  onSelectCountry: (country: string, currency: string) => void;
}

export const COUNTRIES_LIST = [
  { code: 'SO', name: 'Somalia (Soomaaliya)', language: 'Af-Soomaali / Arabic', currency: 'USD ($)', flag: '🇸🇴', defaultLang: 'so' as Language },
  { code: 'DJ', name: 'Djibouti (Jabuuti)', language: 'Af-Soomaali / Français', currency: 'USD ($)', flag: '🇩🇯', defaultLang: 'so' as Language },
  { code: 'SA', name: 'Saudi Arabia (المملكة العربية السعودية)', language: 'العربية / English', currency: 'SAR', flag: '🇸🇦', defaultLang: 'ar' as Language },
  { code: 'AE', name: 'United Arab Emirates (الإمارات)', language: 'العربية / English', currency: 'AED', flag: '🇦🇪', defaultLang: 'ar' as Language },
  { code: 'QA', name: 'Qatar (قطر)', language: 'العربية / English', currency: 'QAR', flag: '🇶🇦', defaultLang: 'ar' as Language },
  { code: 'KW', name: 'Kuwait (الكويت)', language: 'العربية / English', currency: 'KWD', flag: '🇰🇼', defaultLang: 'ar' as Language },
  { code: 'INT', name: 'International', language: 'English', currency: 'USD ($)', flag: '🌍', defaultLang: 'en' as Language },
  { code: 'US', name: 'United States', language: 'English', currency: 'USD ($)', flag: '🇺🇸', defaultLang: 'en' as Language },
  { code: 'GB', name: 'United Kingdom', language: 'English', currency: 'GBP (£)', flag: '🇬🇧', defaultLang: 'en' as Language },
  { code: 'FR', name: 'France', language: 'Français', currency: 'EUR (€)', flag: '🇫🇷', defaultLang: 'en' as Language },
  { code: 'IT', name: 'Italia', language: 'Italiano', currency: 'EUR (€)', flag: '🇮🇹', defaultLang: 'en' as Language },
  { code: 'TR', name: 'Turkey (Türkiye)', language: 'Türkçe / English', currency: 'USD ($)', flag: '🇹🇷', defaultLang: 'en' as Language }
];

export const CountrySelectorModal: React.FC<CountrySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCountry,
  onSelectCountry
}) => {
  const { language, setLanguage, t, isRtl } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = COUNTRIES_LIST.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.currency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const languagesList: { code: Language; name: string; nativeName: string; flag: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English (US/UK)', flag: '🇬🇧' },
    { code: 'so', name: 'Somali', nativeName: 'Af-Soomaali', flag: '🇸🇴' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية الفصحى', flag: '🇸🇦' }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="w-full sm:max-w-xl bg-white text-neutral-900 flex flex-col max-h-[90vh] font-sans shadow-2xl rounded-t-2xl sm:rounded-none overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe size={18} className="text-neutral-700" />
              <h3 className="font-serif text-lg sm:text-xl tracking-wider text-neutral-900">
                {t('Country, Region & Language')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-black transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5 sm:p-6 border-b border-neutral-100 bg-neutral-50/50">
            {/* 1. Language Picker Section */}
            <div className="mb-2">
              <div className="flex items-center gap-2 mb-3">
                <Languages size={15} className="text-neutral-500" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-neutral-800">
                  {t('Select Language')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {languagesList.map((lang) => {
                  const isActive = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`p-3 border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'border-neutral-950 bg-white shadow-sm ring-1 ring-neutral-950'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1.5">
                        <span className="text-lg">{lang.flag}</span>
                        {isActive && <Check size={14} className="text-neutral-950" />}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-neutral-900 block font-sans">
                          {lang.name}
                        </span>
                        <span className="text-[10px] text-neutral-500 block truncate">
                          {lang.nativeName}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Search bar for Countries */}
          <div className="p-4 border-b border-neutral-100 bg-neutral-50">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('Search region or currency...')}
              className="w-full py-2.5 px-3 bg-white border border-neutral-200 text-xs tracking-wider uppercase font-sans placeholder-neutral-400 focus:outline-none focus:border-black"
            />
          </div>

          {/* Country List */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-neutral-100">
            <div className="px-2 py-1.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400">
              {t('Select Country')}
            </div>
            {filtered.map((item) => {
              const isSelected = selectedCountry === item.name || (selectedCountry === 'International' && item.code === 'INT');
              return (
                <button
                  key={item.code}
                  onClick={() => {
                    onSelectCountry(item.name, item.currency);
                    // Automatically adopt country's default language if user hasn't customized or prefers
                    if (item.defaultLang && language === 'en' && item.defaultLang !== 'en') {
                      setLanguage(item.defaultLang);
                    }
                    onClose();
                  }}
                  className={`w-full py-3 px-3 flex items-center justify-between text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.flag}</span>
                    <div>
                      <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900 block">
                        {item.name}
                      </span>
                      <span className="text-[10.5px] text-neutral-400 font-light">
                        {item.language} · {item.currency}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-black" />}
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-between items-center">
            <span className="text-[11px] text-neutral-500">
              {t('Language')}: <strong className="text-neutral-900 uppercase">{language}</strong>
            </span>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-neutral-900 text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {t('Done')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
