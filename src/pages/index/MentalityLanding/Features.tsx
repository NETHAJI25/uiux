import { motion } from 'framer-motion';
import { Zap, Shield, Users, BarChart3, Globe, Check } from 'lucide-react';

const features = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Optimized for speed with sub-second load times' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption for your data' },
  { icon: Users, title: 'Team Collaboration', desc: 'Real-time sync across your entire team' },
  { icon: BarChart3, title: 'Advanced Analytics', desc: 'Deep insights with beautiful dashboards' },
  { icon: Globe, title: 'Global Scale', desc: 'Deploy worldwide with edge computing' },
  { icon: Check, title: '99.9% Uptime', desc: 'Reliable infrastructure you can count on' },
];

export function Features() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold tracking-tight mb-4">Everything you need</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Powerful features to help you build better products, faster.
          </p>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group p-8 rounded-3xl bg-white border border-black/5 hover:border-black/10 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center mb-5 group-hover:bg-black/10 transition-colors">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
