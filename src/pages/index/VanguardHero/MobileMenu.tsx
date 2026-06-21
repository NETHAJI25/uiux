import { X } from 'lucide-react';

const navLinks = ['Projects', 'Studio', 'Offerings', 'Inquire'];

export function MobileMenu({ menuOpen, onClose }: { menuOpen: boolean; onClose: () => void }) {
  return (
    <div className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-sm transition-all duration-500 ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
      <div className="flex items-center justify-between px-6 sm:px-10 py-5">
        <span className="font-podium text-white font-bold uppercase text-2xl">VANGUARD</span>
        <button onClick={onClose}><X className="w-6 h-6 text-white" /></button>
      </div>
      <div className="flex flex-col items-center justify-center h-full -mt-20 gap-6">
        {navLinks.map((l, i) => (
          <a key={l} href="#" onClick={onClose} className="font-podium text-4xl sm:text-5xl text-white uppercase"
            style={{ transition: `opacity 500ms, transform 500ms`, transitionDelay: `${i * 80 + 100}ms`, opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'translateY(0)' : 'translateY(20px)' }}>{l}</a>
        ))}
        <a href="#" onClick={onClose} className="border border-white/30 px-8 py-4 text-xs tracking-widest uppercase text-white mt-4"
          style={{ transition: `opacity 500ms, transform 500ms`, transitionDelay: '420ms', opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'translateY(0)' : 'translateY(20px)' }}>GET IN TOUCH</a>
      </div>
    </div>
  );
}
