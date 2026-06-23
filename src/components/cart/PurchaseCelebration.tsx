import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Sparkles, X } from 'lucide-react';

interface PurchaseCelebrationProps {
  isOpen: boolean;
  isArabic: boolean;
  productName?: string;
  onClose: () => void;
}

export const PurchaseCelebration: React.FC<PurchaseCelebrationProps> = ({
  isOpen,
  isArabic,
  productName,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md mx-auto text-center overflow-hidden"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 -z-10" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Animated trophy icon */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, -5, 5, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
              }}
              className="mb-6"
            >
              <div className="text-6xl mx-auto w-fit">🏆</div>
            </motion.div>

            {/* Sparkles */}
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  opacity: 0,
                  x: 0,
                  y: 0,
                }}
                animate={{
                  opacity: [1, 0],
                  x: Math.cos((i / 5) * Math.PI * 2) * 100,
                  y: Math.sin((i / 5) * Math.PI * 2) * 100,
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                style={{
                  left: '50%',
                  top: '50%',
                  marginLeft: '-8px',
                  marginTop: '-8px',
                }}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
              </motion.div>
            ))}

            {/* Text content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isArabic ? '🏆 اكتشاف جديد!' : '🏆 New Discovery Unlocked!'}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {isArabic
                  ? 'تم إضافة اختيارك الجديد إلى جواز القهوة الخاص بك'
                  : 'Your new coffee has been added to your Coffee Passport'}
              </p>

              {productName && (
                <div className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    {isArabic ? 'الاختيار:' : 'Added:'}
                  </p>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    {productName}
                  </p>
                </div>
              )}

              <motion.p
                className="text-gray-600 dark:text-gray-400 text-sm"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isArabic
                  ? '⭐ واصل رحلتك مع القهوة واستكشف نكهات جديدة'
                  : '⭐ Continue your coffee journey and discover more flavors'}
              </motion.p>
            </motion.div>

            {/* Action button */}
            <motion.button
              onClick={onClose}
              className="mt-8 w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isArabic ? 'رائع!' : 'Awesome!'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
