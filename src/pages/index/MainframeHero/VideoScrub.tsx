import { useRef, useEffect } from 'react';

export function VideoScrub({ progress }: { progress: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && video.duration) {
      video.currentTime = progress * video.duration;
    }
  }, [progress]);

  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
        <div
          className="h-full bg-white transition-all duration-75"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </>
  );
}
