import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export function WorkSection({ projects }: { projects: { title: string; year: string; tag: string }[] }) {
  return (
    <section className="py-32 px-6 lg:px-16">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
        >
          Selected Work
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-white/30 mb-16 max-w-md"
        >
          A curated selection of projects I have had the pleasure of working on.
        </motion.p>
        <div className="space-y-6">
          {projects.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group flex items-center justify-between py-6 px-6 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5"
            >
              <div className="flex items-center gap-6">
                <span className="text-white/20 text-sm font-mono w-8">{p.year}</span>
                <h3 className="text-xl sm:text-2xl font-medium">{p.title}</h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-white/30 hidden sm:block">{p.tag}</span>
                <ArrowUpRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
