import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const navLinks = ['Features', 'Solutions', 'Pricing', 'About'];

export function MobileMenu({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-white/95 backdrop-blur-xl md:hidden"
        >
          <div className="flex justify-end p-6">
            <button onClick={() => setMenuOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-8 mt-12">
            {navLinks.map((l) => (
              <a key={l} href="#" className="text-xl font-medium">
                {l}
              </a>
            ))}
            <button className="px-8 py-3 rounded-full bg-black text-white text-lg font-medium">
              Get Started
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
