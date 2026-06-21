import { useState, useEffect } from 'react';
import { Nav } from './Nav';
import { MobileMenu } from './MobileMenu';
import { Hero } from './Hero';
import { Features } from './Features';
import { CTA } from './CTA';

export default function MentalityLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#0a0b0e] font-['Inter'] overflow-hidden">
      <Nav scrolled={scrolled} setMenuOpen={setMenuOpen} />
      <MobileMenu menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <Hero />
      <Features />
      <CTA />
    </div>
  );
}
