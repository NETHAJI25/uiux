import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FigurineCard } from './FigurineCard';

export function Carousel({ IMAGES, isMobile }: { IMAGES: { src: string; bg: string; panel: string }[]; isMobile: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const navigate = useCallback((dir: 'next' | 'prev') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex(prev => dir === 'next' ? (prev + 1) % 4 : (prev + 3) % 4);
    setTimeout(() => setIsAnimating(false), 650);
  }, [isAnimating]);

  const center = activeIndex;
  const left = (activeIndex + 3) % 4;
  const right = (activeIndex + 1) % 4;
  const back = (activeIndex + 2) % 4;

  const getRole = (i: number) => {
    void back;
    if (i === center) return 'center';
    if (i === left) return 'left';
    if (i === right) return 'right';
    return 'back';
  };

  const getStyle = (role: string) => {
    const m = isMobile;
    switch (role) {
      case 'center': return { left: '50%', height: m ? '60%' : '92%', bottom: m ? '22%' : '0', transform: `translateX(-50%) scale(${m ? 1.25 : 1.68})`, filter: 'blur(0px)', opacity: 1, zIndex: 20 } as React.CSSProperties;
      case 'left': return { left: m ? '20%' : '30%', height: m ? '16%' : '28%', bottom: m ? '32%' : '12%', transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.85, zIndex: 10 } as React.CSSProperties;
      case 'right': return { left: m ? '80%' : '70%', height: m ? '16%' : '28%', bottom: m ? '32%' : '12%', transform: 'translateX(-50%) scale(1)', filter: 'blur(2px)', opacity: 0.85, zIndex: 10 } as React.CSSProperties;
      case 'back': return { left: '50%', height: m ? '13%' : '22%', bottom: m ? '32%' : '12%', transform: 'translateX(-50%) scale(1)', filter: 'blur(4px)', opacity: 0.85, zIndex: 5 } as React.CSSProperties;
    }
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: IMAGES[activeIndex].bg, fontFamily: 'Inter, sans-serif', transition: 'background-color 650ms cubic-bezier(0.4,0,0.2,1)' }}>
      <div className="relative w-full" style={{ height: '100vh', overflow: 'hidden' }}>
        <div className="absolute inset-0 pointer-events-none z-50 opacity-40" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`, backgroundSize: '200px 200px' }} />
        
        <div className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none z-[2]" style={{ top: '18%' }}>
          <span className="font-anton text-white uppercase leading-none tracking-[-0.02em] whitespace-nowrap" style={{ fontSize: 'clamp(90px, 28vw, 380px)', fontWeight: 900, opacity: 1 }}>3D SHAPE</span>
        </div>

        <span className="absolute top-6 left-4 sm:left-8 z-[60] text-xs font-semibold uppercase text-white/90 tracking-[0.18em]">TOONHUB</span>

        <div className="absolute inset-0 z-[3]">
          {IMAGES.map((img, i) => {
            const role = getRole(i);
            return <FigurineCard key={i} img={img} role={role} getStyle={getStyle} />;
          })}
        </div>

        <div className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24 z-[60]" style={{ maxWidth: 320 }}>
          <p className="font-bold uppercase tracking-widest mb-2 sm:mb-3 text-base sm:text-[22px] text-white/95" style={{ letterSpacing: '0.02em' }}>TOONHUB FIGURINES</p>
          <p className="hidden sm:block text-xs sm:text-sm text-white/85 leading-relaxed mb-4 sm:mb-5">The artwork is stunning, shipped fully prepared. The finish is a vision, the 3D craft is flawless. Many thanks! Wishing you the win. Order now.</p>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('prev')} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white flex items-center justify-center text-white hover:scale-108 hover:bg-white/20 transition-all duration-150" style={{ background: 'transparent' }}>
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button onClick={() => navigate('next')} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-white flex items-center justify-center text-white hover:scale-108 hover:bg-white/20 transition-all duration-150" style={{ background: 'transparent' }}>
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        <a href="#" className="absolute bottom-6 right-4 sm:bottom-20 sm:right-10 z-[60] flex items-center gap-1 text-white/95 hover:text-white transition-opacity duration-200" style={{ fontFamily: 'Anton, sans-serif', fontSize: 'clamp(20px, 4vw, 56px)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1, textTransform: 'uppercase', textDecoration: 'none' }}>
          DISCOVER IT <ArrowRight size={28} strokeWidth={2.25} className="w-5 h-5 sm:w-8 sm:h-8" />
        </a>
      </div>
    </div>
  );
}
