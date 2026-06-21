import { Nav } from './Nav';
import { Hero } from './Hero';
import { StatBadges } from './StatBadges';

export default function SecurifyHero() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black font-['Readex_Pro',system-ui,sans-serif] text-white antialiased">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4" />
      <Nav />
      <Hero />
      <StatBadges />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-b from-transparent to-black" />
    </section>
  );
}
