import { motion } from 'framer-motion';
import { useTypewriter } from './useTypewriter';

export function TypewriterText() {
  const { displayed, done } = useTypewriter("we'd love to\nhear from you!");

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <h1 className="text-5xl md:text-6xl lg:text-[76px] font-normal tracking-tight text-black leading-[1.08] mb-8 select-none w-full whitespace-pre-wrap">
        {displayed}
        {!done && <span className="inline-block w-[2px] h-[1.1em] bg-black align-middle ml-[2px] animate-blink" />}
      </h1>
    </motion.div>
  );
}
