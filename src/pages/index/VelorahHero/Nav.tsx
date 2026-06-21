export function Nav() {
  return (
    <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
      <span className="text-3xl tracking-tight text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>Velorah<sup className="text-xs">®</sup></span>
      <div className="hidden md:flex items-center gap-8">
        {['Home', 'Studio', 'About', 'Journal', 'Reach Us'].map((l, i) => (
          <a key={l} href="#" className={`text-sm transition-colors ${i === 0 ? 'text-white' : 'text-white/60 hover:text-white'}`}>{l}</a>
        ))}
      </div>
      <button className="liquid-glass rounded-full px-6 py-2.5 text-sm text-white hover:scale-[1.03] transition-transform cursor-pointer">Begin Journey</button>
    </nav>
  );
}
