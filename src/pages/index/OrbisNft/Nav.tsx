import { Mail } from 'lucide-react';

const Twitter = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>;
const Github = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.4.6.1.82-.26.82-.58v-2.04c-3.34.72-4.04-1.6-4.04-1.6-.54-1.38-1.32-1.74-1.32-1.74-1.08-.74.08-.72.08-.72 1.2.08 1.82 1.22 1.82 1.22 1.06 1.82 2.78 1.3 3.46.98.1-.76.42-1.3.76-1.6-2.66-.3-5.46-1.34-5.46-5.94 0-1.3.46-2.38 1.22-3.22-.12-.3-.54-1.52.12-3.16 0 0 1-.32 3.3 1.22.96-.26 1.98-.4 3-.4s2.04.14 3 .4c2.3-1.54 3.3-1.22 3.3-1.22.66 1.64.24 2.86.12 3.16.76.84 1.22 1.92 1.22 3.22 0 4.6-2.8 5.64-5.46 5.94.44.38.82 1.12.82 2.26v3.34c0 .32.22.7.82.58A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>;

const SocialIcon = ({ icon: Icon }: { icon: any }) => (
  <button className="liquid-glass rounded-[1rem] w-14 h-14 flex items-center justify-center text-white/80 hover:bg-white/10 transition-all"><Icon className="w-5 h-5" /></button>
);

export const Nav = () => {
  return (
    <>
      <div className="flex items-center justify-between py-6">
        <span className="font-grotesk text-cream text-base uppercase tracking-wider">Orbis.Nft</span>
        <div className="hidden lg:flex items-center">
          <div className="liquid-glass rounded-[28px] px-[52px] py-[24px] flex items-center gap-10">
            {['Homepage', 'Gallery', 'Buy NFT', 'FAQ', 'Contact'].map(l => (
              <a key={l} href="#" className="font-grotesk text-cream text-[13px] uppercase tracking-wider hover:text-neon transition-colors">{l}</a>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex flex-col gap-3 absolute right-10 top-32">
          {[Mail, Twitter, Github].map((Icon, i) => <SocialIcon key={i} icon={Icon} />)}
        </div>
      </div>
      <div className="flex lg:hidden justify-center gap-4 pb-8">
        {[Mail, Twitter, Github].map((Icon, i) => <SocialIcon key={i} icon={Icon} />)}
      </div>
    </>
  );
};
