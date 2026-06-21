import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

const MaxReedPortfolio = lazy(() => import('./pages/index/MaxReedPortfolio'));
const Nexova404 = lazy(() => import('./pages/index/Nexova404'));
const GlowingFeatureCards = lazy(() => import('./pages/index/GlowingFeatureCards'));
const LithosHero = lazy(() => import('./pages/index/LithosHero'));
const VanguardHero = lazy(() => import('./pages/index/VanguardHero'));
const PrismaLanding = lazy(() => import('./pages/index/PrismaLanding'));
const AuraiHero = lazy(() => import('./pages/index/AuraiHero'));
const VelorahHero = lazy(() => import('./pages/index/VelorahHero'));
const SkyEliteHero = lazy(() => import('./pages/index/SkyEliteHero'));
const QuietpressHero = lazy(() => import('./pages/index/QuietpressHero'));
const AetheraHero = lazy(() => import('./pages/index/AetheraHero'));
const AsmeHero = lazy(() => import('./pages/index/AsmeHero'));
const ToonhubCarousel = lazy(() => import('./pages/index/ToonhubCarousel'));
const OrbisNft = lazy(() => import('./pages/index/OrbisNft'));
const MentalityLanding = lazy(() => import('./pages/index/MentalityLanding'));
const MichaelSmithPortfolio = lazy(() => import('./pages/index/MichaelSmithPortfolio'));
const MainframeHero = lazy(() => import('./pages/index/MainframeHero'));
const SecurifyHero = lazy(() => import('./pages/index/SecurifyHero'));
const SpadeHero = lazy(() => import('./pages/index/SpadeHero'));
const MindloopLanding = lazy(() => import('./pages/index/MindloopLanding'));
const RivrHero = lazy(() => import('./pages/index/RivrHero'));
const ViktorOddyLanding = lazy(() => import('./pages/index/ViktorOddyLanding'));

function Home() {
  const designs = [
    { name: 'Max Reed Portfolio', path: '/max-reed', desc: 'Full-viewport dark portfolio Features section' },
    { name: 'NEXOVA 404', path: '/nexova-404', desc: 'Full-page 404 error page for hosting company' },
    { name: 'Glowing Feature Cards', path: '/glowing-cards', desc: 'Dark-themed glowing feature card section' },
    { name: 'Lithos Hero', path: '/lithos', desc: 'Geology brand hero with cursor spotlight' },
    { name: 'VANGUARD Hero', path: '/vanguard', desc: 'Creative agency landing page' },
    { name: 'Prisma Studio', path: '/prisma', desc: 'Creative studio with 3 sections' },
    { name: 'Aurai Hero', path: '/aurai', desc: 'AI wellness companion hero' },
    { name: 'Velorah Hero', path: '/velorah', desc: 'Cinematic hero with glassmorphism' },
    { name: 'SkyElite Hero', path: '/skyelite', desc: 'Private jet landing page' },
    { name: 'quietpress Hero', path: '/quietpress', desc: 'Vinyl record label hero' },
    { name: 'Aethera Hero', path: '/aethera', desc: 'Cinematic hero with looping video' },
    { name: 'Asme Hero', path: '/asme', desc: 'Dark cinematic hero with email form' },
    { name: 'TOONHUB Carousel', path: '/toonhub', desc: 'Character figurine carousel' },
    { name: 'Orbis.Nft', path: '/orbis-nft', desc: 'NFT landing page with 4 sections' },
    { name: 'Mentality', path: '/mentality', desc: 'Modern React landing page' },
    { name: 'Michael Smith', path: '/michael-smith', desc: 'Dark portfolio with GSAP + Framer Motion' },
    { name: 'Mainframe Hero', path: '/mainframe', desc: 'Creative agency with mouse-scrub video' },
    { name: 'securify Hero', path: '/securify', desc: 'Data-security SaaS hero' },
    { name: 'Spade Hero', path: '/spade', desc: 'Interactive hero with typewriter' },
    { name: 'Mindloop', path: '/mindloop', desc: 'Dark monochrome landing page' },
    { name: 'RIVR DeFi', path: '/rivr', desc: 'DeFi dashboard hero' },
    { name: 'Viktor Oddy', path: '/viktor-oddy', desc: 'Creative design studio landing page' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-light mb-2 tracking-tight">UI/UX Design Collection</h1>
        <p className="text-white/60 mb-8 text-lg">A curated collection of 22 premium UI designs</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.map((d) => (
            <Link
              key={d.path}
              to={d.path}
              className="group block p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <h3 className="text-lg font-medium mb-1 group-hover:text-white/90">{d.name}</h3>
              <p className="text-sm text-white/40">{d.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/max-reed" element={<MaxReedPortfolio />} />
        <Route path="/nexova-404" element={<Nexova404 />} />
        <Route path="/glowing-cards" element={<GlowingFeatureCards />} />
        <Route path="/lithos" element={<LithosHero />} />
        <Route path="/vanguard" element={<VanguardHero />} />
        <Route path="/prisma" element={<PrismaLanding />} />
        <Route path="/aurai" element={<AuraiHero />} />
        <Route path="/velorah" element={<VelorahHero />} />
        <Route path="/skyelite" element={<SkyEliteHero />} />
        <Route path="/quietpress" element={<QuietpressHero />} />
        <Route path="/aethera" element={<AetheraHero />} />
        <Route path="/asme" element={<AsmeHero />} />
        <Route path="/toonhub" element={<ToonhubCarousel />} />
        <Route path="/orbis-nft" element={<OrbisNft />} />
        <Route path="/mentality" element={<MentalityLanding />} />
        <Route path="/michael-smith" element={<MichaelSmithPortfolio />} />
        <Route path="/mainframe" element={<MainframeHero />} />
        <Route path="/securify" element={<SecurifyHero />} />
        <Route path="/spade" element={<SpadeHero />} />
        <Route path="/mindloop" element={<MindloopLanding />} />
        <Route path="/rivr" element={<RivrHero />} />
        <Route path="/viktor-oddy" element={<ViktorOddyLanding />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
