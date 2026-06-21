import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export function WordsPullUp({ text, className = '', showAsterisk = false }: { text: string; className?: string; showAsterisk?: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const words = text.split(' ');
  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`}>
      {words.map((word, i) => (
        <motion.span key={i} className="inline-block mr-[0.25em]" initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}>
          {word}{i === words.length - 1 && showAsterisk && <sup className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</sup>}
        </motion.span>
      ))}
    </span>
  );
}
