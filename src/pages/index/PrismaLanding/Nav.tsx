const navItems = ['Our story', 'Collective', 'Workshops', 'Programs', 'Inquiries'];

export function Nav() {
  return (
    <nav className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-black rounded-b-2xl md:rounded-b-3xl px-4 py-2 md:px-8 flex items-center gap-3 sm:gap-6 md:gap-12 lg:gap-14">
        {navItems.map(item => (
          <a key={item} href="#" style={{ color: 'rgba(225, 224, 204, 0.8)' }} className="text-[10px] sm:text-xs md:text-sm hover:text-[#E1E0CC] transition-colors whitespace-nowrap">{item}</a>
        ))}
      </div>
    </nav>
  );
}
