import { Sparkle } from 'lucide-react';

export function BackgroundCard({ videoSrc }: { videoSrc: string }) {
  return (
    <div className="rounded-2xl bg-black relative overflow-hidden flex flex-col">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={videoSrc} />
      <div className="relative z-10 flex flex-col h-full p-4 md:p-5">
        <div className="flex items-center justify-center gap-2">
          <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
          <span className="uppercase tracking-[0.22em] text-[11px] text-white/70">BACKGROUND</span>
          <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
        </div>
        <div className="mt-auto grid gap-y-3 gap-x-2" style={{ gridTemplateColumns: 'auto auto 1fr auto' }}>
          {[
            ['2023-Now', 'Freelance Creative', 'Solo Studio'],
            ['2020-2023', 'Head of Brand Design', 'Rove Studio'],
            ['2017-2020', 'Visual Stylist', 'Ember Works'],
          ].map(([year, role, company], i) => (
            <div key={i} className="contents text-[11px] md:text-xs text-white/80">
              <span className="font-medium whitespace-nowrap">{year}</span>
              <Sparkle className="h-3 w-3 text-white/60" strokeWidth={1.5} />
              <span>{role}</span>
              <span className="text-white/50">{company}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
