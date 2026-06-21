import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const stats = [
  { label: 'TVL', value: '$2.4B', change: '+12.5%', up: true },
  { label: '24h Volume', value: '$847M', change: '-3.2%', up: false },
  { label: 'Active Users', value: '142K', change: '+8.1%', up: true },
  { label: 'Avg. APY', value: '14.6%', change: '+2.3%', up: true },
];

export function StatsGrid() {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-12">
      {stats.map((s) => (
        <div key={s.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
          <p className="text-xs text-white/30 mb-1">{s.label}</p>
          <p className="text-sm font-semibold">{s.value}</p>
          <span className={`text-xs flex items-center gap-0.5 ${s.up ? 'text-green-400' : 'text-red-400'}`}>
            {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {s.change}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
