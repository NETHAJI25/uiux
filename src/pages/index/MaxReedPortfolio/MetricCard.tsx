export function MetricCard({ videoSrc }: { videoSrc: string }) {
  return (
    <div className="rounded-2xl bg-black relative overflow-hidden flex flex-col items-center justify-center">
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src={videoSrc} />
      <div className="relative z-10 flex flex-col items-center">
        <span className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] font-light tracking-tight drop-shadow">10M+</span>
        <span className="text-white/85 text-sm">Raised for startups</span>
      </div>
    </div>
  );
}
