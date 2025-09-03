import React, { useEffect, useRef, useState } from 'react';

const AudioPlayer = ({ currentTrack, onTrackEnd }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentTrack?.url) return;

    const video = videoRef.current;
    if (!video) return;

    // Use video element to play HLS
    video.src = currentTrack.url;
    video.load();
    
    video.play().then(() => {
      setIsPlaying(true);
      setError('');
    }).catch(err => {
      setError('Cannot play HLS format - needs HLS.js library');
      console.log('Playback error:', err);
    });

  }, [currentTrack]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true));
    }
  };

  if (!currentTrack) return null;

  return (
    <div className="audio-player">
      <video 
        ref={videoRef} 
        style={{display: 'none'}} 
        onEnded={() => {
          setIsPlaying(false);
          onTrackEnd?.();
        }}
      />
      
      <div className="player-info">
        <h4>{currentTrack.title}</h4>
        <p>{currentTrack.artist || 'PKRK FM'}</p>
        {error && <p className="error-message">{error}</p>}
      </div>
      
      <div className="player-controls">
        <button onClick={togglePlay} className="play-pause-btn">
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <span>0:00 / 0:00</span>
      </div>
    </div>
  );
};

export default AudioPlayer;
