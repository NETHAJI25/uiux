import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="p-16 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white"
        >
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Ready to get started?
          </h2>
          <p className="text-white/70 max-w-lg mx-auto mb-8 text-lg">
            Join thousands of teams already building with Mentality.
          </p>
          <button className="px-8 py-4 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2">
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
