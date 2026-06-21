import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

const services = ['Brand', 'Digital', 'Campaign', 'Other'];

export function ServiceSelector() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleService = (s: string) => {
    setSelected(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <div>
      <h2 className="text-2xl font-medium tracking-tight mb-2">What sort of service?</h2>
      <p className="opacity-85 text-[#738273] mb-8">Select all that apply</p>
      <div className="flex flex-wrap gap-3">
        {services.map(s => {
          const active = selected.includes(s);
          return (
            <motion.button key={s} onClick={() => toggleService(s)} whileTap={{ scale: 0.97 }}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium transition-all ${
                active ? 'bg-[#1C2E1E] text-white shadow-md shadow-emerald-950/5' : 'bg-white text-[#1C2E1E] border border-[#F1F3F1] hover:bg-[#F1F3F1]/55'
              }`}>
              {active && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  <Check className="w-4 h-4" />
                </motion.span>
              )}
              {s}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {selected.length === 0 ? (
          <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="opacity-50 italic text-xs mt-4">
            Please click to select services above.
          </motion.p>
        ) : (
          <motion.div key="active" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4">
            <div className="bg-[#FAFBF9] border rounded-2xl p-4 flex items-center justify-between">
              <span className="text-sm text-[#5A635A]">Ready to inquire about: <strong>{selected.join(', ')}</strong></span>
              <button className="text-[#4D6D47] uppercase text-xs font-medium flex items-center gap-1">Let's Go <Check className="w-3 h-3" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
