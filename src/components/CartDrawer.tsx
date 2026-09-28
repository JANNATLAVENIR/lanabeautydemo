import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, ArrowRight, MessageSquare, ShieldCheck, MapPin, Phone, User, FileText } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { useI18n } from '../i18n';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderCreated: (orderData: { orderId: string; whatsappUrl: string; order: any }) => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCreated
}: CartDrawerProps) {
  const { t, localizeCategory } = useI18n();
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('Riyadh');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll and freeze page position when drawer is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const subtotal = items.reduce((sum, item) => sum + item.product.retailPrice * item.quantity, 0);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      setErrorMessage(t('Please fill in your Name, Phone, and Delivery Address.'));
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        city,
        deliveryAddress: deliveryAddress.trim(),
        notes: notes.trim(),
        items: items.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          category: item.product.category,
          price: item.product.retailPrice,
          quantity: item.quantity,
          image: item.product.image
        })),
        totalPrice: subtotal
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process order.');
      }

      onClearCart();
      setStep('cart');
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setNotes('');
      onClose();

      onOrderCreated({
        orderId: data.orderId,
        whatsappUrl: data.whatsappUrl,
        order: data.order
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while creating your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md h-screen h-[100dvh] bg-white z-50 flex flex-col shadow-2xl border-l border-lana-nude/30 overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="p-4 md:p-6 border-b border-lana-nude/20 flex items-center justify-between bg-lana-ivory/50">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-lana-gold" />
                <h3 className="text-xs md:text-sm font-sans font-bold uppercase tracking-[0.2em] text-lana-ink">
                  {step === 'cart'
                    ? `${t('Your Shopping Bag')} (${items.reduce((s, i) => s + i.quantity, 0)})`
                    : t('Complete Order via WhatsApp')}
                </h3>
              </div>
              <button 
                onClick={onClose} 
                className="p-1 hover:text-lana-gold transition-colors text-lana-ink/60 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-lana-blush/30 flex items-center justify-center text-lana-gold mb-2">
                    <ShoppingBag size={28} strokeWidth={1.2} />
                  </div>
                  <h4 className="text-lg font-serif">{t('Your Bag is Empty')}</h4>
                  <p className="text-xs font-sans text-lana-ink/50 max-w-xs">
                    {t('Explore our luxury beauty selection and discover your signature scent or skincare essential.')}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-3 bg-lana-ink text-white text-[10px] uppercase tracking-[0.2em] font-sans hover:bg-lana-gold transition-colors cursor-pointer"
                  >
                    {t('Start Shopping')}
                  </button>
                </div>
              ) : step === 'cart' ? (
                /* Cart Items List */
                <div className="space-y-6">
                  {items.map(item => (
                    <div 
                      key={item.product.id} 
                      className="flex gap-4 p-3 border border-lana-nude/20 bg-[#FCFAF8] relative group"
                    >
                      {item.product.image && item.product.image.trim() !== '' ? (
                        <img 
                          src={item.product.image} 
                          alt={item.product.name} 
                          className="w-20 h-24 object-cover border border-lana-nude/20 bg-white"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-20 h-24 bg-neutral-100 border border-lana-nude/20 flex items-center justify-center text-[9px] text-neutral-400">
                          No Image
                        </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between py-1">
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-lana-gold font-sans font-bold">
                            {localizeCategory(item.product.category)}
                          </p>
                          <h4 className="text-sm font-serif font-normal text-lana-ink">{item.product.name}</h4>
                          <p className="text-xs font-sans font-medium text-lana-ink/80 mt-1">
                            ${item.product.retailPrice}.00
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border border-lana-nude/50 bg-white text-xs">
                            <button 
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="px-2 py-1 text-lana-ink/60 hover:text-lana-ink transition-colors cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-3 py-1 font-mono font-medium">{item.quantity}</span>
                            <button 
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="px-2 py-1 text-lana-ink/60 hover:text-lana-ink transition-colors cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button 
                            onClick={() => onRemoveItem(item.product.id)}
                            className="text-[10px] uppercase tracking-wider text-red-700/60 hover:text-red-700 transition-colors cursor-pointer"
                          >
                            {t('Remove')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Brand Promise Badge */}
                  <div className="p-4 bg-lana-blush/20 border border-lana-nude/30 text-xs font-sans text-lana-ink/70 flex items-start gap-3">
                    <ShieldCheck size={20} className="text-lana-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[10px] uppercase tracking-widest text-lana-ink mb-0.5">
                        {t('Authenticity Guaranteed')}
                      </p>
                      <p className="text-[11px] leading-relaxed text-lana-ink/60">
                        {t('Sourced exclusively from certified regional store vaults. Dispatched in signature Lana luxury packaging.')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Customer Checkout Form */
                <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="space-y-2.5 text-left">
                  {errorMessage && (
                    <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-[10px] rounded-none">
                      {errorMessage}
                    </div>
                  )}

                  <div>
                    <label className="block text-[8.5px] uppercase tracking-widest font-sans font-bold text-lana-ink/70 mb-0.5 flex items-center gap-1.5">
                      <User size={10} className="text-lana-gold" />
                      {t('Full Name')} *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Fatima / Ahmed"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FCFAF8] border border-lana-nude/40 focus:outline-none focus:border-lana-gold font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[8.5px] uppercase tracking-widest font-sans font-bold text-lana-ink/70 mb-0.5 flex items-center gap-1.5">
                      <Phone size={10} className="text-lana-gold" />
                      {t('Phone Number')} *
                    </label>
                    <input 
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FCFAF8] border border-lana-nude/40 focus:outline-none focus:border-lana-gold font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8.5px] uppercase tracking-widest font-sans font-bold text-lana-ink/70 mb-0.5 flex items-center gap-1.5">
                        <MapPin size={10} className="text-lana-gold" />
                        {t('City')}
                      </label>
                      <input 
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-2 py-1.5 text-xs bg-[#FCFAF8] border border-lana-nude/40 focus:outline-none focus:border-lana-gold font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-[8.5px] uppercase tracking-widest font-sans font-bold text-lana-ink/70 mb-0.5">
                        {t('Postal Code')}
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. 00100"
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FCFAF8] border border-lana-nude/40 focus:outline-none focus:border-lana-gold font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[8.5px] uppercase tracking-widest font-sans font-bold text-lana-ink/70 mb-0.5">
                      {t('Shipping Address')} *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Street, Building, Landmark"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FCFAF8] border border-lana-nude/40 focus:outline-none focus:border-lana-gold font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[8.5px] uppercase tracking-widest font-sans font-bold text-lana-ink/70 mb-0.5 flex items-center gap-1.5">
                      <FileText size={10} className="text-lana-gold" />
                      {t('Notes', 'Special Delivery Instructions (Optional)')}
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Call upon arrival"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-[#FCFAF8] border border-lana-nude/40 focus:outline-none focus:border-lana-gold font-sans"
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="p-3 bg-lana-ivory/80 border border-lana-nude/30 space-y-1 text-[11px] font-sans mt-2">
                    <div className="flex justify-between text-lana-ink/70">
                      <span>{t('Total Items', 'Total Items')}:</span>
                      <span className="font-semibold">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                    </div>
                    <div className="flex justify-between text-lana-ink/70">
                      <span>{t('Shipping')}:</span>
                      <span className="text-green-700 font-bold uppercase tracking-wider text-[9px]">{t('Free')}</span>
                    </div>
                    <div className="border-t border-lana-nude/30 pt-1.5 flex justify-between text-xs font-bold text-lana-ink">
                      <span>{t('Total Amount:')}</span>
                      <span className="text-lana-gold font-mono">${subtotal}.00</span>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer Actions */}
            {items.length > 0 && (
              <div className="p-4 md:p-6 border-t border-lana-nude/20 bg-lana-ivory/30 space-y-3 pb-safe">
                {step === 'cart' ? (
                  <>
                    <div className="flex justify-between items-baseline mb-1 md:mb-2">
                      <span className="text-[10px] md:text-xs uppercase tracking-widest font-sans font-bold text-lana-ink/60">{t('Total')}</span>
                      <span className="text-xl md:text-2xl font-serif text-lana-ink">${subtotal}.00</span>
                    </div>

                    <button
                      onClick={() => setStep('checkout')}
                      className="w-full py-3 md:py-4 bg-lana-ink text-white text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-sans font-semibold hover:bg-lana-gold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <span>{t('Proceed to Checkout')}</span>
                      <ArrowRight size={14} />
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep('cart')}
                      className="w-1/3 py-2.5 md:py-3.5 border border-lana-nude text-lana-ink text-[9px] md:text-[10px] uppercase tracking-widest font-sans font-bold hover:bg-lana-ivory transition-colors cursor-pointer"
                    >
                      {t('Back', 'Back')}
                    </button>

                    <button
                      type="submit"
                      form="checkout-form"
                      disabled={isSubmitting}
                      className="w-2/3 py-2.5 md:py-3.5 bg-emerald-700 text-white text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-sans font-bold hover:bg-emerald-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      <span>{isSubmitting ? t('Processing...') : t('Complete Order via WhatsApp')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
