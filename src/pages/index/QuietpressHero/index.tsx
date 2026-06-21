import { useState } from 'react';
import { BoomerangVideoBg } from './BoomerangVideoBg';
import { Header } from './Header';
import { MobileMenu } from './MobileMenu';
import { Hero } from './Hero';
import { MusicPlayer } from './MusicPlayer';

export default function QuietpressHero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ fontFamily: "'Helvetica Regular', Helvetica, Arial, sans-serif" }}>
      <BoomerangVideoBg />
      <div className="absolute inset-0 z-20 flex flex-col">
        <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <MobileMenu menuOpen={menuOpen} />
        <Hero />
        <MusicPlayer />
      </div>
    </div>
  );
}
