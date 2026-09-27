import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Package, Heart, MapPin, CreditCard, Sparkles, MessageSquare, ArrowRight, CheckCircle2, Clock, Shield } from 'lucide-react';
import { Order, Product } from '../types';

interface AccountPortalProps {
  orders?: Order[];
  wishlistProducts?: Product[];
  wishlistItems?: Product[];
  onSelectProduct?: (product: Product) => void;
  onNavigateToCatalog?: () => void;
  onOpenAdmin?: () => void;
  onNavigateHome?: () => void;
  onOpenWishlist?: () => void;
}

export const AccountPortal: React.FC<AccountPortalProps> = ({
  orders = [],
  wishlistProducts = [],
  wishlistItems = [],
  onSelectProduct = (_product: Product) => {},
  onNavigateToCatalog = () => {},
  onOpenAdmin = () => {}
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'profile' | 'addresses' | 'concierge'>('orders');
  const safeWishlist = wishlistProducts.length > 0 ? wishlistProducts : wishlistItems;

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'signin' | 'register'>('signin');
  const [authStep, setAuthStep] = useState<1 | 2>(1);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('lana_client_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loadedOrders, setLoadedOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [regNotice, setRegNotice] = useState('');
  const [authError, setAuthError] = useState('');

  React.useEffect(() => {
    if (!currentUser) {
      setLoadedOrders([]);
      return;
    }
    const token = localStorage.getItem('lana_client_token');
    
    async function fetchMyOrders() {
      setIsLoadingOrders(true);
      try {
        const res = await fetch('/api/customers/me/orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setLoadedOrders(data);
          }
        } else {
          setLoadedOrders(orders);
        }
      } catch (err) {
        console.error('Failed to load private customer orders:', err);
        setLoadedOrders(orders);
      } finally {
        setIsLoadingOrders(false);
      }
    }

    fetchMyOrders();
  }, [currentUser, orders]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (authStep === 1) {
      const emailVal = regEmail.trim();
      if (!emailVal) {
        setAuthError('Please enter your email address.');
        return;
      }
      if (!emailVal.includes('@')) {
        setAuthError('Please enter a valid email address.');
        return;
      }
      setAuthStep(2);
      return;
    }

    if (!regPassword) {
      setAuthError('Please enter your password.');
      return;
    }

    try {
      if (modalMode === 'register') {
        const res = await fetch('/api/customers/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: regName || regEmail.split('@')[0],
            email: regEmail,
            password: regPassword,
            phone: regPhone
          })
        });

        const data = await res.json().catch(() => ({ error: 'Error processing response' }));
        if (data && data.success) {
          setCurrentUser(data.customer);
          localStorage.setItem('lana_client_session', JSON.stringify(data.customer));
          if (data.token) {
            localStorage.setItem('lana_client_token', data.token);
          }
          setRegNotice('Account created successfully.');
          setTimeout(() => {
            setIsRegisterOpen(false);
            setRegNotice('');
          }, 1500);
        } else {
          setAuthError(data.error || 'Failed to create account.');
        }
      } else {
        // Sign In mode
        const res = await fetch('/api/customers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: regEmail,
            password: regPassword
          })
        });

        const data = await res.json().catch(() => ({ error: 'Error processing response' }));
        if (data && data.success) {
          setCurrentUser(data.customer);
          localStorage.setItem('lana_client_session', JSON.stringify(data.customer));
          if (data.token) {
            localStorage.setItem('lana_client_token', data.token);
          }
          setRegNotice('Welcome back! Authentication successful.');
          setTimeout(() => {
            setIsRegisterOpen(false);
            setRegNotice('');
          }, 1500);
        } else {
          setAuthError(data.error || 'Invalid email or password.');
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setAuthError('Connection error. Please try again.');
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] text-neutral-900 font-sans pt-28 pb-28 flex items-center justify-center px-4">
        <div className="bg-white max-w-md w-full p-8 space-y-6 border border-neutral-200/80 shadow-xl">
          <div className="text-center space-y-2">
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-amber-800">Maison LANA</span>
            <h2 className="text-2xl font-serif font-light uppercase tracking-wide text-neutral-950">
              {modalMode === 'register' ? 'Create Client Account' : 'Client Access Portal'}
            </h2>
            <p className="text-xs text-neutral-500 font-light max-w-xs mx-auto">
              {modalMode === 'register'
                ? 'Register your private profile to track orders, manage residencies, and explore curated niche items.'
                : 'Enter your registered credentials to access your private account details and order status.'}
            </p>
          </div>

          {/* Tab Mode Switcher */}
          <div className="flex border-b border-neutral-100 pb-2 gap-6 justify-center">
            <button
              type="button"
              onClick={() => { setModalMode('signin'); setAuthStep(1); setAuthError(''); }}
              className={`text-xs uppercase tracking-widest font-serif transition-all cursor-pointer pb-2 ${
                modalMode === 'signin' ? 'text-amber-800 font-bold border-b-2 border-amber-800' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setModalMode('register'); setAuthStep(1); setAuthError(''); }}
              className={`text-xs uppercase tracking-widest font-serif transition-all cursor-pointer pb-2 ${
                modalMode === 'register' ? 'text-amber-800 font-bold border-b-2 border-amber-800' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Register
            </button>
          </div>

          {regNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center">
              {regNotice}
            </div>
          )}

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs font-sans">
            {authStep === 1 ? (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="client@domain.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full p-3 border border-neutral-200 focus:outline-none focus:border-neutral-950 bg-neutral-50/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-neutral-900 text-white text-xs uppercase tracking-widest font-bold hover:bg-amber-900 transition-colors cursor-pointer mt-2"
                >
                  Continue →
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-400 block">Logging in as</span>
                    <span className="font-mono text-neutral-800 font-medium">{regEmail}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthStep(1)}
                    className="text-[10px] text-amber-800 hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {modalMode === 'register' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amina Al-Saud"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full p-3 border border-neutral-200 focus:outline-none focus:border-neutral-950 bg-neutral-50/50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Account Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your account password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full p-3 border border-neutral-200 focus:outline-none focus:border-neutral-950 bg-neutral-50/50 font-mono"
                  />
                </div>

                {modalMode === 'register' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+966 50 123 4567"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full p-3 border border-neutral-200 focus:outline-none focus:border-neutral-950 bg-neutral-50/50 font-mono"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAuthStep(1)}
                    className="w-1/3 py-4 border border-neutral-300 text-neutral-700 text-xs uppercase tracking-widest font-bold hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-4 bg-neutral-900 text-white text-xs uppercase tracking-widest font-bold hover:bg-amber-900 transition-colors cursor-pointer"
                  >
                    {modalMode === 'register' ? 'Register & Save' : 'Sign In'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-neutral-900 font-sans pt-24 pb-28">
      {/* Top Client Header */}
      <div className="max-w-[1500px] mx-auto px-6 sm:px-12 py-10 border-b border-neutral-200/80 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-neutral-900 text-white flex items-center justify-center font-serif text-2xl font-light">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.35em] font-bold text-amber-800">
                  MAISON PRIVILÈGE MEMBER
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[8.5px] uppercase font-bold tracking-widest">
                  {currentUser.memberTier || 'VIP'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-light uppercase tracking-wide">
                Welcome, {currentUser.name}
              </h1>
              <p className="text-xs text-neutral-400 font-mono">
                Maison ID: LANA-{currentUser.id?.toUpperCase() || 'VIP'} • Member since {currentUser.memberSince || '2026'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const token = localStorage.getItem('lana_client_token');
                if (token) {
                  fetch('/api/customers/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                  }).catch(() => {});
                }
                localStorage.removeItem('lana_client_session');
                localStorage.removeItem('lana_client_token');
                setCurrentUser(null);
                setRegEmail('');
                setRegPassword('');
              }}
              className="px-5 py-2.5 bg-red-950 text-white hover:bg-red-900 text-[10px] uppercase font-bold tracking-[0.2em] flex items-center gap-2 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
            <a
              href="https://wa.me/966500000000"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 border border-emerald-600 text-emerald-800 hover:bg-emerald-50 text-[10px] uppercase font-bold tracking-[0.2em] flex items-center gap-2 transition-colors"
            >
              <MessageSquare size={13} />
              <span>Private Concierge</span>
            </a>
            <button
              onClick={onOpenAdmin}
              className="px-5 py-2.5 bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Shield size={13} />
              <span>Atelier Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1500px] mx-auto px-6 sm:px-12 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Navigation Tabs (3 cols) */}
          <div className="lg:col-span-3 space-y-1 bg-white p-4 border border-neutral-200 self-start">
            {[
              { id: 'orders', label: 'My Acquisitions & Orders', icon: Package, badge: (loadedOrders?.length || 0) },
              { id: 'wishlist', label: 'Saved Wishlist', icon: Heart, badge: (safeWishlist?.length || 0) },
              { id: 'profile', label: 'Client Profile & Scent', icon: User },
              { id: 'addresses', label: 'Delivery Residences', icon: MapPin },
              { id: 'concierge', label: 'Maison Concierge Service', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between p-3.5 text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                  {typeof tab.badge === 'number' && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 ${activeTab === tab.id ? 'bg-white/20' : 'bg-neutral-100 text-neutral-600'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Content Panels (9 cols) */}
          <div className="lg:col-span-9 bg-white p-8 border border-neutral-200">
            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-serif font-light uppercase tracking-wide">
                      Order History &amp; White-Glove Tracking
                    </h2>
                    <p className="text-xs text-neutral-500 font-sans mt-1">
                      Monitor dispatch, artisan inspection, and courier delivery status.
                    </p>
                  </div>
                </div>

                {isLoadingOrders ? (
                  <div className="py-12 flex flex-col justify-center items-center text-neutral-400 font-sans text-xs space-y-2">
                    <span className="animate-spin text-lg">⏳</span>
                    <span>Loading your secure adquisitions...</span>
                  </div>
                ) : loadedOrders.length > 0 ? (
                  <div className="space-y-6">
                    {loadedOrders.map((order) => (
                      <div key={order.id} className="border border-neutral-200 p-6 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 pb-4 text-xs font-sans">
                          <div>
                            <span className="text-neutral-400 uppercase text-[9px] font-bold block">ORDER REFERENCE</span>
                            <span className="font-mono font-bold text-neutral-900">{order.id}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 uppercase text-[9px] font-bold block">DATE</span>
                            <span className="text-neutral-700">{new Date(order.createdAt || (order as any).date || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400 uppercase text-[9px] font-bold block">PAYMENT</span>
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              order.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                            }`}>
                              {order.paymentStatus || 'Pending'}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-400 uppercase text-[9px] font-bold block">ORDER STATUS</span>
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                              order.status === 'Completed' ? 'bg-emerald-50 text-emerald-800' :
                              order.status === 'Dispatched' ? 'bg-blue-50 text-blue-800' :
                              order.status === 'In Progress' ? 'bg-indigo-50 text-indigo-800' :
                              'bg-neutral-100 text-neutral-800'
                            }`}>
                              {order.status === 'Pending' ? 'Pending Payment' : order.status}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-400 uppercase text-[9px] font-bold block">AMOUNT</span>
                            <span className="font-mono font-bold text-neutral-900">${(order.totalPrice || (order as any).totalAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Items in order */}
                        <div className="divide-y divide-neutral-100">
                          {(order.items || []).map((item, idx) => (
                            <div key={item.productId || idx} className="py-3 flex items-center justify-between gap-4 text-xs">
                              <div className="flex items-center gap-4">
                                {item.image ? (
                                  <img src={item.image} alt={item.productName || (item as any).name} className="w-12 h-16 object-cover bg-neutral-100" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-12 h-16 bg-neutral-100 border border-neutral-200" />
                                )}
                                <div>
                                  <h4 className="font-serif font-normal uppercase text-neutral-900">{item.productName || (item as any).name}</h4>
                                  <span className="text-neutral-400 font-mono text-[10px]">Qty: {item.quantity}</span>
                                </div>
                              </div>
                              <span className="font-mono font-semibold text-neutral-900">${((item.price || (item as any).retailPrice || 0) * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        {/* Courier Tracking Status */}
                        <div className="bg-neutral-50 p-4 text-xs text-neutral-600 flex items-center justify-between font-mono">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-emerald-700" />
                            <span>Tracking: {order.id ? `SA-${order.id}` : 'SA-LANA-882194'}</span>
                          </div>
                          <span className="text-neutral-900 font-bold">Estimated Delivery: Next Day White-Glove</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-4">
                    <p className="font-serif text-lg text-neutral-400 italic">
                      No order acquisitions recorded yet.
                    </p>
                    <button
                      onClick={onNavigateToCatalog}
                      className="px-6 py-2.5 bg-neutral-900 text-white text-[10px] uppercase tracking-widest font-bold cursor-pointer"
                    >
                      Browse Boutique
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* WISHLIST TAB */}
            {activeTab === 'wishlist' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="text-xl font-serif font-light uppercase tracking-wide">
                    Saved Creations ({safeWishlist.length})
                  </h2>
                </div>

                {safeWishlist.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    {safeWishlist.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => onSelectProduct(p)}
                        className="group cursor-pointer space-y-3"
                      >
                        <div className="aspect-[3/4] bg-neutral-100 overflow-hidden">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-200" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold block">
                            {p.brand || p.category}
                          </span>
                          <h4 className="text-xs font-serif font-normal uppercase text-neutral-900 line-clamp-1">
                            {p.name}
                          </h4>
                          <span className="text-xs font-semibold text-neutral-900 block font-mono">
                            ${p.retailPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center space-y-4">
                    <p className="font-serif text-lg text-neutral-400 italic">
                      Your wishlist is currently empty.
                    </p>
                    <button
                      onClick={onNavigateToCatalog}
                      className="px-6 py-2.5 bg-neutral-900 text-white text-[10px] uppercase tracking-widest font-bold"
                    >
                      Discover Creations
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6 text-xs font-sans">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="text-xl font-serif font-light uppercase tracking-wide">
                    Client Profile &amp; Scent Signature
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block uppercase tracking-wider text-neutral-500 mb-1 font-bold">Full Name</label>
                    <input type="text" defaultValue="Amina Al-Saud" className="w-full border border-neutral-300 p-3 bg-neutral-50" />
                  </div>
                  <div>
                    <label className="block uppercase tracking-wider text-neutral-500 mb-1 font-bold">Email Address</label>
                    <input type="email" defaultValue="client@lanaluxury.com" className="w-full border border-neutral-300 p-3 bg-neutral-50" />
                  </div>
                  <div>
                    <label className="block uppercase tracking-wider text-neutral-500 mb-1 font-bold">Preferred Scent Family</label>
                    <input type="text" defaultValue="Damask Rose & Royal Amber Oud" className="w-full border border-neutral-300 p-3 bg-neutral-50" />
                  </div>
                  <div>
                    <label className="block uppercase tracking-wider text-neutral-500 mb-1 font-bold">Anniversary / Birthday</label>
                    <input type="text" defaultValue="October 14 (Complimentary Gift Active)" className="w-full border border-neutral-300 p-3 bg-neutral-50" />
                  </div>
                </div>

                <button className="px-8 py-3 bg-neutral-900 text-white text-[10px] uppercase font-bold tracking-widest">
                  Save Changes
                </button>
              </div>
            )}

            {/* ADDRESSES TAB */}
            {activeTab === 'addresses' && (
              <div className="space-y-6 text-xs font-sans">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="text-xl font-serif font-light uppercase tracking-wide">
                    Saved Residences
                  </h2>
                </div>

                <div className="border border-neutral-200 p-6 space-y-2 bg-neutral-50">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider text-neutral-900">Primary Villa Residence (Riyadh)</span>
                    <span className="px-2 py-0.5 bg-neutral-900 text-white text-[8px] font-bold uppercase">DEFAULT</span>
                  </div>
                  <p className="text-neutral-600">Olaya District, Prince Mohammed Bin Abdulaziz Rd, Riyadh 12211, Saudi Arabia</p>
                  <p className="text-neutral-400 font-mono">+966 50 123 4567</p>
                </div>
              </div>
            )}

            {/* CONCIERGE TAB */}
            {activeTab === 'concierge' && (
              <div className="space-y-6">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="text-xl font-serif font-light uppercase tracking-wide">
                    Private Maison Concierge
                  </h2>
                </div>

                <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                  As a Privilège client, you enjoy dedicated 24/7 personal shopper assistance, bespoke fragrance sourcing, private runway reservations, and direct home tailoring appointments.
                </p>

                <div className="p-6 bg-[#FAF9F5] border border-neutral-200 space-y-4">
                  <h4 className="font-serif text-lg uppercase font-light">Direct Artisan Channel</h4>
                  <p className="text-xs text-neutral-500 font-sans">
                    Reach our Paris &amp; Riyadh client relations team instantly via verified WhatsApp.
                  </p>
                  <a
                    href="https://wa.me/966500000000"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-800 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-emerald-900 transition-colors"
                  >
                    <MessageSquare size={14} />
                    <span>Initiate WhatsApp Session</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
