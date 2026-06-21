import { ArrowUpRight } from 'lucide-react';

const navLinks = ['Projects', 'Studio', 'Offerings', 'Inquire'];

export function Nav({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5 lg:py-7">
      <span className="font-podium text-white font-bold uppercase text-2xl sm:text-3xl tracking-wider">VANGUARD</span>
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map(l => <a key={l} href="#" className="font-inter text-sm text-white/80 tracking-widest uppercase hover:text-white transition">{l}</a>)}
      </div>
      <div className="hidden md:flex items-center">
        <a href="#" className="flex items-center gap-2 border border-white/30 hover:border-white/60 px-6 py-3 text-xs tracking-widest uppercase text-white hover:bg-white/10 transition-all">GET IN TOUCH <ArrowUpRight className="w-3.5 h-3.5" /></a>
      </div>
      <button onClick={onMenuOpen} className="md:hidden flex flex-col items-end space-y-1.5">
        <div className="w-6 h-0.5 bg-white" /><div className="w-6 h-0.5 bg-white" /><div className="w-4 h-0.5 bg-white" />
      </button>
    </nav>
  );
}
