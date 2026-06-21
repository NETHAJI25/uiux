import { motion } from 'framer-motion';
import { Nav } from './Nav';
import { HeroLeft } from './HeroLeft';
import { SwapWidget } from './SwapWidget';
import { TokenTable } from './TokenTable';

export default function RivrHero() {
  return (
    <div className="min-h-screen bg-[#07080a] text-white font-['Inter'] overflow-hidden">
      <Nav />
      <section className="relative max-w-7xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-8">
          <HeroLeft />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex items-center justify-center">
            <SwapWidget />
          </motion.div>
        </div>
        <TokenTable />
      </section>
    </div>
  );
}
