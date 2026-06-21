import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CustomCursor } from './CustomCursor';
import { Hero } from './Hero';
import { WorkSection } from './WorkSection';
import { BrandsSection } from './BrandsSection';
import { FooterCTA } from './FooterCTA';

const projects = [
  { title: 'Nebula Studio', year: '2024', tag: 'Brand Identity' },
  { title: 'Quantum Labs', year: '2024', tag: 'Web Design' },
  { title: 'Echo Ventures', year: '2023', tag: 'UI/UX' },
  { title: 'Pulse CRM', year: '2023', tag: 'Product Design' },
  { title: 'Apex Dashboard', year: '2022', tag: 'Frontend Dev' },
  { title: 'Vertex App', year: '2022', tag: 'Mobile Design' },
];

const brands = ['Google', 'Spotify', 'Stripe', 'Figma', 'Notion', 'Vercel'];

export default function MichaelSmithPortfolio() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const hlsVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX - 16,
          y: e.clientY - 16,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    };
    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return (
    <div className="min-h-screen bg-[#090a0c] text-white font-['Inter'] overflow-x-hidden">
      <CustomCursor cursorRef={cursorRef} />
      <Hero hlsVideoRef={hlsVideoRef} />
      <WorkSection projects={projects} />
      <BrandsSection brands={brands} />
      <FooterCTA />
    </div>
  );
}
