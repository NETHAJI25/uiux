import { Nav } from './Nav';
import { Hero } from './Hero';

export default function PrismaLanding() {
  return (
    <div style={{ color: '#E1E0CC', fontFamily: "'Almarai', sans-serif" }} className="bg-black">
      <section className="h-screen p-4 md:p-6">
        <div className="relative h-full rounded-2xl md:rounded-[2rem] overflow-hidden">
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4" />
          <div className="absolute inset-0 noise-overlay opacity-[0.7] mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60 pointer-events-none" />
          <Nav />
          <Hero />
        </div>
      </section>
    </div>
  );
}
