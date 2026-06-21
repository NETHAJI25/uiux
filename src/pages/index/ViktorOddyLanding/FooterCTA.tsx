import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

export function FooterCTA() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-5xl sm:text-6xl font-light tracking-tight mb-6"
        >
          Have a project
          <br />
          <span className="italic font-['Instrument_Serif'] text-[#1a1a1a]/30">in mind?</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-[#1a1a1a]/30 mb-10"
        >
          Let's create something distinctive together.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="px-10 py-5 rounded-full bg-[#1a1a1a] text-[#f5f3ef] font-medium hover:bg-[#1a1a1a]/90 transition-all inline-flex items-center gap-2"
        >
          Start a Project
          <ArrowUpRight className="w-5 h-5" />
        </motion.button>
      </div>
    </section>
  );
}
