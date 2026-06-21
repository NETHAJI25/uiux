import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export function FooterCTA() {
  return (
    <section className="py-32 px-6 lg:px-16 border-t border-white/5">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-7xl font-bold tracking-tight mb-6"
        >
          Let's create
          <br />
          something great
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-white/30 mb-10 max-w-md mx-auto"
        >
          Have a project in mind? Let's talk about how we can work together.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="px-10 py-5 rounded-full bg-white text-black font-medium text-lg hover:bg-white/90 transition-all inline-flex items-center gap-2"
        >
          Get in Touch
          <ArrowUpRight className="w-5 h-5" />
        </motion.button>
      </div>
    </section>
  );
}
