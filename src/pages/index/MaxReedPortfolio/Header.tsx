export function Header() {
  return (
    <div className="flex items-start justify-between mb-6 md:mb-8 max-w-3xl">
      <div className="max-w-3xl">
        <h1 className="text-[28px] sm:text-3xl md:text-4xl lg:text-[44px] leading-[1.15] font-normal tracking-tight text-white">Hi, I'm Max Reed!</h1>
        <p className="text-sm md:text-[15px] leading-[1.6] text-white/60 max-w-3xl mt-2">A London-based independent creator shaping sharp visual systems, web-ready products, and story-first campaigns. With a decade of craft behind me, I help ideas move with focus and intention.</p>
      </div>
      <button className="hidden sm:flex liquid-glass rounded-full px-5 sm:px-6 py-2.5 sm:py-3 text-white text-sm shrink-0">Let's Team Up Today</button>
    </div>
  );
}
