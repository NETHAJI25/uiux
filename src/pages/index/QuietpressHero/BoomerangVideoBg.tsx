import { useEffect, useRef, useState } from 'react';

export function BoomerangVideoBg() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'video' | 'canvas'>('video');
  const framesRef = useRef<ImageData[]>([]);
  const directionRef = useRef(1);
  const frameIdxRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let captureRaf: number;
    const maxW = 960;
    let scaledW = 0, scaledH = 0;

    const captureFrame = () => {
      if (!video || !ctx) return;
      if (!scaledW) {
        const ratio = maxW / video.videoWidth;
        scaledW = maxW;
        scaledH = video.videoHeight * ratio;
        canvas.width = scaledW;
        canvas.height = scaledH;
      }
      ctx.drawImage(video, 0, 0, scaledW, scaledH);
      framesRef.current.push(ctx.getImageData(0, 0, scaledW, scaledH));
      captureRaf = requestAnimationFrame(captureFrame);
    };

    const playBoomerang = () => {
      if (!ctx || framesRef.current.length === 0) return;
      const frames = framesRef.current;
      frameIdxRef.current += directionRef.current;
      if (frameIdxRef.current >= frames.length - 1) { directionRef.current = -1; frameIdxRef.current = frames.length - 1; }
      if (frameIdxRef.current <= 0) { directionRef.current = 1; frameIdxRef.current = 0; }
      ctx.putImageData(frames[frameIdxRef.current], 0, 0);
      requestAnimationFrame(playBoomerang);
    };

    const onEnded = () => {
      setMode('canvas');
      video.style.display = 'none';
      captureFrame();
      setTimeout(() => { cancelAnimationFrame(captureRaf); playBoomerang(); }, 100);
    };

    video.addEventListener('ended', onEnded);
    captureRaf = requestAnimationFrame(captureFrame);

    return () => { video.removeEventListener('ended', onEnded); cancelAnimationFrame(captureRaf); };
  }, []);

  return (
    <div className="absolute inset-0 z-0 scale-[1.08] origin-center overflow-hidden">
      <video ref={videoRef} muted playsInline crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260611_183632_c311af08-e4b7-458f-81e7-79847a49b3d3.mp4" />
      <canvas ref={canvasRef} className={`absolute inset-0 w-full h-full object-cover ${mode === 'canvas' ? 'block' : 'hidden'}`} />
    </div>
  );
}
