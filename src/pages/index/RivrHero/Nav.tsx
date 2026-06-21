import { Wallet, Coins } from 'lucide-react';

export function Nav() {
  return (
    <nav className="relative z-20 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <span className="text-xl font-bold tracking-tight flex items-center gap-2">
        <Coins className="w-5 h-5 text-blue-400" />
        RIVR
      </span>
      <div className="hidden md:flex items-center gap-8">
        {['Swap', 'Pool', 'Dashboard', 'Analytics'].map((l) => (
          <a key={l} href="#" className={`text-sm font-medium transition-colors ${l === 'Swap' ? 'text-white' : 'text-white/30 hover:text-white/60'}`}>{l}</a>
        ))}
      </div>
      <button className="px-5 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-all flex items-center gap-2">
        <Wallet className="w-4 h-4" />
        Connect
      </button>
    </nav>
  );
}
