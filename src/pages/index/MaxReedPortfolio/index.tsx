import { Header } from './Header';
import { BackgroundCard } from './BackgroundCard';
import { TestimonialCard } from './TestimonialCard';
import { MetricCard } from './MetricCard';
import { ToolsCarousel } from './ToolsCarousel';
import { ContactCard } from './ContactCard';

const BG_VIDEO_1 = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_150203_44a5bd32-516a-47ce-a077-8acbf9aa8991.mp4";
const BG_VIDEO_2 = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_154543_d5b83fc1-9cea-44f3-b5e8-8f325935211a.mp4";
const BG_VIDEO_3 = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260507_153148_d7a3e1dd-e5d0-4ce6-8306-00d7522ecc44.mp4";

export default function MaxReedPortfolio() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased">
      <div className="px-4 sm:px-6 md:px-10 lg:px-14 py-6 sm:py-8 md:py-10 lg:h-screen flex flex-col">
        <Header />
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 min-h-0">
          <BackgroundCard videoSrc={BG_VIDEO_1} />
          <div className="grid md:grid-rows-[auto_1fr] gap-4 md:gap-5">
            <TestimonialCard />
            <MetricCard videoSrc={BG_VIDEO_2} />
          </div>
          <div className="grid gap-4 md:gap-5">
            <ToolsCarousel videoSrc={BG_VIDEO_3} />
            <ContactCard />
          </div>
        </div>
      </div>
    </div>
  );
}
