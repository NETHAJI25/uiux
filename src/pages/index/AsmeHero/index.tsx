import { VideoBackground } from './VideoBackground';
import { Nav } from './Nav';
import { SubscribeSection } from './SubscribeSection';
import { SocialIcons } from './SocialIcons';

export default function AsmeHero() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden" style={{ fontFamily: "'Instrument Serif', serif" }}>
      <VideoBackground />
      <Nav />
      <SubscribeSection />
      <SocialIcons />
    </div>
  );
}
