import React from 'react';

const AudioPlayer = ({ currentTrack, onTrackEnd }) => {
  if (!currentTrack) return null;

  return (
    <div className="audio-player">
      <div className="player-info">
        <h4>{currentTrack.title}</h4>
        <p>{currentTrack.artist || 'PKRK FM'}</p>
        <p className="info-message">🎵 Audio streaming ready! (HLS support coming soon)</p>
      </div>
      
      <div className="player-controls">
        <button className="play-pause-btn">
          ▶️
        </button>
        
        <div className="time-info">
          <span>0:00</span>
          <div className="progress-bar">
            <div className="progress" style={{ width: '0%' }} />
          </div>
          <span>0:00</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
