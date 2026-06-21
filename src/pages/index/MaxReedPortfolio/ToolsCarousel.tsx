import { Sparkle, Palette, PenTool, Layers, Type, Camera, Brush, Box, Wand2 } from 'lucide-react';

function Diamond() { return <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>; }
function Hexagon() { return <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>; }
function CircleIcon() { return <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><circle cx="12" cy="12" r="10"/></svg>; }
function Square() { return <svg className="h-5 w-5 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2"/></svg>; }

const iconRow1 = [Diamond, Hexagon, Palette, PenTool, Layers, Type, Square, CircleIcon];
const iconRow2 = [Camera, Brush, Box, Wand2, Diamond, Hexagon, Type, Layers];

export function ToolsCarousel({ videoSrc }: { videoSrc: string }) {
  return (
    <div className="rounded-2xl bg-black relative overflow-hidden flex flex-col min-h-[280px]">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={videoSrc} />
      <div className="relative z-10 p-4 flex items-center justify-center">
        <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
        <span className="uppercase tracking-[0.22em] text-[11px] text-white/70 mx-2">DAILY SOFTWARE</span>
        <Sparkle className="h-3 w-3 text-white/70" strokeWidth={1.5} />
      </div>
      <div className="relative z-10 mt-auto space-y-3 pb-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex gap-3 animate-marquee-left" style={{width:'max-content'}}>
          {[...Array(2)].map((_, dup) => iconRow1.map((Icon, i) => (
            <div key={`r1-${dup}-${i}`} className="liquid-glass h-14 w-14 md:h-16 md:w-16 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-white/80" strokeWidth={1.5} />
            </div>
          )))}
        </div>
        <div className="flex gap-3 animate-marquee-right" style={{width:'max-content'}}>
          {[...Array(2)].map((_, dup) => iconRow2.map((Icon, i) => (
            <div key={`r2-${dup}-${i}`} className="liquid-glass h-14 w-14 md:h-16 md:w-16 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-white/80" strokeWidth={1.5} />
            </div>
          )))}
        </div>
      </div>
    </div>
  );
}
