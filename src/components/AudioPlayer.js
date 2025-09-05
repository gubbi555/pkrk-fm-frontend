import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const AudioPlayer = ({ currentTrack, onTrackEnd }) => {
  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentTrack?.url) return;

    const audio = audioRef.current;
    if (!audio) return;

    // Cleanup previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    console.log('Loading HLS URL:', currentTrack.url);

    if (Hls.isSupported()) {
      const hls = new Hls({
        debug: false,
        enableWorker: false,
      });
      
      hlsRef.current = hls;
      hls.loadSource(currentTrack.url);
      hls.attachMedia(audio);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest parsed, starting playback');
        setError('');
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(err => {
          console.error('Play failed:', err);
          setError('Playback failed');
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        if (data.fatal) {
          setError(`HLS Error: ${data.details}`);
          setIsPlaying(false);
        }
      });
      
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS support
      audio.src = currentTrack.url;
      audio.load();
      audio.play().then(() => {
        setIsPlaying(true);
        setError('');
      }).catch(err => {
        console.error('Native play failed:', err);
        setError('Playback failed');
      });
    } else {
      setError('HLS streaming not supported in this browser');
    }

    // Audio event listeners
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      onTrackEnd?.();
    };
    const handleError = () => {
      setError('Audio playback error');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [currentTrack, onTrackEnd]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Play toggle failed:', err);
        setError('Unable to play');
      });
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="audio-player">
      <audio ref={audioRef} />
      
      <div className="now-playing">
        <span className="playing-indicator">🎵 NOW PLAYING</span>
      </div>
      
      <div className="player-info">
        <h4>{currentTrack.title}</h4>
        <p>{currentTrack.artist}</p>
        {error && <p className="error-message">⚠️ {error}</p>}
      </div>
      
      <div className="player-controls">
        <button onClick={togglePlayPause} className="play-pause-btn">
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="time-info">
          <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        
        <button 
          className="close-btn" 
          onClick={() => onTrackEnd?.()}
          title="Close Player"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
