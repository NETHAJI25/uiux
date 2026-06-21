import { motion } from 'framer-motion';

const marqueeText = 'Design Studio — Creative Direction — Brand Identity — Visual Art —';

export function MarqueeSection() {
  return (
    <section className="py-16 border-t border-[#1a1a1a]/5">
      <div className="overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex gap-8 animate-marquee-left"
        >
          {[...Array(4)].flatMap(() => marqueeText.split(' — ')).map((t, i) => (
            <span
              key={i}
              className="text-5xl sm:text-6xl font-light text-[#1a1a1a]/5 whitespace-nowrap italic font-['Instrument_Serif']"
            >
              {t}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
