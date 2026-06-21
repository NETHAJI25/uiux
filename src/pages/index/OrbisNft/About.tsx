export const About = () => {
  return (
    <section className="relative h-screen">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4" />
      <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16" style={{ maxWidth: '1831px', margin: '0 auto', paddingTop: '64px', paddingBottom: '64px' }}>
        <div className="flex flex-col lg:flex-row lg:items-start gap-10">
          <div className="relative">
            <h2 className="font-grotesk text-cream uppercase text-[32px] sm:text-[44px] lg:text-[60px] leading-tight">Hello!<br />I'm orbis</h2>
            <span className="font-condiment text-neon text-[36px] sm:text-[48px] lg:text-[68px] absolute -bottom-8 right-0 -rotate-1 mix-blend-exclusion">Orbis</span>
          </div>
          <div className="lg:ml-auto">
            <p className="font-mono text-cream text-[14px] sm:text-[16px] uppercase max-w-[266px] leading-relaxed">A digital object fixed beyond time and place. An exploration of distance, form, and silence in space</p>
          </div>
        </div>
        <div className="flex justify-between mt-auto">
          <div className="space-y-6"><p className="font-mono text-cream/10 text-[14px] uppercase max-w-[266px]">01 / A digital object fixed beyond time and place. An exploration of distance, form, and silence in space</p><p className="font-mono text-cream/10 text-[14px] uppercase max-w-[266px]">02 / A digital object fixed beyond time and place.</p></div>
          <div className="hidden lg:block space-y-6"><p className="font-mono text-cream/10 text-[14px] uppercase max-w-[266px]">03 / A digital object fixed beyond time and place. An exploration of distance, form, and silence in space</p><p className="font-mono text-cream/10 text-[14px] uppercase max-w-[266px]">04 / A digital object fixed beyond time and place.</p></div>
        </div>
      </div>
    </section>
  );
};
