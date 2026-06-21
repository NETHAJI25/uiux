import { useState } from 'react';
import { BarChart3, Heart } from 'lucide-react';

export function MusicPlayer() {
  const [liked, setLiked] = useState(false);

  return (
    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-10 z-20 max-w-[270px] sm:w-72 animate-fade-up delay-5">
      <div className="rounded-2xl bg-white p-2.5 pr-4 shadow-lg">
        <div className="flex items-start gap-2">
          <span className="h-11 w-11 rounded-xl bg-blue-700 flex items-center justify-center shrink-0"><BarChart3 className="w-5 h-5 text-white" strokeWidth={2.5} /></span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 truncate">Helia Marsh -- Fern Light</p>
            <div className="h-1 rounded-full bg-gray-200 mt-1"><div className="h-1 rounded-full bg-blue-700" style={{ width: '30%' }} /></div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-0.5"><span>0:33</span><span>-1:21</span></div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button className="flex-1 rounded-2xl bg-white py-2 text-sm text-gray-900 shadow-lg hover:scale-105 active:scale-95 transition-transform">Prev</button>
        <button onClick={() => setLiked(!liked)} className="h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
          <Heart size={16} className={liked ? 'fill-blue-700 text-blue-700' : 'text-blue-700'} />
        </button>
        <button className="flex-1 rounded-2xl bg-white py-2 text-sm text-gray-900 shadow-lg hover:scale-105 active:scale-95 transition-transform">Next</button>
      </div>
    </div>
  );
}
