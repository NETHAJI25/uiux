import { Menu } from 'lucide-react';

export function Nav({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f5f3ef]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <span className="text-lg font-semibold tracking-tight">Viktor Oddy</span>
        <div className="hidden md:flex items-center gap-8">
          {['Work', 'About', 'Services', 'Contact'].map((l) => (
            <a key={l} href="#" className="text-sm text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-colors">
              {l}
            </a>
          ))}
        </div>
        <button className="md:hidden" onClick={onMenuOpen}>
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
