const nftCards = [
  { video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4', score: '8.7/10' },
  { video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4', score: '9/10' },
  { video: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4', score: '8.2/10' },
];

export const NFTGrid = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-16" style={{ maxWidth: '1831px', margin: '0 auto' }}>
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 lg:mb-16">
        <h2 className="font-grotesk text-cream uppercase text-[32px] sm:text-[44px] lg:text-[60px] leading-tight">
          Collection of<br /><span className="ml-12 sm:ml-24 lg:ml-32"><span className="font-condiment text-neon">Space</span> objects</span>
        </h2>
        <div className="text-right mt-6 lg:mt-0">
          <span className="font-grotesk text-cream text-[32px] sm:text-[44px] lg:text-[60px] leading-none">SEE</span>
          <div className="inline-block ml-3 align-bottom">
            <div className="text-[20px] sm:text-[28px] lg:text-[36px] leading-tight font-grotesk text-cream">ALL<br />CREATORS</div>
          </div>
          <div className="bg-neon h-[6px] sm:h-[8px] lg:h-[10px] w-full mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nftCards.map((card, i) => (
          <div key={i} className="liquid-glass rounded-[32px] p-[18px] hover:bg-white/10 transition-colors">
            <div className="relative pb-[100%] rounded-[24px] overflow-hidden">
              <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={card.video} />
            </div>
            <div className="liquid-glass rounded-[20px] px-5 py-4 flex items-center justify-between mt-3">
              <div><span className="text-[11px] text-cream/70">RARITY SCORE:</span><br /><span className="text-[16px] text-cream">{card.score}</span></div>
              <button className="w-12 h-12 rounded-full bg-gradient-to-br from-[#b724ff] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-purple-500/50 hover:scale-110 transition-transform">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
