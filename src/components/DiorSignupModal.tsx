import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useI18n } from '../i18n';

interface DiorSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail: string;
  onNavigateToView: (view: any) => void;
}

export const DiorSignupModal: React.FC<DiorSignupModalProps> = ({
  isOpen,
  onClose,
  initialEmail,
  onNavigateToView,
}) => {
  const { t } = useI18n();
  const [email, setEmail] = useState(initialEmail);
  const [civility, setCivility] = useState('Mr');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [mode, setMode] = useState<'register' | 'signin'>('register');
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setError('');
      setSuccessMsg('');
      setPassword('');
      setFirstName('');
      setLastName('');
    }
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (!email.trim()) {
      setError('E-mail address is required.');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required to secure your account.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        const fullName = `${civility} ${firstName} ${lastName}`.trim();
        const res = await fetch('/api/customers/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName || email.split('@')[0],
            email: email.trim(),
            password,
            phone,
          }),
        });

        const data = await res.json().catch(() => ({ error: 'Response error' }));
        if (data && data.success) {
          localStorage.setItem('lana_client_session', JSON.stringify(data.customer));
          window.dispatchEvent(new Event('storage'));
          setSuccessMsg('Thank you. Your account has been registered!');
          setTimeout(() => {
            onNavigateToView('account');
            onClose();
          }, 1500);
        } else {
          setError(data.error || 'Failed to register account.');
        }
      } else {
        // signin mode
        const res = await fetch('/api/customers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        });

        const data = await res.json().catch(() => ({ error: 'Response error' }));
        if (data && data.success) {
          localStorage.setItem('lana_client_session', JSON.stringify(data.customer));
          window.dispatchEvent(new Event('storage'));
          setSuccessMsg('Welcome back!');
          setTimeout(() => {
            onNavigateToView('account');
            onClose();
          }, 1500);
        } else {
          setError('Incorrect password or no account found with this email.');
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 select-none font-sans">
      <div className="bg-white max-w-lg md:max-w-2xl w-full relative shadow-2xl border border-neutral-100 flex flex-col justify-between my-4 sm:my-8 max-h-[90vh] overflow-y-auto rounded-none">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-neutral-400 hover:text-black transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X size={18} className="stroke-[1.5]" />
        </button>

        <div className="px-5 py-8 sm:px-10 sm:py-12 md:px-14 md:py-16 space-y-5 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 sm:space-y-3">
            <h2 className="text-lg sm:text-2xl md:text-3xl font-serif text-neutral-900 tracking-wide font-light leading-snug">
              {mode === 'register' ? t('Register') : t('Sign In')}
            </h2>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 tracking-wide">
              {mode === 'register' ? t('Sign in to view your orders, track shipments, and manage your luxury acquisitions.') : t('Sign in to view your orders, track shipments, and manage your luxury acquisitions.')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* E-mail */}
            <div className="relative">
              <label className="block text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                * {t('Email')}
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pb-1 bg-transparent border-b border-neutral-300 text-xs sm:text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors rounded-none placeholder:text-neutral-300"
                  placeholder="name@domain.com"
                />
                {email.includes('@') && email.includes('.') && (
                  <Check size={14} className="text-emerald-600 absolute right-1 bottom-2" />
                )}
              </div>
            </div>

            {mode === 'register' ? (
              <>
                {/* Civility & First name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                      {t('Title')}
                    </label>
                    <select
                      value={civility}
                      onChange={(e) => setCivility(e.target.value)}
                      className="w-full h-10 pb-1 bg-transparent border-b border-neutral-300 text-xs sm:text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors rounded-none cursor-pointer"
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                      * {t('First Name')}
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full h-10 pb-1 bg-transparent border-b border-neutral-300 text-xs sm:text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors rounded-none placeholder:text-neutral-300"
                      placeholder="e.g. Amina"
                    />
                  </div>
                </div>

                {/* Last name */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                    * {t('Last Name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full h-10 pb-1 bg-transparent border-b border-neutral-300 text-xs sm:text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors rounded-none placeholder:text-neutral-300"
                    placeholder="e.g. Al-Saud"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                    {t('Phone')}
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 pb-1 bg-transparent border-b border-neutral-300 text-xs sm:text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors rounded-none placeholder:text-neutral-300 font-mono"
                    placeholder="Phone number"
                  />
                </div>
              </>
            ) : null}

            {/* Password */}
            <div>
              <label className="block text-[10px] sm:text-[11px] text-neutral-400 uppercase tracking-wider mb-1">
                * {t('Password')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 pb-1 bg-transparent border-b border-neutral-300 text-xs sm:text-[14px] text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors rounded-none placeholder:text-neutral-300 font-mono"
                placeholder="••••••••"
              />
            </div>

            {/* Error or Success Msg */}
            {error && (
              <p className="text-xs text-red-600 font-light bg-red-50 p-2 sm:p-3 border border-red-100">{error}</p>
            )}
            {successMsg && (
              <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-2 sm:p-3 border border-emerald-100">{successMsg}</p>
            )}

            {/* Consent Box */}
            {mode === 'register' && (
              <div className="flex items-start gap-2 pt-1 text-neutral-600">
                <input
                  type="checkbox"
                  id="lana-consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 accent-neutral-900 border-neutral-300 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="lana-consent" className="text-[10px] sm:text-[12px] leading-relaxed font-light cursor-pointer">
                  {t('Subscribe')}
                </label>
              </div>
            )}

            {/* Buttons */}
            <div className="space-y-3 sm:space-y-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 sm:h-12 bg-neutral-900 hover:bg-black text-white text-[10px] sm:text-xs uppercase tracking-widest font-medium rounded-none transition-colors flex items-center justify-center cursor-pointer disabled:bg-neutral-400"
              >
                {loading ? t('Processing...') : mode === 'register' ? t('Register') : t('Sign In')}
              </button>

              {/* Toggle Mode Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'register' ? 'signin' : 'register');
                    setError('');
                  }}
                  className="text-[10px] sm:text-xs text-neutral-500 hover:text-black transition-colors underline cursor-pointer"
                >
                  {mode === 'register' ? t('Sign In') : t('Register')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
