export function Hero() {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pb-40 animate-fade-rise" style={{ paddingTop: 'calc(8rem - 75px)' }}>
      <h1 className="text-5xl sm:text-7xl md:text-8xl max-w-7xl font-normal leading-[0.95] tracking-[-2.46px] text-black" style={{ fontFamily: "'Instrument Serif', serif" }}>
        Beyond silence, we build<br /><em className="not-italic text-[#6F6F6F]">the eternal.</em>
      </h1>
      <p className="text-[#6F6F6F] text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
        Building platforms for brilliant minds, fearless makers, and thoughtful souls. Through the noise, we craft digital havens for deep work and pure flows.
      </p>
      <button className="bg-black text-white rounded-full px-14 py-5 text-base mt-12 hover:scale-105 transition-transform animate-fade-rise-delay-2">Begin Journey</button>
    </div>
  );
}
