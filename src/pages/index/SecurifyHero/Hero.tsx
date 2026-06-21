export function Hero() {
  return (
    <div className="relative h-full w-full">
      <h1 className="hero-title absolute text-white font-medium select-none" style={{ left: '1rem', top: '18%', fontSize: 'clamp(3rem, 14vw, 10rem)' }}>protect</h1>
      <h1 className="hero-title absolute text-white font-medium select-none" style={{ right: '1rem', top: '38%', fontSize: 'clamp(3rem, 14vw, 10rem)' }}>your</h1>
      <h1 className="hero-title absolute text-white font-medium select-none" style={{ left: '18%', top: '58%', fontSize: 'clamp(3rem, 14vw, 10rem)' }}>data</h1>
      <p className="absolute text-[15px] leading-snug text-white/90 max-w-[240px]" style={{ left: '1.5rem', top: '46%' }}>
        we can guarding your data with utmost care, empowering you with privacy everywhere
      </p>
    </div>
  );
}
