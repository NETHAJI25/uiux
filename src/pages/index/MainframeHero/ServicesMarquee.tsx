import { motion } from 'framer-motion';

const services = ['Brand Strategy', 'Visual Identity', 'Digital Design', 'Motion', 'Art Direction'];

export function ServicesMarquee() {
  return (
    <div className="absolute bottom-16 left-0 right-0 z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex gap-12 animate-marquee-left"
      >
        {[...services, ...services].map((s, i) => (
          <span key={i} className="text-sm text-white/20 tracking-widest uppercase whitespace-nowrap">
            {s}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
