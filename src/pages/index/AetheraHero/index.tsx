import { Nav } from './Nav';
import { Hero } from './Hero';
import { VideoBackground } from './VideoBackground';

export default function AetheraHero() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <VideoBackground />
      <Nav />
      <Hero />
    </div>
  );
}
