export function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-10 px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between bg-transparent">
      <div className="flex items-center gap-3">
        <span className="text-[21px] sm:text-[26px] tracking-tight text-black font-medium select-none">Mainframe&reg;</span>
        <span className="text-[25px] sm:text-[30px] text-black select-none tracking-[-0.02em] font-medium leading-none mb-1">&#10033;</span>
      </div>
      <div className="hidden md:flex items-center text-[23px] text-black">
        {['Labs', 'Studio', 'Openings', 'Shop'].map((l, i) => (
          <span key={l}><a href="#" className="hover:opacity-60 transition-opacity">{l}</a>{i < 3 && <span className="opacity-40 mx-1">,&nbsp;</span>}</span>
        ))}
      </div>
      <a href="#" className="hidden md:block text-[23px] text-black underline underline-offset-2 hover:opacity-60 transition-opacity">Get in touch</a>
    </header>
  );
}
