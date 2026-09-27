import React, { useState, useEffect } from 'react';
import { MessageCircle, X, ShieldCheck, Sparkles, Send, Clock, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useI18n } from '../i18n';

interface WhatsAppConciergeProps {
  currentProduct?: Product | null;
  phoneNumber?: string;
  storeName?: string;
}

export const WhatsAppConcierge: React.FC<WhatsAppConciergeProps> = ({
  currentProduct,
  phoneNumber: propPhone,
  storeName: propStoreName
}) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<'product' | 'order' | 'general' | 'vip'>('general');
  const [customNote, setCustomNote] = useState('');
  
  const [activePhone, setActivePhone] = useState(propPhone || '+966501234567');
  const [activeStoreName, setActiveStoreName] = useState(propStoreName || 'Maison LANA');
  const [activeGreeting, setActiveGreeting] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.whatsappNumber && !propPhone) setActivePhone(parsed.whatsappNumber);
        if (parsed.whatsappGreeting) setActiveGreeting(parsed.whatsappGreeting);
        if (parsed.whatsappFloatingActive !== undefined) setIsVisible(parsed.whatsappFloatingActive);
        if (parsed.contactInfo?.storeName && !propStoreName) setActiveStoreName(parsed.contactInfo.storeName);
        else if (parsed.contactInfo?.whatsappNumber && !propPhone) setActivePhone(parsed.contactInfo.whatsappNumber);
      }
    } catch {}

    const handleSettingsUpdated = (e: any) => {
      const detail = e.detail;
      if (detail?.whatsappNumber && !propPhone) setActivePhone(detail.whatsappNumber);
      if (detail?.whatsappGreeting) setActiveGreeting(detail.whatsappGreeting);
      if (detail?.whatsappFloatingActive !== undefined) setIsVisible(detail.whatsappFloatingActive);
      if (detail?.contactInfo?.storeName && !propStoreName) setActiveStoreName(detail.contactInfo.storeName);
    };

    window.addEventListener('lana_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('lana_settings_updated', handleSettingsUpdated);
  }, [propPhone, propStoreName]);

  if (!isVisible) return null;

  const cleanPhone = (activePhone || '966501234567').replace(/[^0-9]/g, '');

  const generateWhatsAppLink = () => {
    let message = '';
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    if (currentProduct && selectedTopic === 'product') {
      message = `Hello ${activeStoreName} VIP Concierge,\n\nI am interested in acquiring the following piece:\n*${currentProduct.name}* (Price: $${currentProduct.price.toLocaleString()})\n\nLink: ${currentUrl}\n${customNote ? `\nMy note: "${customNote}"` : ''}\n\nPlease advise on availability and bespoke private consultation. Thank you.`;
    } else if (selectedTopic === 'order') {
      message = `Hello ${activeStoreName} Private Client Support,\n\nI would like assistance with an existing order / luxury delivery tracking.\n${customNote ? `\nOrder Details: "${customNote}"` : ''}\n\nThank you.`;
    } else if (selectedTopic === 'vip') {
      message = `Hello ${activeStoreName} Concierge,\n\nI would like to request private VIP styling and personal shopper assistance.\n${customNote ? `\nPreferences: "${customNote}"` : ''}`;
    } else {
      message = activeGreeting 
        ? `${activeGreeting}\n\n${customNote ? `Note: "${customNote}"` : ''}`
        : `Hello ${activeStoreName} Concierge,\n\nI would like to inquire about your fine collections and bespoke services.\n${customNote ? `\nQuestion: "${customNote}"` : ''}`;
    }

    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  };

  const handleOpenWhatsApp = () => {
    const link = generateWhatsAppLink();
    window.open(link, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.764.78 2.796.78 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.748 0-3.39-.45-4.832-1.246l-7.168 1.879 1.916-7.001c-.86-1.488-1.348-3.218-1.348-5.064 0-5.514 4.486-10 10-10s10 4.486 10 10zm-6.262 3.659c-.217.61-1.267 1.157-1.758 1.221-.448.058-.992.086-3.228-.841-2.427-1.006-3.957-3.484-4.077-3.645-.12-.16-1.004-1.336-1.004-2.548 0-1.212.632-1.808.857-2.054.225-.246.492-.308.656-.308.164 0 .328.001.472.008.151.007.353-.057.553.424.209.502.711 1.733.774 1.859.063.126.105.273.021.439-.084.166-.126.27-.251.417-.126.147-.264.329-.377.441-.126.126-.257.262-.11.515.147.252.652 1.077 1.399 1.743.96.856 1.769 1.121 2.022 1.247.253.126.401.105.549-.063.148-.168.632-.735.8-.987.169-.252.337-.21.569-.126.232.084 1.474.694 1.727.82.253.126.421.189.484.295.063.105.063.61-.154 1.22z"/>
    </svg>
  );

  return (
    <>
      {/* Floating Action Button at Bottom Right */}
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-3">
        {/* Luxury Pill Label on Hover / Resting */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="hidden sm:inline-flex items-center gap-2.5 bg-[#141414]/95 text-white pl-3.5 pr-4 py-2.5 text-[11px] uppercase tracking-[0.2em] font-serif border border-[#C5A880]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-md hover:border-[#C5A880] hover:text-[#E6CA9E] transition-all transform hover:-translate-x-1 cursor-pointer group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>VIP Concierge</span>
            <Sparkles className="w-3 h-3 text-[#C5A880] opacity-80 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* Circular Luxury Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open WhatsApp VIP Concierge"
          className={`relative w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_10px_30px_rgba(0,0,0,0.6)] border cursor-pointer ${
            isOpen
              ? 'bg-[#141414] text-white border-[#C5A880] rotate-90 scale-95'
              : 'bg-[#141414] text-[#E6CA9E] border-[#C5A880]/50 hover:border-[#C5A880] hover:scale-105 hover:shadow-[0_10px_30px_rgba(197,168,128,0.25)]'
          }`}
        >
          {isOpen ? (
            <X className="w-5 h-5 text-neutral-200" />
          ) : (
            <>
              <WhatsAppIcon className="w-6 h-6 text-[#25D366] transition-transform group-hover:scale-110" />
              {/* Online pulse dot */}
              <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#141414] rounded-full" />
            </>
          )}
        </button>
      </div>

      {/* Concierge Popup Modal with Luxury Aesthetic */}
      {isOpen && (
        <div className="fixed bottom-22 right-4 sm:bottom-24 sm:right-6 z-40 w-[92vw] max-w-[390px] bg-[#111111] text-white border border-[#C5A880]/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#181818] via-[#141414] to-[#181818] border-b border-[#C5A880]/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#1c1c1c] border border-[#C5A880]/30 flex items-center justify-center text-[#25D366]">
                  <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#111111]" />
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-[0.18em] font-serif font-bold text-[#E6CA9E] flex items-center gap-1.5">
                  {activeStoreName} VIP Concierge
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880] inline" />
                </h4>
                <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" /> Private Client Advisor Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white p-1 text-xs transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4 text-xs">
            {/* If viewing a product, offer direct product inquiry */}
            {currentProduct && (
              <div 
                onClick={() => setSelectedTopic('product')}
                className={`p-3 border transition-all cursor-pointer flex items-center gap-3 ${
                  selectedTopic === 'product'
                    ? 'border-[#C5A880] bg-[#C5A880]/10'
                    : 'border-white/10 bg-[#161616] hover:border-[#C5A880]/50'
                }`}
              >
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="w-12 h-12 object-cover border border-[#C5A880]/30 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#C5A880] font-bold block">
                    Inquire About Current Piece
                  </span>
                  <p className="text-xs font-serif font-medium truncate text-white">
                    {currentProduct.name}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    ${currentProduct.price.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Topic Selector */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-neutral-400 font-bold mb-2">
                Bespoke Client Inquiry
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTopic('general')}
                  className={`p-2.5 text-left border text-[11px] font-medium transition-all cursor-pointer ${
                    selectedTopic === 'general'
                      ? 'border-[#C5A880] bg-[#C5A880]/15 text-[#E6CA9E]'
                      : 'border-white/10 bg-[#161616] text-neutral-300 hover:border-white/30'
                  }`}
                >
                  ✨ General Inquiry
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTopic('vip')}
                  className={`p-2.5 text-left border text-[11px] font-medium transition-all cursor-pointer ${
                    selectedTopic === 'vip'
                      ? 'border-[#C5A880] bg-[#C5A880]/15 text-[#E6CA9E]'
                      : 'border-white/10 bg-[#161616] text-neutral-300 hover:border-white/30'
                  }`}
                >
                  👑 VIP Personal Shopper
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTopic('order')}
                  className={`p-2.5 text-left border text-[11px] font-medium transition-all col-span-2 cursor-pointer ${
                    selectedTopic === 'order'
                      ? 'border-[#C5A880] bg-[#C5A880]/15 text-[#E6CA9E]'
                      : 'border-white/10 bg-[#161616] text-neutral-300 hover:border-white/30'
                  }`}
                >
                  📦 Order Tracking & Private Delivery
                </button>
              </div>
            </div>

            {/* Custom Message Field */}
            <div>
              <label className="block text-[10px] uppercase tracking-[0.15em] text-neutral-400 font-bold mb-1.5">
                Dedicated Note / Inscription
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Type your bespoke request or questions..."
                rows={2}
                className="w-full bg-[#161616] border border-white/15 p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A880] transition-colors"
              />
            </div>

            {/* Start WhatsApp Chat CTA */}
            <button
              onClick={handleOpenWhatsApp}
              className="w-full bg-[#1e1e1e] hover:bg-[#252525] text-white border border-[#C5A880]/60 hover:border-[#C5A880] py-3.5 px-4 font-serif font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2.5 shadow-lg transition-all transform active:scale-98 cursor-pointer group"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366] group-hover:scale-110 transition-transform" />
              <span className="text-[#E6CA9E] group-hover:text-white transition-colors">Start WhatsApp Consultation</span>
              <Send className="w-3.5 h-3.5 ml-1 text-[#C5A880]" />
            </button>

            <p className="text-[10px] text-center text-neutral-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#C5A880]" />
              Official End-to-End Encrypted Advisory
            </p>
          </div>
        </div>
      )}
    </>
  );
};
