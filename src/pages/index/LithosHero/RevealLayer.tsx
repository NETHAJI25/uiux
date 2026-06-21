import { useEffect, useRef, useState } from 'react';

const SPOTLIGHT_R = 260;

export function RevealLayer({ image, cursorX, cursorY }: { image: string; cursorX: number; cursorY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = dimensions.w;
    canvas.height = dimensions.h;
    ctx.clearRect(0, 0, dimensions.w, dimensions.h);
    const gradient = ctx.createRadialGradient(cursorX, cursorY, 0, cursorX, cursorY, SPOTLIGHT_R);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.6, 'rgba(255,255,255,0.75)');
    gradient.addColorStop(0.75, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(0.88, 'rgba(255,255,255,0.12)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, dimensions.w, dimensions.h);
    const dataUrl = canvas.toDataURL();
    const revealDiv = canvas.nextElementSibling as HTMLElement;
    if (revealDiv) {
      revealDiv.style.maskImage = `url(${dataUrl})`;
      revealDiv.style.webkitMaskImage = `url(${dataUrl})`;
      revealDiv.style.maskSize = '100% 100%';
      revealDiv.style.webkitMaskSize = '100% 100%';
    }
  }, [cursorX, cursorY, dimensions]);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ display: 'none' }} />
      <div className="absolute inset-0 bg-center bg-cover bg-no-repeat z-30 pointer-events-none" style={{ backgroundImage: `url(${image})` }} />
    </>
  );
}
