import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { WordsPullUp } from './WordsPullUp';

export function Hero() {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-8">
          <h1 className="text-[26vw] sm:text-[24vw] md:text-[22vw] lg:text-[20vw] xl:text-[19vw] 2xl:text-[20vw] font-medium leading-[0.85] tracking-[-0.07em]" style={{ color: '#E1E0CC' }}>
            <WordsPullUp text="Prisma" showAsterisk />
          </h1>
        </div>
        <div className="col-span-12 md:col-span-4 flex flex-col justify-end">
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }} className="text-primary/70 text-xs sm:text-sm md:text-base" style={{ lineHeight: 1.2 }}>
            Prisma is a worldwide network of visual artists, filmmakers and storytellers bound not by place, status or labels but by passion and hunger to unlock potential through our unique perspectives.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mt-4">
            <button className="group bg-primary text-black rounded-full flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-medium hover:gap-3 transition-all">
              Join the lab
              <span className="bg-black rounded-full w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowRight className="text-primary w-4 h-4" />
              </span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
