import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

const works = [
  { title: 'Aether', tag: 'Brand Identity', year: '2024' },
  { title: 'Noir', tag: 'Editorial', year: '2024' },
  { title: 'Flux', tag: 'Digital Art', year: '2023' },
  { title: 'Solstice', tag: 'Installation', year: '2023' },
];

export function FeaturedWorks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="grid grid-cols-2 gap-4"
    >
      {works.map((w, i) => (
        <motion.div
          key={w.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 + i * 0.08 }}
          className="group relative aspect-square rounded-2xl bg-[#e8e5e0] overflow-hidden cursor-pointer"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/5 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-medium">{w.title}</h3>
            <p className="text-xs text-[#1a1a1a]/40">
              {w.tag} — {w.year}
            </p>
          </div>
          <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-4 h-4" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
