import { Hero } from './Hero';
import { ProcessGrid } from './ProcessGrid';
import { CTA } from './CTA';

export default function MindloopLanding() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Inter'] overflow-hidden">
      <Hero />
      <ProcessGrid />
      <CTA />
    </div>
  );
}
