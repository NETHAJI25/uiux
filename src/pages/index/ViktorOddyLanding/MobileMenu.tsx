import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function MobileMenu({ menuOpen, onClose }: { menuOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-[#f5f3ef] md:hidden"
        >
          <div className="flex justify-end p-6">
            <button onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-8 mt-12">
            {['Work', 'About', 'Services', 'Contact'].map((l) => (
              <a key={l} href="#" className="text-2xl font-light">
                {l}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
