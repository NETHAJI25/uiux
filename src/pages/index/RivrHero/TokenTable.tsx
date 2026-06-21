import { motion } from 'framer-motion';

const tokens = [
  { name: 'Ethereum', ticker: 'ETH', price: '$3,842', change: '+5.2%', up: true },
  { name: 'Bitcoin', ticker: 'BTC', price: '$67,890', change: '+2.1%', up: true },
  { name: 'Solana', ticker: 'SOL', price: '$145.20', change: '-1.8%', up: false },
  { name: 'RIVR', ticker: 'RIVR', price: '$12.45', change: '+18.3%', up: true },
];

export function TokenTable() {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mt-24">
      <h3 className="text-sm text-white/20 mb-4 tracking-widest uppercase">Top Tokens</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tokens.map((t) => (
          <div key={t.ticker} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t.ticker}</span>
              <span className={`text-xs ${t.up ? 'text-green-400' : 'text-red-400'}`}>{t.change}</span>
            </div>
            <p className="text-lg font-semibold">{t.price}</p>
            <p className="text-xs text-white/20">{t.name}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
