import { ArrowRight, Menu, X } from 'lucide-react';

interface NavProps {
  navLinks: string[];
  mobileMenuOpen: boolean;
  toggleMenu: () => void;
}

export const Nav = ({ navLinks, mobileMenuOpen, toggleMenu }: NavProps) => {
  return (
    <nav className="flex items-center justify-between px-6 md:px-12 lg:px-16 py-5">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 480 480" className="w-8 h-8" fill="white"><path d="M480 240a240 240 0 0 0-240 240 240 240 0 0 0 240-240Z"/><path d="M240 0A240 240 0 0 0 0 240 240 240 0 0 0 240 0Z"/><path d="M480 240A240 240 0 0 0 240 0a240 240 0 0 0 240 240Z"/><path d="M240 480A240 240 0 0 0 0 240a240 240 0 0 0 240 240Z"/></svg>
        <span className="text-white text-xl font-bold tracking-wider">NEXOVA</span>
      </div>
      <div className="hidden lg:flex items-center gap-8">
        {navLinks.map(l => <a key={l} href="#" className="text-white/80 hover:text-white text-sm tracking-wide transition-colors duration-200">{l}</a>)}
      </div>
      <div className="hidden lg:flex">
        <button className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-white text-sm font-semibold px-6 py-2.5 rounded-full flex items-center gap-2">LOG IN <ArrowRight className="w-4 h-4" /></button>
      </div>
      <button onClick={toggleMenu} className="lg:hidden z-[60] relative w-6 h-6">
        <Menu className={`absolute inset-0 w-6 h-6 text-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
        <X className={`absolute inset-0 w-6 h-6 text-white transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
      </button>
    </nav>
  );
};
