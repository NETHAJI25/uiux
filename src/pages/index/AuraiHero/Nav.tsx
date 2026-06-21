import { Menu, X } from 'lucide-react';

export function Nav({ menuOpen, setMenuOpen }: { menuOpen: boolean; setMenuOpen: (v: boolean) => void }) {
  return (
    <nav className="flex items-center justify-between">
      <div className="flex items-center bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 px-4 py-2.5 sm:px-6 sm:py-4">
        <svg viewBox="0 0 256 256" className="w-5 h-5 sm:w-7 sm:h-7 text-white fill-current">
          <path d="M 228 0 C 172.772 0 128 44.772 128 100 L 128 0 L 0 0 L 0 28 C 0 83.228 44.772 128 100 128 L 0 128 L 0 256 L 28 256 C 83.228 256 128 211.228 128 156 L 128 256 L 256 256 L 256 228 C 256 172.772 211.228 128 156 128 L 256 128 L 256 0 Z" />
        </svg>
        <span className="font-askan text-white text-base sm:text-xl tracking-wide ml-2">Aurai</span>
        <button onClick={() => setMenuOpen(!menuOpen)} className="ml-4 sm:ml-32 md:ml-64 lg:ml-96 text-white">
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      <button className="hidden sm:block bg-white text-gray-900 font-medium text-sm px-6 py-3 rounded-full hover:bg-gray-100 transition">Join the list</button>
    </nav>
  );
}
