export function Stats() {
  return (
    <div className="flex flex-wrap gap-6 sm:gap-12 lg:gap-16 mt-8 sm:mt-10 lg:mt-14 animate-fade-up" style={{animationDelay:'0.8s'}}>
      {[
        { val: '250+', label: 'Brands Transformed' },
        { val: '95%', label: 'Client Retention' },
        { val: '10+', label: 'Years in the Game' },
      ].map(s => (
        <div key={s.label}><p className="font-inter text-white text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight">{s.val}</p><p className="text-white/50 text-[9px] sm:text-xs tracking-widest uppercase mt-1">{s.label}</p></div>
      ))}
    </div>
  );
}
