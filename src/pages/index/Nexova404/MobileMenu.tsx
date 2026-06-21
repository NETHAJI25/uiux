interface MobileMenuProps {
  navLinks: string[];
  mobileMenuOpen: boolean;
  menuVisible: boolean;
  toggleMenu: () => void;
}

export const MobileMenu = ({ navLinks, mobileMenuOpen, menuVisible, toggleMenu }: MobileMenuProps) => {
  if (!mobileMenuOpen) return null;

  return (
    <div className="lg:hidden">
      <div className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-md transition-opacity duration-400 ${menuVisible ? 'opacity-100' : 'opacity-0'}`} onClick={toggleMenu} />
      <div className={`absolute left-0 right-0 top-[68px] z-50 transition-opacity duration-400 ${menuVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="absolute inset-0 backdrop-blur-xl rounded-b-2xl" />
        <div className="relative z-10 flex flex-col items-center gap-4 py-8">
          {[...navLinks, 'LOG IN'].map((l, i) => (
            <a key={l} href="#" className="text-lg sm:text-xl font-light tracking-[0.08em] text-white/80 hover:text-white transition-all duration-400 ease-out"
              style={{ transitionDelay: menuVisible ? `${350 + i * 50}ms` : '0ms', opacity: menuVisible ? 1 : 0, transform: menuVisible ? 'translateY(0)' : 'translateY(12px)' }}>
              {l === 'LOG IN' ? <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-white px-6 py-2 rounded-full">{l}</span> : l}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
