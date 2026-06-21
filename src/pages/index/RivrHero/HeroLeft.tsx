import { motion } from 'framer-motion';
import { BarChart3, ArrowUpRight, RefreshCw } from 'lucide-react';
import { StatsGrid } from './StatsGrid';

export function HeroLeft() {
  return (
    <div className="flex flex-col justify-center">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium mb-6">
          <BarChart3 className="w-3 h-3" />
          DeFi Dashboard
        </span>
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-4">
        Decentralized<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Finance</span><br />Simplified
      </motion.h1>
      <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="text-white/30 max-w-md mb-8 leading-relaxed">
        Swap, earn, and manage your crypto portfolio with the most intuitive DeFi platform.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }} className="flex flex-wrap gap-3">
        <button className="px-6 py-3 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-all flex items-center gap-2">
          Launch App
          <ArrowUpRight className="w-4 h-4" />
        </button>
        <button className="px-6 py-3 rounded-xl bg-white/5 text-white/50 font-medium text-sm hover:bg-white/10 transition-all flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Learn More
        </button>
      </motion.div>
      <StatsGrid />
    </div>
  );
}
