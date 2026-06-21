import { Sparkle } from 'lucide-react';

export function TestimonialCard() {
  return (
    <div className="rounded-2xl bg-[#324444] p-5 md:p-6 relative noise-overlay">
      <div className="flex items-center justify-start gap-2 mb-3">
        <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
        <span className="uppercase tracking-[0.22em] text-[11px] text-white/70">CLIENT VOICE</span>
      </div>
      <p className="text-[13px] sm:text-[13.5px] leading-[1.6] text-white/85">Max reshaped our image with a degree of finesse and vision that surpassed what we'd hoped for. The process felt graceful, and the outcomes speak for themselves.</p>
      <p className="mt-3 text-xs text-white/60"><strong className="text-white/85">Elena Brooks</strong>, Creative Director — Halcyon</p>
    </div>
  );
}
