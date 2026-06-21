import { motion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
      <div className="max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 text-sm text-white/40 mb-6 font-mono">
            <Play className="w-3 h-3" />
            Est. 2020
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          className="text-7xl sm:text-8xl lg:text-[10rem] font-bold leading-[0.85] tracking-tight mb-6"
        >
          We Build
          <br />
          <span className="text-white/20">the Future</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="text-lg text-white/30 max-w-xl mb-10"
        >
          A creative agency crafting digital experiences that push boundaries and redefine possibilities.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
          className="flex flex-wrap gap-4"
        >
          <button className="group px-8 py-4 rounded-full bg-white text-black font-medium flex items-center gap-2 hover:bg-white/90 transition-all">
            Start a Project
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="px-8 py-4 rounded-full border border-white/20 text-white/60 font-medium hover:border-white/40 hover:text-white transition-all">
            View Our Work
          </button>
        </motion.div>
      </div>
    </div>
  );
}
