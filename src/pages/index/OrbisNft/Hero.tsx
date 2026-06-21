import { Nav } from './Nav';

export const Hero = () => {
  return (
    <section className="relative h-screen overflow-hidden rounded-b-[32px]">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4" />
      <div className="relative z-10 h-full flex flex-col px-6 sm:px-10 lg:px-16" style={{ maxWidth: '1831px', margin: '0 auto' }}>
        <Nav />
        <div className="flex-1 flex items-center relative">
          <div className="lg:ml-32">
            <h1 className="font-grotesk text-cream uppercase leading-[1.05] lg:leading-[1] max-w-[780px] text-[40px] sm:text-[60px] md:text-[75px] lg:text-[90px]">
              Beyond earth<br />and ( its ) familiar boundaries
            </h1>
            <span className="font-condiment text-neon text-[24px] sm:text-[36px] md:text-[48px] absolute -right-10 top-0 -rotate-1 mix-blend-exclusion opacity-90">Nft collection</span>
          </div>
        </div>
      </div>
    </section>
  );
};
