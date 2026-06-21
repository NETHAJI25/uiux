export function StatBadges() {
  return (
    <>
      <div className="absolute text-right" style={{ right: '1.5rem', top: '14%' }}>
        <div className="flex items-center gap-3 justify-end">
          <div className="hidden md:block h-px w-24 bg-white/40 rotate-[20deg]" />
          <span className="text-4xl md:text-5xl font-medium tracking-tight">+65k</span>
        </div>
        <p className="text-xs md:text-sm text-white/70 mt-1">startups use</p>
      </div>
      <div className="absolute" style={{ left: '1.5rem', bottom: '5rem' }}>
        <div className="flex items-center gap-3">
          <span className="text-4xl md:text-5xl font-medium tracking-tight">+1.5b</span>
          <div className="hidden md:block h-px w-24 bg-white/40 -rotate-[20deg]" />
        </div>
        <p className="text-xs md:text-sm text-white/70 mt-1">gb data was protected</p>
      </div>
      <div className="absolute text-right" style={{ right: '1.5rem', bottom: '4rem' }}>
        <div className="flex items-center gap-3 justify-end">
          <div className="hidden md:block h-px w-24 bg-white/40 -rotate-[20deg]" />
          <span className="text-4xl md:text-5xl font-medium tracking-tight">+300k</span>
        </div>
        <p className="text-xs md:text-sm text-white/70 mt-1 text-right">downloads</p>
      </div>
    </>
  );
}
