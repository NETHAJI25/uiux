import { ArrowRight } from 'lucide-react';

export function SubscribeSection() {
  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center" style={{ transform: 'translateY(-20%)' }}>
      <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-8 tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Built for the curious</h1>
      <div className="max-w-xl w-full space-y-4">
        <div className="liquid-glass rounded-full pl-6 pr-2 py-2 flex items-center gap-3" style={{ fontFamily: 'Inter, sans-serif' }}>
          <input placeholder="Enter your email" className="bg-transparent text-white placeholder:text-white/40 text-base outline-none flex-1" />
          <button className="bg-white rounded-full p-3 text-black hover:scale-105 transition-transform">
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-white text-sm leading-relaxed px-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          Stay updated with the latest news and insights. Subscribe to our newsletter today and never miss out on exciting updates.
        </p>
        <button className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/5 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>
          Manifesto
        </button>
      </div>
    </div>
  );
}
