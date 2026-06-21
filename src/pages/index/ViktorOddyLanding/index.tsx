import { useState } from 'react';
import { Nav } from './Nav';
import { MobileMenu } from './MobileMenu';
import { HeroSection } from './HeroSection';
import { FeaturedWorks } from './FeaturedWorks';
import { MarqueeSection } from './MarqueeSection';
import { FooterCTA } from './FooterCTA';

export default function ViktorOddyLanding() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f3ef] text-[#1a1a1a] font-['Inter'] overflow-hidden">
      <Nav onMenuOpen={() => setMenuOpen(true)} />
      <MobileMenu menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <section className="min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <HeroSection />
            <FeaturedWorks />
          </div>
        </div>
      </section>
      <MarqueeSection />
      <FooterCTA />
    </div>
  );
}
