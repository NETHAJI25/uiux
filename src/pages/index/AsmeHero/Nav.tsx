import { Globe } from 'lucide-react';

export function Nav() {
  return (
    <nav className="relative z-20 px-6 py-6">
      <div className="liquid-glass rounded-full px-6 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-white" />
          <span className="text-white font-semibold text-lg" style={{ fontFamily: 'Inter, sans-serif' }}>Asme</span>
        </div>
        <div className="hidden md:flex items-center gap-8" style={{ fontFamily: 'Inter, sans-serif' }}>
          {['Features', 'Pricing', 'About'].map(l => (
            <a key={l} href="#" className="text-white/80 hover:text-white transition-colors text-sm font-medium">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          <button className="text-white text-sm font-medium">Sign Up</button>
          <button className="liquid-glass rounded-full px-6 py-2 text-white text-sm font-medium">Login</button>
        </div>
      </div>
    </nav>
  );
}
