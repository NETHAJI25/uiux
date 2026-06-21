import { motion } from 'framer-motion';

const gridItems = [
  { label: 'Strategy', num: '01' },
  { label: 'Design', num: '02' },
  { label: 'Development', num: '03' },
  { label: 'Scale', num: '04' },
];

export const ProcessGrid = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.05] mb-6">
            We turn complex
            <br />
            <span className="text-white/20">into simple</span>
          </h2>
          <p className="text-white/20 leading-relaxed">
            Every project starts with understanding the core problem. We strip away the unnecessary
            until only what matters remains.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          {gridItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group p-6 border border-white/5 rounded-2xl hover:bg-white/[0.02] transition-all cursor-pointer"
            >
              <span className="text-3xl font-bold text-white/10 mb-2 block">{item.num}</span>
              <span className="text-white/40 text-sm group-hover:text-white/60 transition-colors">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
