import { motion } from 'framer-motion';
import { Sparkles, ArrowUpRight } from 'lucide-react';

export function HeroSection() {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <span className="inline-flex items-center gap-2 text-xs text-[#1a1a1a]/30 mb-6 tracking-[0.2em] uppercase">
          <Sparkles className="w-3 h-3" />
          Est. 2019
        </span>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="text-6xl sm:text-7xl lg:text-8xl font-light leading-[0.9] tracking-tight mb-6"
      >
        Creative
        <br />
        <span className="italic font-['Instrument_Serif'] text-[#1a1a1a]/30">design</span>
        <br />
        studio
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="text-base text-[#1a1a1a]/40 max-w-md mb-10 leading-relaxed"
      >
        We craft distinctive brand identities and visual experiences for bold, forward-thinking clients.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
        className="flex flex-wrap gap-4"
      >
        <button className="group px-8 py-4 rounded-full bg-[#1a1a1a] text-[#f5f3ef] text-sm font-medium flex items-center gap-2 hover:bg-[#1a1a1a]/90 transition-all">
          View Our Work
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
        <button className="px-8 py-4 rounded-full border border-[#1a1a1a]/10 text-[#1a1a1a]/50 text-sm font-medium hover:border-[#1a1a1a]/20 hover:text-[#1a1a1a] transition-all">
          Get in Touch
        </button>
      </motion.div>
    </div>
  );
}
