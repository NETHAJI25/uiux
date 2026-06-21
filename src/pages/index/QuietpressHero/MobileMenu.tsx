const navLinks = ['Anthology', 'Talents', 'Sound diary', 'Playback salon'];

export function MobileMenu({ menuOpen }: { menuOpen: boolean }) {
  if (!menuOpen) return null;
  return (
    <div className="md:hidden liquid-glass mx-4 rounded-2xl p-2">
      {navLinks.map(l => <a key={l} href="#" className="block rounded-xl px-4 py-3 text-sm text-white/90 hover:bg-white/10">{l}</a>)}
    </div>
  );
}
