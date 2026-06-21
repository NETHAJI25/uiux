import { Sparkle, ArrowUpRight } from 'lucide-react';

export function ContactCard() {
  return (
    <div className="rounded-2xl bg-[#324444] p-5 md:p-6 relative noise-overlay flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
          <span className="uppercase tracking-[0.22em] text-[11px] text-white/70">REACH ME</span>
        </div>
        <p className="text-sm text-white/80">hi@maxreed.com</p>
        <p className="text-sm text-white/80">+44 207 81 63</p>
      </div>
      <button className="liquid-glass h-9 w-9 rounded-full flex items-center justify-center shrink-0">
        <ArrowUpRight className="h-4 w-4 text-white" strokeWidth={1.5} />
      </button>
    </div>
  );
}
