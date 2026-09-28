import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Phone, ShoppingBag, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { useI18n } from '../i18n';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderTrackerModal({ isOpen, onClose }: OrderTrackerModalProps) {
  const { t } = useI18n();
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  // History states
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [_loadingHistory, setLoadingHistory] = useState(false);

  const [dynamicWaNum, setDynamicWaNum] = useState<string>(() => {
    try {
      const cached = localStorage.getItem('lana_site_settings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const num = parsed.whatsappNumber || parsed.contactInfo?.whatsappNumber || parsed.contactInfo?.contactPhone;
        if (num) return String(num).replace(/[^0-9]/g, '');
      }
    } catch {}
    return '';
  });

  useEffect(() => {
    const handleUpdate = (e: any) => {
      const num = e.detail?.whatsappNumber || e.detail?.contactInfo?.whatsappNumber || e.detail?.contactInfo?.contactPhone;
      if (num) setDynamicWaNum(String(num).replace(/[^0-9]/g, ''));
    };
    window.addEventListener('lana_settings_updated', handleUpdate);
    return () => window.removeEventListener('lana_settings_updated', handleUpdate);
  }, []);

  // Load history on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      setError('');
      setOrder(null);
      setSearchId('');
      
      try {
        const saved = localStorage.getItem('lana_order_history');
        const historyIds: string[] = saved ? JSON.parse(saved) : [];
        const clientToken = localStorage.getItem('lana_client_token') || localStorage.getItem('lana_admin_token') || '';
        const headers: Record<string, string> = clientToken ? { 'Authorization': `Bearer ${clientToken}` } : {};

        if (historyIds?.length > 0) {
          setLoadingHistory(true);
          Promise.all(
            historyIds.map(async (id) => {
              try {
                const res = await fetch(`/api/orders/${id}`, { headers });
                if (res.ok) return await res.json();
                return null;
              } catch {
                return null;
              }
            })
          ).then(results => {
            const validOrders = (results.filter(Boolean) as Order[]).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setHistoryOrders(validOrders);
            // Auto-select latest active order
            if (validOrders.length > 0) {
              setOrder(validOrders[0]);
            }
          }).catch(err => {
            console.error("Error fetching order history", err);
          }).finally(() => {
            setLoadingHistory(false);
          });
        } else {
          setHistoryOrders([]);
        }
      } catch (e) {
        console.error("Error reading order history", e);
      }
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setError('');

    try {
      const cleanInput = searchId.trim().toUpperCase();
      const clientToken = localStorage.getItem('lana_client_token') || localStorage.getItem('lana_admin_token') || '';
      const headers: Record<string, string> = clientToken ? { 'Authorization': `Bearer ${clientToken}` } : {};

      const res = await fetch(`/api/orders/${cleanInput}`, { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error('Please sign in to your Client Account to view this order.');
        }
        throw new Error('Order not found. Please verify the Order ID.');
      }
      const data = await res.json();
      setOrder(data);

      // Save to customer history automatically
      try {
        const saved = localStorage.getItem('lana_order_history');
        const history: string[] = saved ? JSON.parse(saved) : [];
        if (!history.includes(data.id)) {
          const updated = [data.id, ...history];
          localStorage.setItem('lana_order_history', JSON.stringify(updated));
          setHistoryOrders(prev => {
            if (prev.some(o => o.id === data.id)) return prev;
            return [data, ...prev];
          });
        }
      } catch (e) {
        console.error("Error auto-saving ID", e);
      }
      setSearchId('');
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve order details.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
        />

        {/* Centered Modal Wrapper */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[400px] p-4 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            className="w-full bg-white border border-neutral-200 shadow-xl flex flex-col overflow-hidden max-h-[80vh] md:max-h-[85vh]"
          >
            {/* Header Bar */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 bg-[#FAF9F6]">
              <div>
                <span className="text-[8px] uppercase tracking-[0.4em] font-sans font-bold text-neutral-400 block">
                  LANA
                </span>
                <h3 className="text-xs font-serif font-bold text-neutral-900 uppercase tracking-[0.2em]">
                  {t('Track Order')}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-neutral-400 hover:text-black transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Search Line */}
              <form onSubmit={handleSearch} className="relative pb-1">
                <input 
                  type="text"
                  placeholder={`${t('Order Number')}...`}
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full pb-2 bg-transparent border-b border-neutral-300 focus:border-black focus:outline-none text-[10px] tracking-widest font-sans uppercase text-neutral-900 placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={loading || !searchId.trim()}
                  className="absolute right-0 bottom-2 text-neutral-600 hover:text-black transition-colors disabled:opacity-30 cursor-pointer"
                  aria-label="Search order"
                >
                  {loading ? (
                    <span className="animate-spin block h-3.5 w-3.5 border border-black border-t-transparent rounded-full" />
                  ) : (
                    <Search size={13} />
                  )}
                </button>
              </form>

              {error && (
                <div className="text-[10px] text-red-700 font-sans flex items-center gap-1.5 py-1">
                  <AlertCircle size={11} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Horizontal Row of Recent Orders */}
              {historyOrders.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[7.5px] uppercase tracking-[0.3em] font-sans font-bold text-neutral-400 block">
                    {t('Order History')}
                  </span>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
                    {historyOrders.map((hOrder) => {
                      const isSelected = order?.id === hOrder.id;
                      return (
                        <button
                          key={hOrder.id}
                          onClick={() => {
                            setOrder(hOrder);
                            setError('');
                          }}
                          className={`px-2.5 py-1 text-[9px] font-mono tracking-wider border rounded-none transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-neutral-900 text-white border-neutral-900 font-bold'
                              : 'bg-transparent text-neutral-600 border-neutral-300 hover:border-black hover:text-black'
                          }`}
                        >
                          #{hOrder.id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Order Details Display */}
              {order ? (
                <div className="space-y-5 pt-3 border-t border-neutral-100">
                  <div className="space-y-3 text-center py-4 px-4 bg-[#FAF9F6] border border-neutral-200">
                    <div className="flex justify-center items-center gap-2">
                      <span className={`px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wider ${
                        order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.paymentStatus === 'Paid' ? t('Payment: Paid') : t('Payment: Pending')}
                      </span>
                      <span className="px-2 py-0.5 bg-neutral-100 text-neutral-800 font-bold text-[8.5px] uppercase tracking-wider border border-neutral-300">
                        {t('Order: Pending Payment')}
                      </span>
                    </div>
                  </div>

                  {/* Shipping info */}
                  <div className="text-[10px] font-sans text-neutral-600 space-y-1 text-center">
                    <p>
                      {t('Customer')}: <span className="font-semibold text-neutral-900">{order.customerName}</span>
                    </p>
                    <p>
                      {t('Shipping Address')}: <span className="text-neutral-800">{order.city} • {order.deliveryAddress}</span>
                    </p>
                  </div>

                  {/* Package Items Bill */}
                  <div className="space-y-2">
                    <div className="h-[0.5px] bg-neutral-200" />
                    
                    <div className="space-y-1.5 py-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-baseline text-[10.5px] font-sans text-neutral-800">
                          <span className="pr-3 truncate max-w-[240px]">{item.productName}</span>
                          <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                            {item.quantity}x • ${item.price}.00
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="h-[0.5px] bg-neutral-200" />
                    
                    <div className="flex justify-between items-baseline text-[11px] font-sans text-neutral-900 font-extrabold tracking-wider">
                      <span className="uppercase">{t('Total Amount:')}</span>
                      <span className="font-mono text-xs">${order.totalPrice}.00</span>
                    </div>
                  </div>

                  {/* WhatsApp Enquiry Button */}
                  <a
                    href={`https://wa.me/${dynamicWaNum}?text=Salam%20Lana,%20I%20have%20an%20inquiry%20regarding%20Order%20%23${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-[9px] uppercase tracking-[0.25em] font-sans font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Phone size={11} />
                    <span>{t('Complete Order via WhatsApp')}</span>
                  </a>
                </div>
              ) : (
                <div className="py-8 text-center flex flex-col items-center justify-center space-y-2 bg-[#FAF9F6] border border-neutral-200 p-4">
                  <ShoppingBag size={18} className="text-neutral-400" />
                  <h4 className="text-[10px] font-serif font-bold text-neutral-900 uppercase tracking-wider">{t('Track Order')}</h4>
                  <p className="text-[9px] text-neutral-500 max-w-xs leading-relaxed font-sans">
                    {t('Sign in to view your orders, track shipments, and manage your luxury acquisitions.')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
