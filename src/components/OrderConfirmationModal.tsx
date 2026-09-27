import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, MessageSquare, Copy, ExternalLink, Package, Printer } from 'lucide-react';
import React, { useState } from 'react';
import { useI18n } from '../i18n';
import { InvoiceModal } from './InvoiceModal';

interface OrderConfirmationModalProps {
  orderData: {
    orderId: string;
    whatsappUrl: string;
    order: any;
  } | null;
  onClose: () => void;
  onOpenTracker: () => void;
}

export function OrderConfirmationModal({
  orderData,
  onClose,
  onOpenTracker
}: OrderConfirmationModalProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  if (!orderData) return null;

  const { orderId, whatsappUrl, order } = orderData;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <InvoiceModal
        order={order}
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
      />

      <AnimatePresence>
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Centered Modal Wrapper */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-4 z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-h-[85vh] overflow-y-auto bg-white p-5 sm:p-6 shadow-2xl border border-neutral-200 flex flex-col text-center rounded-none relative"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-neutral-400 hover:text-black p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
    
              {/* Success Header */}
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 size={26} strokeWidth={1.5} />
              </div>
    
              <span className="text-[8px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block mb-1">
                {t('Order Request Created')}
              </span>

              <div className="flex justify-center items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[8.5px] font-bold uppercase tracking-wider">
                  {t('Payment: Pending')}
                </span>
                <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 text-[8.5px] font-bold uppercase tracking-wider">
                  {t('Order: Pending Payment')}
                </span>
              </div>
    
              <h2 className="text-xl md:text-2xl font-serif font-normal text-neutral-900 mb-1">
                {t('Order Number')}: #{orderId}
              </h2>
    
              <p className="text-[11px] font-sans text-neutral-500 mb-3 max-w-xs mx-auto leading-relaxed">
                {t('Your order has been registered. Complete the final step by sending the request to our WhatsApp concierge.')}
              </p>
    
              {/* Copyable Order ID Bar */}
              <div className="bg-[#FCFAF8] border border-neutral-200 p-2 mb-3 flex items-center justify-between text-xs font-mono font-medium text-neutral-900">
                <span className="text-neutral-500 font-sans text-[10px] uppercase tracking-wider">{t('Order Number')}:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-neutral-900">{orderId}</span>
                  <button
                    onClick={handleCopy}
                    className="p-1 hover:text-black transition-colors text-neutral-400 cursor-pointer"
                    title="Copy"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
    
              {copied && (
                <p className="text-[9px] uppercase tracking-widest text-emerald-600 font-bold -mt-2 mb-2">
                  {t('Order ID copied to clipboard!')}
                </p>
              )}
    
              {/* Purchased Items List */}
              {order && order.items && (
                <div className="text-left bg-[#FAF9F6] border border-neutral-200 p-2.5 mb-3 space-y-1.5 text-[10.5px] font-sans max-h-24 overflow-y-auto">
                  <p className="font-bold text-[9px] uppercase tracking-wider text-neutral-700 mb-1 border-b border-neutral-200 pb-0.5">
                    {t('Order Summary')} ({order.items.length})
                  </p>
                  {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-neutral-700">
                      <span className="truncate pr-2">• {item.productName} ({item.quantity}x)</span>
                      <span className="font-semibold shrink-0">${item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="border-t border-neutral-200 pt-1 flex justify-between font-bold text-neutral-900 text-xs mt-1.5">
                    <span>{t('Total Amount:')}</span>
                    <span className="font-mono">${order.totalPrice}.00</span>
                  </div>
                </div>
              )}
    
              {/* Main Action: Open WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-sans uppercase tracking-[0.2em] font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg mb-2"
              >
                <MessageSquare size={14} />
                <span>{t('Complete Order via WhatsApp')}</span>
                <ExternalLink size={12} />
              </a>

              {/* Print Invoice Button */}
              <button
                type="button"
                onClick={() => setShowInvoice(true)}
                className="w-full py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[10px] font-sans uppercase tracking-[0.15em] font-bold transition-all flex items-center justify-center gap-1.5 border border-neutral-300 mb-2 cursor-pointer"
              >
                <Printer size={13} />
                <span>Download / Print Official Invoice (PDF)</span>
              </button>
    
              {/* Secondary Actions */}
              <div className="flex justify-center gap-3 text-[10px] font-sans uppercase tracking-widest pt-1.5">
                <button
                  onClick={() => {
                    onClose();
                    onOpenTracker();
                  }}
                  className="text-neutral-900 hover:text-neutral-600 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Package size={11} />
                  <span>{t('Track Order')}</span>
                </button>
                <span className="text-neutral-300">•</span>
                <button
                  onClick={onClose}
                  className="text-neutral-400 hover:text-black transition-colors cursor-pointer"
                >
                  {t('Cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatePresence>
    </>
  );
}
