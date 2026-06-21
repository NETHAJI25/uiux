import { Nav } from './Nav';
import { Hero } from './Hero';

export default function VelorahHero() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: 'hsl(201, 100%, 13%)' }}>
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" />
      <div className="relative z-10">
        <Nav />
        <Hero />
      </div>
    </div>
  );
}
