export function MobileMenu({ mobileOpen }: { mobileOpen: boolean }) {
  if (!mobileOpen) return null;
  return (
    <div className="md:hidden bg-white/95 backdrop-blur-md rounded-2xl mx-4 p-6 shadow-lg">
      <div className="flex flex-col gap-4">{['Start', 'Story', 'Rates', 'Benefits', 'FAQ'].map(l => <a key={l} href="#" className="text-gray-900 text-lg">{l}</a>)}</div>
    </div>
  );
}
