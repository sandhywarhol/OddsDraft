'use client';

import { useEffect, useRef } from 'react';

export default function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.4; // Slow down the video significantly
    }
  }, []);

  return (
    <>
      <video 
        ref={videoRef}
        autoPlay 
        loop 
        muted 
        playsInline 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: -2,
          pointerEvents: 'none'
        }}
      >
        <source src="/background%20video.mp4" type="video/mp4" />
      </video>
      {/* Blue tinted dark overlay for text readability */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(to bottom, rgba(5, 15, 35, 0.6), rgba(10, 13, 18, 0.7))',
          zIndex: -1,
          pointerEvents: 'none'
        }}
      />
    </>
  );
}
