import React, { useState, useRef, useEffect } from 'react';

const AudioPlayer = ({ currentTrack, onTrackEnd }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      onTrackEnd?.();
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onTrackEnd]);

  useEffect(() => {
    if (currentTrack?.url) {
      const audio = audioRef.current;
      audio.src = currentTrack.url;
      audio.load();
      setIsPlaying(true);
      audio.play();
    }
  }, [currentTrack]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="audio-player">
      <audio ref={audioRef} />
      
      <div className="player-info">
        <h4>{currentTrack.title}</h4>
        <p>{currentTrack.artist || 'PKRK FM'}</p>
      </div>
      
      <div className="player-controls">
        <button onClick={togglePlayPause} className="play-pause-btn">
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="time-info">
          <span>{formatTime(currentTime)}</span>
          <div className="progress-bar">
            <div 
              className="progress"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
