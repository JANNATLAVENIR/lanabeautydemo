import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, Type, Zap } from 'lucide-react';
import { useI18n } from '../i18n';

export interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  largeText: boolean;
  setLargeText: (val: boolean) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  highContrast,
  setHighContrast,
  reducedMotion,
  setReducedMotion,
  largeText,
  setLargeText
}) => {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="w-full sm:max-w-md bg-white text-neutral-900 flex flex-col font-sans shadow-2xl rounded-t-2xl sm:rounded-none overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="font-serif text-xl tracking-wider text-neutral-900">
              {t('Accessibility')}
            </h3>
            <button onClick={onClose} className="p-1.5 text-neutral-500 hover:text-black cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye size={18} className="text-neutral-700" />
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900 block">
                    {t('High Contrast')}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={highContrast}
                onChange={(e) => setHighContrast(e.target.checked)}
                className="w-5 h-5 accent-black cursor-pointer"
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-neutral-700" />
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900 block">
                    {t('Reduced Motion')}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="w-5 h-5 accent-black cursor-pointer"
              />
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type size={18} className="text-neutral-700" />
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-neutral-900 block">
                    {t('Enlarged Typography')}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={largeText}
                onChange={(e) => setLargeText(e.target.checked)}
                className="w-5 h-5 accent-black cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-neutral-900 text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {t('Save Changes')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
