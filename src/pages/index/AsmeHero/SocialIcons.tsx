import { Globe } from 'lucide-react';

const Instagram = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="white"/></svg>;
const Twitter = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>;

export function SocialIcons() {
  return (
    <div className="relative z-10 flex justify-center gap-4 pb-12">
      {[
        { icon: Instagram, label: 'Instagram' },
        { icon: Twitter, label: 'Twitter' },
        { icon: Globe, label: 'Globe' },
      ].map(({ icon: Icon, label }) => (
        <button key={label} aria-label={label} className="liquid-glass rounded-full p-4 text-white/80 hover:text-white hover:bg-white/5 transition-all">
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}
