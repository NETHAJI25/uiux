import { Menu } from 'lucide-react';

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 mix-blend-difference">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight">MAINFRAME</span>
        <div className="hidden md:flex items-center gap-8">
          {['Work', 'Services', 'About', 'Contact'].map((l) => (
            <a key={l} href="#" className="text-sm text-white/60 hover:text-white transition-colors">
              {l}
            </a>
          ))}
        </div>
        <Menu className="w-5 h-5 text-white/60 cursor-pointer" />
      </div>
    </nav>
  );
}
