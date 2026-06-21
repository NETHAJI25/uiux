export function Hero() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-28 sm:pt-36 md:pt-44">
      <div className="liquid-glass rounded-lg px-4 py-1.5 text-xs sm:text-sm text-white animate-fade-up delay-1" style={{ background: 'rgba(255,255,255,0.16)' }}>Press 04 . Vernal woods</div>
      <h1 className="max-w-3xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1] text-white text-center animate-fade-up delay-2 mt-5 sm:mt-6">
        records cut for the<br />calm listener.
      </h1>
      <p className="mt-5 sm:mt-6 max-w-md text-sm sm:text-base md:text-lg leading-relaxed text-white/90 text-center animate-fade-up delay-3">Drone, roots, and nature-captured sound on wax LPs. Every disc cut just once, snag it or miss.</p>
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 animate-fade-up delay-4">
        <button className="rounded-xl bg-white px-7 py-2.5 text-sm text-gray-900 hover:scale-105 active:scale-95 transition-transform">Browse the shelves</button>
        <button className="liquid-glass rounded-xl px-7 py-2.5 text-sm text-white hover:scale-105 active:scale-95 transition-transform">Newest arrivals</button>
      </div>
    </div>
  );
}
