import { useState, useEffect } from 'react';
import { Nav } from './Nav';
import { MobileMenu } from './MobileMenu';
import { Hero404 } from './Hero404';
import { Footer } from './Footer';

const navLinks = ['Domain', 'Servers', 'Cloud', 'Managed', 'Email', 'Privacy'];
const footerCols = [
  { title: 'SERVERS', links: ['Web Servers', 'VPS Servers', 'Cloud Servers', 'Managed Instances', 'Bare Metal'] },
  { title: 'DOMAINS', links: ['Find Domain', 'Move Domains', 'DNS Manager', 'Domain Costs'] },
  { title: 'HELP US', links: ['Open a Ticket', 'FAQs', 'Docs', 'Tutorials', 'Forum'] },
  { title: 'ABOUT', links: ['Our Story', 'Leadership Team', 'Press Room', 'We Hire', 'Alliance', 'Blog'] },
];

export default function Nexova404() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => { document.title = '404 - NEXOVA'; }, []);

  const toggleMenu = () => {
    if (!mobileMenuOpen) {
      setMobileMenuOpen(true);
      setTimeout(() => setMenuVisible(true), 50);
    } else {
      setMenuVisible(false);
      setTimeout(() => setMobileMenuOpen(false), 500);
    }
  };

  return (
    <div style={{ fontFamily: '"Helvetica Now Var", Helvetica, Arial, sans-serif' }} className="relative min-h-screen flex flex-col bg-black text-white">
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260613_180732_a54afbf6-b30d-470e-861f-669871f09f67.mp4" />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Nav navLinks={navLinks} mobileMenuOpen={mobileMenuOpen} toggleMenu={toggleMenu} />
        <MobileMenu navLinks={navLinks} mobileMenuOpen={mobileMenuOpen} menuVisible={menuVisible} toggleMenu={toggleMenu} />
        <Hero404 />
        <Footer footerCols={footerCols} />
      </div>
    </div>
  );
}
