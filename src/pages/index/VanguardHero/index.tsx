import { useState } from 'react';
import { Nav } from './Nav';
import { MobileMenu } from './MobileMenu';
import { Hero } from './Hero';
import { Stats } from './Stats';

export default function VanguardHero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative h-screen w-full overflow-hidden font-inter">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_154941_df1a96e1-a06f-450c-bd02-d863414cc1a0.mp4" />
      <Nav onMenuOpen={() => setMenuOpen(true)} />
      <MobileMenu menuOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Hero />
      <Stats />
    </div>
  );
}
