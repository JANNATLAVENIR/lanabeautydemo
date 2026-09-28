import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ShieldCheck, Lock, Truck, ArrowLeft, ArrowRight, AlertCircle, Building2, MessageCircle, Clock, Printer } from 'lucide-react';
import { CartItem, Order, OrderItem } from '../types';
import { useI18n } from '../i18n';
import { InvoiceModal } from './InvoiceModal';

interface CheckoutPageProps {
  items?: CartItem[];
  cart?: CartItem[];
  onOrderPlaced?: (order: Order) => void;
  onPlaceOrder?: (order: any) => void;
  onBackToCart: () => void;
  onContinueShopping?: () => void;
  onOrderSuccess?: (orderData: any) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  items,
  cart,
  onOrderPlaced,
  onPlaceOrder,
  onBackToCart,
  onContinueShopping,
  onOrderSuccess
}) => {
  const { t } = useI18n();
  const itemsList = items || cart || [];
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Form states
  const [email, setEmail] = useState('client@lanaluxury.com');
  const [phone, setPhone] = useState('+966 50 123 4567');
  const [firstName, setFirstName] = useState('Amina');
  const [lastName, setLastName] = useState('Al-Saud');
  const [address, setAddress] = useState('Olaya District, Prince Mohammed Bin Abdulaziz Rd');
  const [city, setCity] = useState('Riyadh');
  const [country, setCountry] = useState('Saudi Arabia');
  const [postalCode, setPostalCode] = useState('12211');
  const [deliveryNotes, setDeliveryNotes] = useState('Please leave with private residence concierge.');
  const [giftWrapping, _setGiftWrapping] = useState(true);

  // Manual payment state
  const [paymentOption, setPaymentOption] = useState<'bank_transfer' | 'concierge_delivery'>('bank_transfer');

  // Completed order reference
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [submitError, setSubmitError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Promo code in Checkout
  const [checkoutPromo, setCheckoutPromo] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMsg, setPromoMsg] = useState('');
  const [promoErr, setPromoErr] = useState('');

  const subtotal = itemsList.reduce(
    (sum, item) => sum + (item.product?.retailPrice ?? (item as any).retailPrice ?? 0) * item.quantity,
    0
  );
  const shipping = 0;
  const total = Math.max(0, subtotal - promoDiscount + shipping);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPromo.trim()) return;
    setPromoErr('');
    setPromoMsg('');

    try {
      const res = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: checkoutPromo.trim(), subtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setPromoDiscount(data.calculatedDiscount);
        setPromoApplied(true);
        setPromoMsg(data.message || 'Promo code applied!');
      } else {
        setPromoErr(data.error || 'Invalid promo code');
        setPromoApplied(false);
        setPromoDiscount(0);
      }
    } catch (err) {
      setPromoErr('Failed to validate promo code.');
    }
  };

  const handleCompleteOrder = async () => {
    setSubmitError('');
    setIsSubmitting(true);

    const orderItems: OrderItem[] = itemsList.map((item, index) => ({
      productId: item.product?.id || (item as any).id || `prod-item-${index}`,
      productName: item.product?.name || (item as any).name || 'Luxury Creation',
      brand: item.product?.brand || (item as any).brand,
      category: item.product?.category || (item as any).category || 'Luxury',
      price: item.product?.retailPrice || (item as any).retailPrice || 0,
      quantity: item.quantity,
      image: item.product?.image || (item as any).image || '',
      size: item.selectedSize || (item as any).size,
      color: item.selectedColor || (item as any).color
    }));

    try {
      const payload = {
        customerName: `${firstName} ${lastName}`,
        customerPhone: phone,
        customerEmail: email,
        deliveryAddress: address,
        city,
        postalCode,
        notes: deliveryNotes,
        items: orderItems,
        paymentMethod: 'Manual Payment',
        giftWrapping,
      };

      const randomBytes = new Uint8Array(16);
      window.crypto.getRandomValues(randomBytes);
      const randomHex = Array.from(randomBytes, b => b.toString(16).padStart(2, '0')).join('');
      const idempotencyKey = `idem_${orderItems.length}_${Date.now()}_${randomHex}`;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'The atelier could not register order details at this time.');
      }

      setConfirmedOrder(data.order);
      if (onOrderPlaced) onOrderPlaced(data.order);
      if (onPlaceOrder) onPlaceOrder(data.order);
      if (onOrderSuccess) onOrderSuccess(data);
      setCurrentStep(4);
    } catch (err: any) {
      setSubmitError(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-neutral-900 font-sans pt-24 pb-28">
      {/* Top Luxury Header */}
      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 py-8 border-b border-neutral-200/80 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-serif tracking-[0.35em] text-2xl font-light">LANA</span>
          <span className="text-[8px] uppercase tracking-[0.4em] text-neutral-400 font-bold border-l border-neutral-300 pl-4">
            {t('Checkout')}
          </span>
        </div>

        <button
          onClick={onBackToCart}
          className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black flex items-center gap-1.5 cursor-pointer font-medium"
        >
          <ArrowLeft size={14} />
          <span>{t('Continue Shopping')}</span>
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 sm:px-12 pt-12">
        {/* STEP 4: ORDER CONFIRMATION / RECEIPT */}
        {currentStep === 4 && confirmedOrder ? (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-8 bg-white border border-neutral-200 p-8 sm:p-14 shadow-lg">
            <div className="w-16 h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto">
              <Check size={28} />
            </div>

            <div className="space-y-2">
              <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-amber-800 block">
                {t('Order Request Created')} — {t('Payment: Pending')}
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-light uppercase tracking-wide">
                {t('Thank You', 'Thank You')}, {confirmedOrder.customerName.split(' ')[0]}
              </h1>
              <p className="text-xs text-neutral-500 font-sans max-w-md mx-auto leading-relaxed">
                {t('Order Confirmed')} · {confirmedOrder.id}
              </p>
            </div>

            {/* Manual Payment Bank Information */}
            <div className="bg-[#FAF9F5] border border-neutral-200 p-5 text-left text-xs font-sans space-y-2">
              <div className="flex items-center gap-2 text-neutral-900 font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-neutral-200">
                <Building2 size={14} className="text-neutral-700" />
                <span>{t('Payment Method')}: {t('Cash on Delivery')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-600 pt-1">
                <div>
                  <span className="block text-[10px] uppercase text-neutral-400">Beneficiary:</span>
                  <span className="font-semibold text-neutral-900">Maison LANA Haute Parfumerie</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-neutral-400">Bank:</span>
                  <span className="font-semibold text-neutral-900">Al Rajhi Private Banking</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-[10px] uppercase text-neutral-400">IBAN:</span>
                  <span className="font-mono font-bold text-neutral-900 select-all">SA03 8000 0000 6080 1016 7519</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-[10px] uppercase text-neutral-400">{t('Order Number')}:</span>
                  <span className="font-mono font-bold text-neutral-900 bg-white px-2 py-0.5 border border-neutral-300 inline-block">{confirmedOrder.id}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-b border-neutral-200 py-6 text-left space-y-3 text-xs font-sans">
              <div className="flex justify-between">
                <span className="text-neutral-500">{t('Order Number')}:</span>
                <span className="font-mono font-bold text-neutral-900">{confirmedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{t('Shipping Address')}:</span>
                <span className="text-neutral-900">{confirmedOrder.city}, {confirmedOrder.deliveryAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{t('Payment Method')}:</span>
                <span className="text-neutral-900 font-medium">{t('Cash on Delivery')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">{t('Payment: Pending')}</span>
                <span className="text-amber-800 font-bold uppercase flex items-center gap-1">
                  <Clock size={12} />
                  <span>{t('Payment: Pending')}</span>
                </span>
              </div>
              <div className="flex justify-between border-t border-neutral-100 pt-2">
                <span className="text-neutral-500 font-semibold">{t('Total Amount:')}</span>
                <span className="font-mono font-bold text-base text-neutral-900">${confirmedOrder.totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <a
                href={(confirmedOrder as any).whatsappUrl || `https://wa.me/252611234567?text=${encodeURIComponent(`Salam Maison LANA Concierge, I have placed order #${confirmedOrder.id} for $${confirmedOrder.totalPrice}. Payment status is Pending.`)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 bg-emerald-800 text-white text-[10.5px] uppercase font-bold tracking-[0.25em] hover:bg-emerald-900 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle size={15} />
                <span>{t('Complete Order via WhatsApp')}</span>
              </a>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 text-white text-[10.5px] uppercase font-bold tracking-[0.2em] hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>{t('Print / Save PDF Invoice')}</span>
              </button>
              <button
                onClick={onContinueShopping || onBackToCart}
                className="w-full sm:w-auto px-6 py-3.5 border border-neutral-300 text-neutral-900 text-[10.5px] uppercase font-bold tracking-[0.2em] hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                {t('Continue Shopping')}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Multi-step checkout form (7 cols) */}
            <div className="lg:col-span-7 space-y-10">
              {/* Stepper Header */}
              <div className="grid grid-cols-3 border-b border-neutral-200 text-xs font-sans pb-4">
                {[
                  { step: 1, label: `01. ${t('Contact Information')}` },
                  { step: 2, label: `02. ${t('Delivery Details')}` },
                  { step: 3, label: `03. ${t('Payment Method')}` }
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => {
                      if (currentStep > s.step) setCurrentStep(s.step as any);
                    }}
                    className={`text-left uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                      currentStep === s.step
                        ? 'text-neutral-900 font-bold border-b-2 border-neutral-900 pb-4 -mb-4'
                        : currentStep > s.step
                        ? 'text-neutral-500 hover:text-black cursor-pointer'
                        : 'text-neutral-300 cursor-not-allowed'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* STEP 1: CLIENT DETAILS */}
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="border-b border-neutral-200 pb-4">
                    <h2 className="text-xl font-serif font-light uppercase tracking-wide">
                      01. {t('Contact Information')}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <label className="block uppercase tracking-wider text-neutral-600 mb-1 font-semibold">
                        {t('Full Name')} *
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-white border border-neutral-300 p-3 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-neutral-600 mb-1 font-semibold">
                        {t('City')} *
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-white border border-neutral-300 p-3 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <div>
                      <label className="block uppercase tracking-wider text-neutral-600 mb-1 font-semibold">
                        {t('Email Address')} *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-neutral-300 p-3 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider text-neutral-600 mb-1 font-semibold">
                        {t('Phone Number')} *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-white border border-neutral-300 p-3 focus:outline-none focus:border-neutral-900 font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-8 py-3.5 bg-neutral-950 text-white text-[10.5px] uppercase font-bold tracking-[0.25em] hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>{t('Proceed to Checkout')}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: DELIVERY ADDRESS */}
              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="border-b border-neutral-200 pb-4">
                    <h2 className="text-xl font-serif font-light uppercase tracking-wide">
                      02. {t('Delivery Details')}
                    </h2>
                  </div>

                  <div className="space-y-4 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block uppercase tracking-wider text-neutral-600 mb-1 font-semibold">
                          {t('Country / Territory *')}
                        </label>
                        <select
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-3 focus:outline-none focus:border-neutral-900 cursor-pointer"
                        >
                          <option value="Saudi Arabia">Saudi Arabia (KSA)</option>
                          <option value="Somalia">Somalia</option>
                          <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                          <option value="Kuwait">Kuwait</option>
                          <option value="Qatar">Qatar</option>
                          <option value="Bahrain">Bahrain</option>
                          <option value="Oman">Oman</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="France">France</option>
                          <option value="United States">United States</option>
                        </select>
                      </div>

                      <div>
                        <label className="block uppercase tracking-wider text-neutral-600 mb-1 font-semibold">
                          {t('City')} *
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-white border border-neutral-300 p-3 focus:outline-none focus:border-neutral-900"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block uppercase tracking-wider text-neutral-600 mb-1 font-semibold">
                        {t('Shipping Address')} *
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-white border border-neutral-300 p-3 focus:outline-none focus:border-neutral-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block uppercase tracking-wider text-neutral-600 mb-1 font-semibold">
                        {t('Notes', 'Courier Delivery Notes (Optional)')}
                      </label>
                      <textarea
                        rows={2}
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        className="w-full bg-white border border-neutral-300 p-3 focus:outline-none focus:border-neutral-900"
                      />
                    </div>

                    <div className="bg-[#FAF9F5] p-4 border border-neutral-200 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Truck size={16} className="text-neutral-700" />
                        <span className="font-semibold text-neutral-900">{t('Free Express Delivery')}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-800">{t('Free')}</span>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-between items-center">
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      <ArrowLeft size={13} />
                      <span>{t('Back', 'Back')}</span>
                    </button>

                    <button
                      onClick={() => setCurrentStep(3)}
                      className="px-8 py-3.5 bg-neutral-950 text-white text-[10.5px] uppercase font-bold tracking-[0.25em] hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>{t('Payment Method')}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: PAYMENT */}
              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="border-b border-neutral-200 pb-4">
                    <h2 className="text-xl font-serif font-light uppercase tracking-wide">
                      03. {t('Payment Method')}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <div
                      onClick={() => setPaymentOption('bank_transfer')}
                      className={`p-4 border cursor-pointer transition-all flex items-center justify-between ${
                        paymentOption === 'bank_transfer'
                          ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={paymentOption === 'bank_transfer'}
                          onChange={() => {}}
                          className="accent-neutral-900"
                        />
                        <div>
                          <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900 block">
                            {t('Cash on Delivery')}
                          </span>
                        </div>
                      </div>
                      <Building2 size={16} className="text-neutral-600 shrink-0" />
                    </div>

                    <div
                      onClick={() => setPaymentOption('concierge_delivery')}
                      className={`p-4 border cursor-pointer transition-all flex items-center justify-between ${
                        paymentOption === 'concierge_delivery'
                          ? 'border-neutral-900 bg-neutral-50 shadow-sm'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={paymentOption === 'concierge_delivery'}
                          onChange={() => {}}
                          className="accent-neutral-900"
                        />
                        <div>
                          <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900 block">
                            {t('Complete Order via WhatsApp')}
                          </span>
                        </div>
                      </div>
                      <Truck size={16} className="text-neutral-600 shrink-0" />
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 mt-4">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="pt-6 flex justify-between items-center">
                    <button
                      onClick={() => setCurrentStep(2)}
                      disabled={isSubmitting}
                      className="text-xs uppercase tracking-widest text-neutral-500 hover:text-black flex items-center gap-1.5 cursor-pointer font-medium disabled:opacity-50"
                    >
                      <ArrowLeft size={13} />
                      <span>{t('Back', 'Back')}</span>
                    </button>

                    <button
                      onClick={handleCompleteOrder}
                      disabled={isSubmitting}
                      className="px-10 py-4 bg-neutral-950 text-white text-[11px] uppercase font-bold tracking-[0.3em] hover:bg-neutral-800 transition-colors flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{t('Processing...')}</span>
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          <span>{t('Place Order')} (${total.toLocaleString()})</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Right: Sticky Order Summary (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-neutral-200 p-6 sm:p-8 space-y-6 sticky top-28 shadow-sm">
                <h3 className="text-base font-serif font-light uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-4">
                  {t('Order Summary')} ({itemsList.reduce((a, c) => a + c.quantity, 0)})
                </h3>

                {/* Mini Item List */}
                <div className="max-h-60 overflow-y-auto space-y-4 divide-y divide-neutral-100 pr-2">
                  {itemsList.map((item, idx) => {
                    const name = item.product?.name || (item as any).name;
                    const price = item.product?.retailPrice || (item as any).retailPrice || 0;
                    const image = item.product?.image || (item as any).image;
                    return (
                      <div key={item.product?.id || idx} className="pt-3 flex gap-3 items-center">
                        {image ? (
                          <img src={image} alt={name} className="w-12 h-16 object-cover bg-neutral-100 shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-12 h-16 bg-neutral-100 shrink-0 border border-neutral-200" />
                        )}
                        <div className="flex-1 text-xs">
                          <h4 className="font-serif font-normal uppercase text-neutral-900 line-clamp-1">{name}</h4>
                          <span className="text-neutral-400 block font-mono">{t('Quantity')}: {item.quantity}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-neutral-900">
                          ${(price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-neutral-200 pt-4 space-y-2 text-xs font-sans">
                  <div className="flex justify-between text-neutral-600">
                    <span>{t('Subtotal')}</span>
                    <span className="font-mono text-neutral-900">${subtotal.toLocaleString()}</span>
                  </div>
                  {promoApplied && promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>{t('Promo Code')} ({checkoutPromo.toUpperCase()})</span>
                      <span className="font-mono">-${promoDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-neutral-600">
                    <span>{t('Shipping')}</span>
                    <span className="font-mono text-emerald-800 font-semibold">{t('Free')}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold text-neutral-900 border-t border-neutral-200 pt-3">
                    <span>{t('Total')}</span>
                    <span className="font-mono text-base font-bold">${total.toLocaleString()}</span>
                  </div>
                </div>

                {/* Promo Code Input in Checkout */}
                <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('Promo code (e.g. LANA10)')}
                      value={checkoutPromo}
                      onChange={(e) => setCheckoutPromo(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 px-3 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      {t('Apply')}
                    </button>
                  </form>
                  {promoMsg && (
                    <p className="text-[11px] text-emerald-600 font-medium">✓ {promoMsg}</p>
                  )}
                  {promoErr && (
                    <p className="text-[11px] text-red-600 font-medium">✕ {promoErr}</p>
                  )}
                </div>

                <div className="bg-[#FAF9F5] p-4 border border-neutral-200/80 space-y-2 text-[10.5px] text-neutral-600">
                  <div className="flex items-center gap-2 text-neutral-900 font-bold uppercase tracking-wider">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    <span>{t('Authenticity Guaranteed')}</span>
                  </div>
                  <p>{t('Free Express Delivery')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <InvoiceModal
        order={confirmedOrder}
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};
