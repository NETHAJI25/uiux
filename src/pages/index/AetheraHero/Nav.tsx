export function Nav() {
  return (
    <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
      <span className="text-3xl tracking-tight text-black" style={{ fontFamily: "'Instrument Serif', serif" }}>Aethera<sup className="text-xs">®</sup></span>
      <div className="hidden md:flex items-center gap-8">
        {['Home', 'Studio', 'About', 'Journal', 'Reach Us'].map((l, i) => (
          <a key={l} href="#" className={`text-sm transition-colors ${i === 0 ? 'text-black' : 'text-[#6F6F6F] hover:text-black'}`}>{l}</a>
        ))}
      </div>
      <button className="bg-black text-white text-sm rounded-full px-6 py-2.5 hover:scale-105 transition-transform">Begin Journey</button>
    </nav>
  );
}
