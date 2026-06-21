import { useState } from 'react';

export function SwapWidget() {
  const [activeTab, setActiveTab] = useState<'swap' | 'pool'>('swap');

  return (
    <div className="w-full max-w-md p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5">
        {(['swap', 'pool'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-blue-500 text-white' : 'text-white/40 hover:text-white/60'}`}>{t}</button>
        ))}
      </div>
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <span className="text-sm text-white/40">ETH</span>
          <div className="text-right">
            <p className="text-sm font-medium">$3,842</p>
            <span className="text-xs text-green-400">+5.2%</span>
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
          <span className="text-sm text-white/40">RIVR</span>
          <div className="text-right">
            <p className="text-sm font-medium">$12.45</p>
            <span className="text-xs text-green-400">+18.3%</span>
          </div>
        </div>
      </div>
      <button className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-all">Swap Tokens</button>
    </div>
  );
}
