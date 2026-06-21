import { useRef, useEffect, useState } from 'react';
import { Nav } from './Nav';
import { VideoScrub } from './VideoScrub';
import { Hero } from './Hero';
import { ServicesMarquee } from './ServicesMarquee';

export default function MainframeHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      setProgress(pct);
    };

    container.addEventListener('mousemove', onMouseMove);
    return () => container.removeEventListener('mousemove', onMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white font-['Inter'] overflow-hidden">
      <Nav />
      <section ref={containerRef} className="relative min-h-screen flex items-center">
        <VideoScrub progress={progress} />
        <Hero />
        <ServicesMarquee />
      </section>
    </div>
  );
}
