import { useState } from 'react';
import { Nav } from './Nav';
import { MobileMenu } from './MobileMenu';
import { Hero } from './Hero';

export default function SkyEliteHero() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="relative h-screen overflow-hidden">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_091828_e240eb17-6edc-4129-ad9d-98678e3fd238.mp4" />
        <div className="relative h-full flex flex-col">
          <Nav mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
          <MobileMenu mobileOpen={mobileOpen} />
          <Hero />
        </div>
      </div>
    </div>
  );
}
