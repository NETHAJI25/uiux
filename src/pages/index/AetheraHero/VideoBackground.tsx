import { useEffect, useRef } from 'react';

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const opacityRef = useRef(1);
  const fadingOutRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let fadeRaf: number;
    const FADE_DURATION = 500;

    const fadeTo = (target: number, duration: number, cb?: () => void) => {
      if (fadeRaf) cancelAnimationFrame(fadeRaf);
      const start = performance.now();
      const startOp = opacityRef.current;
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        opacityRef.current = startOp + (target - startOp) * t;
        if (video) video.style.opacity = String(opacityRef.current);
        if (t < 1) fadeRaf = requestAnimationFrame(step);
        else if (cb) cb();
      };
      fadeRaf = requestAnimationFrame(step);
    };

    const onTimeUpdate = () => {
      if (!video || fadingOutRef.current) return;
      const timeLeft = video.duration - video.currentTime;
      if (timeLeft <= 0.55) {
        fadingOutRef.current = true;
        fadeTo(0, FADE_DURATION, () => {
          video.style.opacity = '0';
          opacityRef.current = 0;
          setTimeout(() => {
            video.currentTime = 0;
            video.play().then(() => {
              fadingOutRef.current = false;
              fadeTo(1, FADE_DURATION);
            });
          }, 100);
        });
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', () => { video.style.opacity = '0'; fadeTo(1, FADE_DURATION); });

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      if (fadeRaf) cancelAnimationFrame(fadeRaf);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" style={{ top: '300px', inset: 'auto 0 0 0' }}>
      <video ref={videoRef} autoPlay muted loop={false} playsInline className="w-full h-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white" />
    </div>
  );
}
