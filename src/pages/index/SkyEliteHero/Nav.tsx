import { Menu, X } from 'lucide-react';

export function Nav({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (v: boolean) => void }) {
  return (
    <nav className="flex items-center justify-between max-w-7xl mx-auto w-full px-8 py-6">
      <span className="text-2xl font-semibold text-gray-900">SkyElite</span>
      <div className="hidden md:flex items-center gap-8">
        {['Start', 'Story', 'Rates', 'Benefits', 'FAQ'].map(l => (
          <a key={l} href="#" className="text-gray-900 hover:text-gray-700 transition-colors text-sm">{l}</a>
        ))}
      </div>
      <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-gray-900">
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </nav>
  );
}
