import { motion } from 'framer-motion';

export function BrandsSection({ brands }: { brands: string[] }) {
  return (
    <section className="py-24 border-t border-white/5 px-6 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-sm text-white/20 text-center mb-12 tracking-widest uppercase"
        >
          Trusted by leading brands
        </motion.p>
        <div className="flex flex-wrap justify-center gap-12">
          {brands.map((b, i) => (
            <motion.span
              key={b}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="text-2xl text-white/10 font-semibold tracking-tight"
            >
              {b}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
