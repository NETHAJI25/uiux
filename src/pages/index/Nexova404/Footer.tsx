const SvgIcon = ({ path, viewBox = '0 0 24 24', className }: { path: string; viewBox?: string; className?: string }) => <svg className={className || 'w-4 h-4'} viewBox={viewBox} fill="currentColor"><path d={path} /></svg>;
const Facebook = (props: any) => <SvgIcon {...props} path="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3V2z" />;
const Twitter = (props: any) => <SvgIcon {...props} path="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />;
const Dribbble = (props: any) => <SvgIcon {...props} path="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.5 5.5c.5.8.9 1.7 1 2.6-1.4-.2-2.8-.3-4.3-.3-.4-.9-.9-1.8-1.4-2.6 1.7-.4 3.3-.2 4.7.3zm-7-1.4c.6.7 1.1 1.5 1.6 2.3-1.4.2-2.8.4-4.1.7-.1-.6-.1-1.2 0-1.8 1.5.2 3 .3 4.5-.2z" />;
const Youtube = (props: any) => <SvgIcon {...props} path="M23.5 6.2c-.3-1-1-1.7-2-2C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.5.7c-1 .3-1.7 1-2 2C0 7.7 0 12 0 12s0 4.3.5 5.8c.3 1 1 1.7 2 2 2 .7 9.5.7 9.5.7s7.5 0 9.5-.7c1-.3 1.7-1 2-2 .5-1.5.5-5.8.5-5.8s0-4.3-.5-5.8zM9.5 15.5V8.5l6.5 3.5-6.5 3.5z" />;
const Linkedin = (props: any) => <SvgIcon {...props} path="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />;
const Instagram = (props: any) => <SvgIcon {...props} path="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.4 5.6 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.6 18.4 4 16.4 4H7.6zm9.65 1.5a1.25 1.25 0 0 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />;

const socialIcons = [Facebook, Twitter, Dribbble, Youtube, Linkedin, Instagram];

interface FooterProps {
  footerCols: { title: string; links: string[] }[];
}

export const Footer = ({ footerCols }: FooterProps) => {
  return (
    <footer className="relative z-10 px-4 sm:px-6 md:px-12 lg:px-16 pb-8 sm:pb-10 pt-10 sm:pt-16">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-6">
        {footerCols.map(col => (
          <div key={col.title}>
            <h4 className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-3 sm:mb-4">{col.title}</h4>
            <div className="space-y-2 sm:space-y-2.5">  {col.links.map(l => <a key={l} href="#" className="block text-white/50 hover:text-white/80 text-[10px] sm:text-xs transition-colors duration-200">{l}</a>)}</div>
          </div>
        ))}
        <div className="col-span-2 lg:col-span-2">
          <h4 className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] mb-3 sm:mb-4">JOIN FOR EXCLUSIVE DEALS</h4>
          <div className="flex max-w-sm">
            <input placeholder="Type your email to sign up" className="flex-1 bg-white text-black text-xs px-3 py-2 rounded-l-md outline-none" />
            <button className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-white text-xs font-bold tracking-wider px-4 py-2 rounded-r-md">SEND IT</button>
          </div>
          <h4 className="text-white text-[10px] sm:text-xs font-bold tracking-[0.15em] mt-5 sm:mt-6 mb-3">CONNECT</h4>
          <div className="flex gap-3">{socialIcons.map((Icon, i) => <Icon key={i} className="w-4 h-4 text-white/50 hover:text-white transition-colors" />)}</div>
        </div>
      </div>
    </footer>
  );
};
