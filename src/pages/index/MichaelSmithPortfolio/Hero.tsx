import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Sparkles, ChevronDown } from 'lucide-react';

export function Hero({ hlsVideoRef }: { hlsVideoRef: React.RefObject<HTMLVideoElement | null> }) {
  useEffect(() => {
    if (hlsVideoRef.current) {
      const video = hlsVideoRef.current;
      const src = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls();
          hls.loadSource(src);
          hls.attachMedia(video);
          video.play().catch(() => {});
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src;
          video.play().catch(() => {});
        }
      });
    }
  }, [hlsVideoRef]);

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 lg:px-16">
      <video
        ref={hlsVideoRef}
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090a0c]/60 to-[#090a0c]" />
      <div className="relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 text-sm text-white/40 mb-6 font-mono">
            <Sparkles className="w-3 h-3" />
            Available for freelance
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
          className="text-6xl sm:text-8xl lg:text-9xl font-bold tracking-tight leading-[0.9] mb-6"
        >
          Michael
          <br />
          <span className="text-white/20">Smith</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="text-lg text-white/40 max-w-xl mb-10"
        >
          Designer & developer crafting digital experiences for forward-thinking brands.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: 'easeOut' }}
          className="flex flex-wrap gap-4"
        >
          <button className="group px-8 py-4 rounded-full bg-white text-black font-medium flex items-center gap-2 hover:bg-white/90 transition-all">
            View Projects
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
          <button className="px-8 py-4 rounded-full border border-white/10 text-white/60 font-medium hover:border-white/20 hover:text-white transition-all">
            Get in Touch
          </button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="absolute bottom-12 left-6 lg:left-16"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-white/20" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
