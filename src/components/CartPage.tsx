import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Gift, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Product } from '../types';
import { CartItem } from './CartDrawer';
import { useI18n } from '../i18n';

interface CartPageProps {
  items?: CartItem[];
  cart?: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  onContinueShopping: () => void;
  onViewProduct?: (product: Product) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  items,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart: _onClearCart,
  onProceedToCheckout,
  onContinueShopping,
  onViewProduct
}) => {
  const { t, localizeCategory } = useI18n();
  const activeCart = items || cart || [];
  const [giftMessage, setGiftMessage] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherMessage, setVoucherMessage] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [isGiftWrapIncluded, setIsGiftWrapIncluded] = useState(true);

  const subtotal = activeCart.reduce((sum, item) => sum + (item.product ? item.product.retailPrice : (item as any).retailPrice || 0) * item.quantity, 0);
  const shipping = subtotal > 150 ? 0 : 25;
  const total = Math.max(0, subtotal - voucherDiscount + shipping);

  const handleApplyVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode.trim()) return;
    setVoucherError('');
    setVoucherMessage('');

    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode.trim(), subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVoucherDiscount(data.calculatedDiscount);
        setVoucherApplied(true);
        setVoucherMessage(data.message || 'Promo code applied!');
      } else {
        setVoucherError(data.error || 'Invalid promo code');
        setVoucherApplied(false);
        setVoucherDiscount(0);
      }
    } catch (err) {
      setVoucherError('Failed to validate promo code.');
    }
  };

  if (activeCart.length === 0) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 font-sans pt-32 pb-24 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
            <ShoppingBag size={24} strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-serif font-light uppercase tracking-wide">
            {t('Your Bag is Empty')}
          </h2>
          <p className="text-xs text-neutral-500 font-sans leading-relaxed">
            {t('Explore our luxury beauty selection and discover your signature scent or skincare essential.')}
          </p>
          <div className="pt-4">
            <button
              onClick={onContinueShopping}
              className="px-8 py-3.5 bg-neutral-900 text-white text-[10.5px] uppercase font-bold tracking-[0.25em] hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {t('Start Shopping')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans pt-24 pb-28">
      {/* Header */}
      <div className="max-w-[1700px] mx-auto px-6 sm:px-12 py-8 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-neutral-400 block">
              {t('CLIENT ORDER SELECTION', 'CLIENT ORDER SELECTION')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-light uppercase tracking-wide">
              {t('Your Shopping Bag')} ({activeCart.reduce((a, c) => a + c.quantity, 0)})
            </h1>
          </div>
          <button
            onClick={onContinueShopping}
            className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <ArrowLeft size={13} />
            <span>{t('Continue Shopping')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Items & Order Summary */}
      <div className="max-w-[1700px] mx-auto px-6 sm:px-12 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-16">
          {/* Item Table (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="border-t border-b border-neutral-200 divide-y divide-neutral-200">
              {activeCart.map((item) => {
                const prod = item.product || (item as any);
                const prodId = prod.id;
                const price = prod.retailPrice || 0;
                return (
                  <div key={prodId} className="py-6 sm:py-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                    {/* Image & Title */}
                    <div className="flex gap-6 items-center">
                      <div
                        onClick={() => onViewProduct && onViewProduct(prod)}
                        className="w-24 h-32 sm:w-28 sm:h-36 bg-neutral-100 shrink-0 overflow-hidden cursor-pointer"
                      >
                        {prod.image && prod.image.trim() !== '' ? (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-neutral-400 block">
                          {localizeCategory(prod.category || 'HAUTE COUTURE')}
                        </span>
                        <h3
                          onClick={() => onViewProduct && onViewProduct(prod)}
                          className="text-base sm:text-lg font-serif font-light text-neutral-900 uppercase cursor-pointer hover:text-neutral-600 transition-colors"
                        >
                          {prod.name}
                        </h3>
                        <div className="text-xs text-neutral-500 font-sans flex items-center gap-3">
                          {item.selectedSize && <span>{t('Size')}: {item.selectedSize}</span>}
                          {item.selectedColor && <span>{t('Color')}: {item.selectedColor}</span>}
                        </div>
                        <span className="text-sm font-medium text-neutral-900 block pt-1">
                          ${price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Stepper, Subtotal & Remove */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      {/* Stepper */}
                      <div className="flex items-center border border-neutral-300">
                        <button
                          onClick={() => onUpdateQuantity(prodId, -1)}
                          className="p-2 text-neutral-500 hover:text-black cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(prodId, 1)}
                          className="p-2 text-neutral-500 hover:text-black cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Total Price */}
                      <span className="text-sm font-semibold font-mono text-neutral-900 min-w-[70px] text-right">
                        ${(price * item.quantity).toLocaleString()}
                      </span>

                      {/* Remove */}
                      <button
                        onClick={() => onRemoveItem(prodId)}
                        className="text-neutral-400 hover:text-red-700 p-2 cursor-pointer transition-colors"
                        title={t('Remove')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Personalized Gift Message Card */}
            <div className="bg-[#FAF9F5] border border-neutral-200/80 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift size={16} className="text-amber-800" />
                  <span className="text-xs uppercase tracking-[0.25em] font-bold text-neutral-900">
                    {t('LANA Iconic Packaging')}
                  </span>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGiftWrapIncluded}
                    onChange={(e) => setIsGiftWrapIncluded(e.target.checked)}
                    className="accent-neutral-900"
                  />
                  <span>{t('Complimentary Delivery & Gift Box')}</span>
                </label>
              </div>

              {isGiftWrapIncluded && (
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 block">
                    {t('Notes', 'Personalized Calligraphed Note (Optional):')}
                  </span>
                  <textarea
                    rows={3}
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                    placeholder={t('Notes', 'Write a private dedication to be enclosed in a wax-sealed Lana envelope...')}
                    className="w-full bg-white border border-neutral-200 p-3 text-xs font-sans placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary & Checkout (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-6 sticky top-28 shadow-sm">
              <h2 className="text-lg font-serif font-light uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-4">
                {t('Order Summary')}
              </h2>

              {/* Subtotal Breakdown */}
              <div className="space-y-3 text-xs font-sans">
                <div className="flex justify-between text-neutral-600">
                  <span>{t('Subtotal')}</span>
                  <span className="font-mono text-neutral-900">${subtotal.toLocaleString()}</span>
                </div>

                {voucherApplied && voucherDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>{t('Promo Discount')} ({voucherCode.toUpperCase()})</span>
                    <span className="font-mono">-${voucherDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between text-neutral-600">
                  <span>{t('Shipping')}</span>
                  <span className="font-mono text-neutral-900">
                    {shipping === 0 ? t('Free') : `$${shipping}`}
                  </span>
                </div>

                <div className="border-t border-neutral-200 pt-4 flex justify-between text-base font-serif font-normal text-neutral-950">
                  <span>{t('Total')}</span>
                  <span className="font-mono font-bold">${total.toLocaleString()}</span>
                </div>
              </div>

              {/* Voucher Code Form */}
              <div className="space-y-1.5">
                <form onSubmit={handleApplyVoucher} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('Enter promo code (e.g. LANA10, VIP2026)')}
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-neutral-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {t('Apply')}
                  </button>
                </form>
                {voucherMessage && (
                  <p className="text-[11px] text-emerald-600 font-medium">✓ {voucherMessage}</p>
                )}
                {voucherError && (
                  <p className="text-[11px] text-red-600 font-medium">✕ {voucherError}</p>
                )}
              </div>

              {/* Primary Checkout CTA */}
              <button
                onClick={onProceedToCheckout}
                className="w-full py-4 bg-neutral-950 hover:bg-neutral-800 text-white text-[11px] uppercase font-bold tracking-[0.3em] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span>{t('Proceed to Checkout')}</span>
                <ArrowRight size={15} />
              </button>

              {/* WhatsApp Fast Checkout */}
              <a
                href={`https://wa.me/966500000000?text=Hello%20Lana%20Concierge,%20I%20would%20like%20to%20place%20an%20order%20for%20my%20bag%20total%20of%20$${total}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 border border-emerald-600 text-emerald-800 hover:bg-emerald-50 text-[10px] uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>{t('Complete Order via WhatsApp')}</span>
              </a>

              {/* Security Badges */}
              <div className="pt-4 border-t border-neutral-100 text-[10px] text-neutral-400 space-y-2 text-center">
                <div className="flex items-center justify-center gap-1 text-neutral-600">
                  <ShieldCheck size={14} />
                  <span>{t('Authenticity Guaranteed')}</span>
                </div>
                <p>{t('Free Express Delivery')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
