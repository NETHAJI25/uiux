import { Menu, X } from 'lucide-react';

const navLinks = ['Anthology', 'Talents', 'Sound diary', 'Playback salon'];

export function Header({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 256 256" className="w-5 h-5 fill-white"><path d="M 256 256 L 128 256 C 198.692 256 256 198.692 256 128 C 256 57.308 198.692 0 128 0 C 57.308 0 0 57.308 0 128 C 0 198.692 57.308 256 128 256 L 0 256 L 0 0 L 256 0 Z M 128 104 C 141.255 104 152 114.745 152 128 C 152 141.255 141.255 152 128 152 C 114.745 152 104 141.255 104 128 C 104 114.745 114.745 104 128 104 Z" /></svg>
        <span className="text-base tracking-tight text-white">quietpress</span>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map(l => <a key={l} href="#" className="text-sm text-white/90 hover:text-white">{l}</a>)}
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-xl bg-white p-1 pr-3 sm:pr-4 flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform">
          <span className="h-7 w-7 rounded-lg bg-blue-700 flex items-center justify-center"><svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></span>
          <span className="text-gray-900 text-sm"><span className="hidden sm:inline">Cart </span>(0)</span>
        </button>
        <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden liquid-glass h-9 w-9 rounded-xl flex items-center justify-center text-white">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </header>
  );
}
