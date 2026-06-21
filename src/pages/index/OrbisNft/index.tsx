import { Hero } from './Hero';
import { About } from './About';
import { NFTGrid } from './NFTGrid';
import { CTASection } from './CTASection';

export default function OrbisNft() {
  return (
    <div className="bg-[#010828] font-grotesk text-cream overflow-x-hidden">
      <div className="fixed inset-0 z-50 pointer-events-none opacity-60 mix-blend-lighten bg-cover" style={{ backgroundImage: 'url(/texture.png)' }} />
      <Hero />
      <About />
      <NFTGrid />
      <CTASection />
    </div>
  );
}
