export function MobileMenu({ menuOpen }: { menuOpen: boolean }) {
  if (!menuOpen) return null;
  return (
    <div className="sm:hidden absolute top-[4.5rem] left-4 right-4 bg-black/30 backdrop-blur-xl rounded-2xl p-5 border border-white/10 z-20">
      <div className="flex flex-col gap-4">
        {['Story', 'Benefits', 'Connect'].map(l => <a key={l} href="#" className="text-white text-lg">{l}</a>)}
        <button className="bg-white text-gray-900 font-medium text-sm px-6 py-3 rounded-full w-full">Join the list</button>
      </div>
    </div>
  );
}
