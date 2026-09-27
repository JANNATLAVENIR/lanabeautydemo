import React, { useState } from 'react';
import { X, ShieldCheck, Truck, RotateCcw, FileText, CheckCircle2, Lock, Sparkles, Printer } from 'lucide-react';
import { useI18n } from '../i18n';

export type PolicyTab = 'privacy' | 'terms' | 'shipping' | 'returns' | 'authenticity';
export type LegalPolicyTab = PolicyTab;

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'shipping'
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<PolicyTab>(initialTab);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-neutral-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white text-neutral-900 border border-neutral-200 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Top Banner */}
        <div className="p-6 bg-neutral-950 text-white flex items-center justify-between border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-amber-400/40 flex items-center justify-center bg-neutral-900 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
                Maison LANA Prestige
              </span>
              <h3 className="font-serif text-lg tracking-wider text-white">
                Client Guarantees & Official Policies
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 border border-white/20 hover:border-amber-400 transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-2 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-neutral-200 bg-neutral-50 px-4 scrollbar-none">
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-serif uppercase tracking-widest border-b-2 font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'shipping'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Truck className="w-4 h-4 text-amber-600" />
            <span>Shipping & White-Glove Delivery</span>
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-serif uppercase tracking-widest border-b-2 font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'returns'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-600" />
            <span>Returns & Exchanges</span>
          </button>
          <button
            onClick={() => setActiveTab('authenticity')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-serif uppercase tracking-widest border-b-2 font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'authenticity'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>100% Authenticity Guarantee</span>
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-serif uppercase tracking-widest border-b-2 font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Privacy & Security</span>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-serif uppercase tracking-widest border-b-2 font-bold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'terms'
                ? 'border-neutral-950 text-neutral-950 bg-white'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Terms of Service</span>
          </button>
        </div>

        {/* Policy Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-neutral-700 leading-relaxed text-sm font-sans">
          {/* 1. Shipping & White-Glove Delivery */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-l-2 border-neutral-950 pl-4 py-1">
                <h4 className="font-serif text-lg font-bold text-neutral-950 uppercase tracking-wide">
                  Shipping & White-Glove Concierge Delivery
                </h4>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  Maison LANA Worldwide Logistics & Local Same-Day Dispatch
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="text-amber-700 font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Local VIP Express
                  </div>
                  <p className="text-xs text-neutral-600">
                    Complimentary same-day or 24h direct courier delivery in major regional hubs. Hand-delivered in wax-sealed Lana presentation cases.
                  </p>
                </div>
                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="text-amber-700 font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Regional GCC & Africa
                  </div>
                  <p className="text-xs text-neutral-600">
                    2 to 4 business days via DHL Express / FedEx Priority with end-to-end temperature-controlled transit for fragrances and ouds.
                  </p>
                </div>
                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <div className="text-amber-700 font-serif font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Global International
                  </div>
                  <p className="text-xs text-neutral-600">
                    3 to 6 business days worldwide with full customs pre-clearance and comprehensive loss & transit insurance included.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h5 className="font-serif font-bold text-neutral-950 text-sm uppercase tracking-wide">
                  Signature Luxury Packaging
                </h5>
                <p className="text-xs text-neutral-600">
                  Every acquisition from Maison LANA arrives in our signature matte black presentation box, enveloped in heavyweight silk tissue paper and secured with a hand-poured golden wax seal. Dedicated gift cards with bespoke calligraphy are enclosed upon request at zero charge.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-serif font-bold text-neutral-950 text-sm uppercase tracking-wide">
                  Real-Time Tracking & Signature on Delivery
                </h5>
                <p className="text-xs text-neutral-600">
                  Upon dispatch, you will receive an official digital consignment note with live GPS tracking. To protect the integrity of high-value horology, fine jewelry, and rare perfumes, all parcels require a direct recipient signature upon handover.
                </p>
              </div>
            </div>
          )}

          {/* 2. Returns & Exchanges */}
          {activeTab === 'returns' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-l-2 border-neutral-950 pl-4 py-1">
                <h4 className="font-serif text-lg font-bold text-neutral-950 uppercase tracking-wide">
                  Returns & Exchange Policy
                </h4>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  14-Day Complimentary Return Privilege
                </p>
              </div>

              <p className="text-xs text-neutral-600">
                At Maison LANA, client satisfaction is our highest commitment. If your selection does not meet your discerning standards, we graciously offer a 14-day return and exchange window from the date of recorded delivery.
              </p>

              <div className="space-y-3">
                <h5 className="font-serif font-bold text-neutral-950 text-sm uppercase tracking-wide">
                  Conditions for Return
                </h5>
                <ul className="space-y-2 text-xs text-neutral-600 list-disc pl-5">
                  <li>Items must remain in pristine, unworn, unwashed, and undamaged condition.</li>
                  <li>All original Maison LANA security ribbons, tags, dust bags, and presentation boxes must be intact.</li>
                  <li>Fine fragrances and rare ouds must retain their original unopened cellophane seal for hygiene and provenance safety.</li>
                  <li>Custom-tailored, bespoke monogrammed pieces are non-refundable once production is signed off.</li>
                </ul>
              </div>

              <div className="p-4 border border-amber-200 bg-amber-50/60 rounded-none">
                <h6 className="font-serif font-bold text-amber-900 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" /> Effortless Courier Collection
                </h6>
                <p className="text-xs text-amber-800">
                  To initiate an exchange or return, contact our VIP Concierge via WhatsApp or the Account Portal. Our team will schedule a private courier pickup directly from your doorstep.
                </p>
              </div>
            </div>
          )}

          {/* 3. 100% Authenticity Guarantee */}
          {activeTab === 'authenticity' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-l-2 border-neutral-950 pl-4 py-1">
                <h4 className="font-serif text-lg font-bold text-neutral-950 uppercase tracking-wide">
                  Maison LANA Certificate of Authenticity
                </h4>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  Guaranteed Provenance & Verified Artisanal Heritage
                </p>
              </div>

              <p className="text-xs text-neutral-600">
                Maison LANA maintains strict, exclusive partnerships directly with certified luxury maisons, master perfumers in Grasse and Dubai, and authorized horology distributors. Every single item in our catalog undergoes rigorous multi-point authentication before being admitted into our private vaults.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <h5 className="font-serif font-bold text-neutral-900 text-xs uppercase tracking-wider">
                    Serialized Security Seal
                  </h5>
                  <p className="text-xs text-neutral-600">
                    Each fine piece is tagged with a unique tamper-evident verification code traceable directly to its origin.
                  </p>
                </div>
                <div className="p-4 border border-neutral-200 bg-neutral-50 space-y-2">
                  <h5 className="font-serif font-bold text-neutral-900 text-xs uppercase tracking-wider">
                    Double-Money Provenance Warranty
                  </h5>
                  <p className="text-xs text-neutral-600">
                    We stand behind our authenticity with an unconditional 200% financial guarantee on any item acquired from Maison LANA.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Privacy & Data Security */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-l-2 border-neutral-950 pl-4 py-1">
                <h4 className="font-serif text-lg font-bold text-neutral-950 uppercase tracking-wide">
                  Privacy Policy & Confidentiality
                </h4>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  Bank-Grade 256-Bit SSL Encryption & Zero Data Monetization
                </p>
              </div>

              <p className="text-xs text-neutral-600">
                Maison LANA values the privacy of our distinguished clientele above all else. We adhere to rigorous global data protection standards (including GDPR and CCPA compliance).
              </p>

              <div className="space-y-3">
                <h5 className="font-serif font-bold text-neutral-950 text-sm uppercase tracking-wide">
                  Our Confidentiality Pledge:
                </h5>
                <ul className="space-y-2 text-xs text-neutral-600 list-disc pl-5">
                  <li><strong>Zero Third-Party Sharing:</strong> Your personal identity, purchase history, and contact details are strictly confidential and will never be sold or leased.</li>
                  <li><strong>End-to-End Encryption:</strong> All transactions and account credentials are encrypted with TLS 1.3 and stored in secure cloud vaults.</li>
                  <li><strong>Discreet Packaging:</strong> Outer shipping containers bear no brand markings or value disclosures to preserve complete discretion upon delivery.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 5. Terms of Service */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-l-2 border-neutral-950 pl-4 py-1">
                <h4 className="font-serif text-lg font-bold text-neutral-950 uppercase tracking-wide">
                  Terms of Service & Commercial Conditions
                </h4>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">
                  Maison LANA Marketplace Governance (2026 Edition)
                </p>
              </div>

              <p className="text-xs text-neutral-600">
                By accessing and acquiring goods through Maison LANA, you agree to abide by our terms of service, governance policies, and community codes of conduct.
              </p>

              <div className="space-y-3 text-xs text-neutral-600">
                <p>
                  <strong>1. Order Acceptance:</strong> All orders are subject to inventory verification and fraud prevention screening. Maison LANA reserves the right to decline or cancel orders suspected of commercial resale or counterfeit activity.
                </p>
                <p>
                  <strong>2. Pricing & Taxes:</strong> Prices are quoted in USD and convertible into local currencies at live market exchange rates. Any applicable local import tariffs are calculated and transparently displayed at checkout.
                </p>
                <p>
                  <strong>3. Intellectual Property:</strong> All imagery, editorial copy, trademarks, and Haute Couture styling configurations remain the exclusive intellectual property of Maison LANA.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-[11px] text-neutral-500 font-serif">
            Maison LANA Client Care Department • Available 24/7
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-neutral-950 text-white font-serif text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
