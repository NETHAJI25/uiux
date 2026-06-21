import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';

const navLinks = ['Features', 'Solutions', 'Pricing', 'About'];

export function Nav({ scrolled, setMenuOpen }: { scrolled: boolean; setMenuOpen: (v: boolean) => void }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <span className="text-2xl font-bold tracking-tight">Mentality</span>
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a key={l} href="#" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
              {l}
            </a>
          ))}
          <button className="px-5 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors">
            Get Started
          </button>
        </div>
        <button className="md:hidden" onClick={() => setMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </motion.nav>
  );
}
