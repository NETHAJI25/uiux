import { useState } from 'react';

export function Hero() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) alert(`Subscribed: ${email}`);
  };

  return (
    <div className="flex-1 flex flex-col sm:flex-row sm:items-end pb-4 sm:pb-12 lg:pb-16 sm:mt-auto">
      <div className="flex-1">
        <h1 className="font-askan text-white text-[2rem] sm:text-[3.5rem] md:text-[4.5rem] lg:text-[5.5rem] leading-[1.05] tracking-tight max-w-[700px]">Your calm is always within.</h1>
        <p className="text-white/70 text-xs sm:text-base md:text-lg max-w-[520px] leading-relaxed mt-4">Aurai is your always-on wellness companion. Built by leading therapists, it brings you the care and clarity right when you need it.</p>
        <form onSubmit={handleSubmit} className="relative mt-6 max-w-md">
          <div className="bg-black/30 backdrop-blur-md rounded-full border border-white/10 flex items-center">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" className="bg-transparent text-white text-sm px-4 sm:px-6 py-3 sm:py-4 outline-none flex-1 placeholder:text-white/40" />
            <button type="submit" className="absolute right-1.5 bg-white text-gray-900 text-xs sm:text-sm font-medium px-3 sm:px-6 py-2 sm:py-3 rounded-full hover:bg-gray-100 transition">Join the list</button>
          </div>
        </form>
        <div className="flex sm:hidden flex-wrap gap-2 mt-2">
          {['Smart Therapy', 'Real-time Healing', 'Insights into outcomes'].map(p => (
            <span key={p} className="bg-black/30 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/10">{p}</span>
          ))}
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-2 self-end">
        {['Smart Therapy', 'Real-time Healing', 'Insights into outcomes'].map(p => (
          <span key={p} className="bg-black/30 backdrop-blur-md text-white text-xs sm:text-sm px-4 py-2 rounded-full border border-white/10">{p}</span>
        ))}
      </div>
    </div>
  );
}
