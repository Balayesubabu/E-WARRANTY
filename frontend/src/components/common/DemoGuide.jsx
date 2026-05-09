import { motion, AnimatePresence } from 'motion/react';
import { Info, X, ShoppingBag, Store, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DemoGuide() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show guide after 2 seconds on first load
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-6 right-6 z-40 max-w-md mx-auto"
      >
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 shadow-2xl text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white mb-2">Demo Mode Active</h3>
              <p className="text-slate-300 text-sm mb-3">
                Test all 3 user types! Use the floating button (bottom right) to switch between:
              </p>
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-200">Customer - View warranties</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Store className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-200">Dealer - Register products</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Crown className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-200">Owner - Full analytics</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
