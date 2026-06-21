import { ArrowUpRight, Award, Crown } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16">
      <div className="max-w-4xl">
        <div className="flex items-center gap-2 mb-6 lg:mb-8 animate-fade-up" style={{animationDelay:'0s'}}>
          <Crown className="w-4 h-4 text-white/70" /><span className="text-white/70 text-xs sm:text-sm font-inter tracking-[0.3em] uppercase">World-Class Digital Collective</span>
        </div>
        <h1 className="font-podium text-white uppercase leading-[0.92] tracking-tight">
          <div className="text-[clamp(2.8rem,8vw,7rem)] animate-fade-up" style={{animationDelay:'0.2s'}}>Design.</div>
          <div className="text-[clamp(2.8rem,8vw,7rem)] animate-fade-up" style={{animationDelay:'0.2s'}}>Disrupt.</div>
          <div className="text-[clamp(2.8rem,8vw,7rem)] animate-fade-up" style={{animationDelay:'0.2s'}}>Conquer.</div>
        </h1>
        <p className="text-white/70 text-sm sm:text-base font-inter leading-relaxed max-w-md animate-fade-up mt-6 lg:mt-8" style={{animationDelay:'0.4s'}}>We build fierce brand identities<br />that don't just turn heads -- <strong className="text-white">they lead.</strong></p>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-8 lg:mt-10 animate-fade-up" style={{animationDelay:'0.6s'}}>
          <button className="group flex items-center gap-3 bg-black hover:bg-neutral-900 text-white text-[11px] sm:text-xs tracking-widest uppercase px-5 sm:px-7 py-3 sm:py-4 transition">
            SEE OUR WORK <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <div className="hidden sm:flex items-center gap-3">
            <Award className="w-8 h-8 text-white/50" />
            <div><p className="text-white/60 text-xs tracking-wider uppercase">Top-Rated</p><p className="text-white/60 text-xs tracking-wider uppercase">Brand Studio</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
