export function Hero() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 pt-32 pb-40" style={{ paddingTop: 'calc(8rem - 75px)' }}>
      <h1 className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal text-white animate-fade-rise" style={{ fontFamily: "'Instrument Serif', serif" }}>
        Where <em className="not-italic text-white/60">dreams</em> rise<br />through <em className="not-italic text-white/60">the silence.</em>
      </h1>
      <p className="text-white/60 text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">We're designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.</p>
      <button className="liquid-glass rounded-full px-14 py-5 text-base text-white mt-12 hover:scale-[1.03] cursor-pointer animate-fade-rise-delay-2">Begin Journey</button>
    </div>
  );
}
