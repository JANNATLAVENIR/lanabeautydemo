import React, { useState, useMemo } from 'react';
import { X, Search, ChevronDown, HelpCircle, ShieldCheck, Truck, CreditCard, RotateCcw, Crown, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConcierge?: () => void;
}

interface FAQItem {
  category: 'authenticity' | 'shipping' | 'payment' | 'returns' | 'vip';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    category: 'authenticity',
    question: 'Are all products sold on Maison LANA 100% genuine and brand new?',
    answer: 'Yes, unconditionally. Maison LANA sources directly from certified master perfumeries, licensed horology workshops in Switzerland, and accredited Haute Couture fashion houses. Every product comes in its pristine original presentation box with serialized tamper-evident security tags and a Certificate of Provenance.'
  },
  {
    category: 'authenticity',
    question: 'How do I verify the authenticity code on my acquired piece?',
    answer: 'Each luxury item features a dedicated serialized security code printed on the authenticity card enclosed in your wax-sealed envelope. You may also present this serial number to our VIP Concierge via WhatsApp for instant database verification.'
  },
  {
    category: 'shipping',
    question: 'How long does delivery take and what are the shipping costs?',
    answer: 'We provide complimentary VIP Express delivery on all orders. Local capital deliveries are fulfilled within 24 hours via our private white-glove courier. Regional and international shipments arrive within 2 to 5 business days via DHL Express / FedEx Priority, fully insured.'
  },
  {
    category: 'shipping',
    question: 'How are fragile perfumes and fine jewelry packaged?',
    answer: 'Every piece is nestled in high-density velvet cushioning inside our signature matte black presentation box, enveloped in heavyweight silk tissue paper and secured with a hand-poured golden wax seal. Thermal insulation is applied to rare ouds to prevent heat degradation in transit.'
  },
  {
    category: 'payment',
    question: 'What payment options are accepted?',
    answer: 'We accept Cash on Delivery (COD) for verified local orders, direct Bank Wire Transfers, mobile money (Zaad, Sahal, E-Dahab), and major credit cards (Visa, Mastercard, American Express). All payments are processed through secure 256-bit encrypted channels.'
  },
  {
    category: 'payment',
    question: 'Can I pay in local currency instead of USD?',
    answer: 'Yes. You can switch your preferred currency in the top navigation bar. Our checkout dynamically converts prices at real-time market rates and provides clear local payment instructions.'
  },
  {
    category: 'returns',
    question: 'What is your return and exchange policy?',
    answer: 'We provide a 14-day return privilege for all unworn, unaltered pieces with original security ribbons and dust bags intact. For hygiene and provenance reasons, fragrances and cosmetic products must retain their original cellophane seal.'
  },
  {
    category: 'returns',
    question: 'How do I schedule a return pickup?',
    answer: 'Simply notify our Concierge via the WhatsApp button or your Account Portal. We will dispatch a private courier to your address to collect the parcel at your convenience.'
  },
  {
    category: 'vip',
    question: 'What benefits are included in the Maison Privilège VIP Club?',
    answer: 'Privilège members receive first-access allocations to limited Haute Horlogerie releases and rare oud distillations, complimentary bespoke monogramming, invitations to private seasonal runway previews, and a dedicated 24/7 personal client advisor.'
  },
  {
    category: 'vip',
    question: 'Can I request private bespoke tailoring or rare piece sourcing?',
    answer: 'Yes. Our private client styling team specializes in procuring rare horology references, custom evening wear tailoring, and bespoke wedding trousseaus. Connect directly with our concierge to initiate a private consultation.'
  }
];

export const FAQModal: React.FC<FAQModalProps> = ({
  isOpen,
  onClose,
  onOpenConcierge
}) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter(faq => {
      const matchesCat = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white text-neutral-900 border border-neutral-200 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-amber-400/40 flex items-center justify-center bg-neutral-900 text-amber-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                Maison LANA Concierge
              </span>
              <h3 className="font-serif text-lg tracking-wider text-white">
                Frequently Asked Questions (FAQ)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 sm:p-6 bg-neutral-50 border-b border-neutral-200 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g. authenticity, delivery times, sizing, returns)..."
              className="w-full bg-white border border-neutral-300 pl-10 pr-4 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-950 transition-colors"
            />
          </div>

          <div className="flex overflow-x-auto gap-2 scrollbar-none pb-1">
            {[
              { id: 'all', label: 'All Topics', icon: Sparkles },
              { id: 'authenticity', label: 'Authenticity', icon: ShieldCheck },
              { id: 'shipping', label: 'Shipping & Delivery', icon: Truck },
              { id: 'payment', label: 'Payment Methods', icon: CreditCard },
              { id: 'returns', label: 'Returns & Exchange', icon: RotateCcw },
              { id: 'vip', label: 'VIP Concierge', icon: Crown }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-[11px] font-serif uppercase tracking-wider whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-950 text-white font-bold'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-950'
                }`}
              >
                <cat.icon className="w-3 h-3 text-amber-500" />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accordions List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-neutral-100">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 space-y-2">
              <p className="font-serif text-sm">No exact questions found for "{searchQuery}".</p>
              <p className="text-xs">Our 24/7 VIP Concierge is available to answer any bespoke inquiries.</p>
              {onOpenConcierge && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenConcierge();
                  }}
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-serif uppercase tracking-widest hover:bg-emerald-500"
                >
                  Contact WhatsApp Concierge
                </button>
              )}
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = expandedIndex === idx;
              return (
                <div key={idx} className="pt-3 first:pt-0">
                  <button
                    onClick={() => setExpandedIndex(isOpen ? null : idx)}
                    className="w-full text-left flex items-start justify-between gap-4 py-2 group cursor-pointer"
                  >
                    <span className="font-serif font-bold text-xs sm:text-sm text-neutral-900 group-hover:text-amber-700 transition-colors">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-amber-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="py-2 text-xs text-neutral-600 leading-relaxed font-sans pr-6 animate-in fade-in duration-150">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Concierge Link */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-600 text-center sm:text-left">
            Still have questions? Our private advisors are available 24/7.
          </p>
          <div className="flex items-center gap-2">
            {onOpenConcierge && (
              <button
                onClick={() => {
                  onClose();
                  onOpenConcierge();
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-serif text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Chat on WhatsApp
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white font-serif text-xs uppercase tracking-widest transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
