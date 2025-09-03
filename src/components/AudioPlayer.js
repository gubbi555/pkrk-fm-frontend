import React from 'react';

const AudioPlayer = ({ currentTrack, onTrackEnd }) => {
  if (!currentTrack) return null;

  return (
    <div className="audio-player">
      <div className="player-info">
        <h4>🎵 {currentTrack.title}</h4>
        <p>{currentTrack.artist || 'PKRK FM'}</p>
        <p className="status-message">Ready to stream! (Audio files being processed...)</p>
      </div>
      
      <div className="player-controls">
        <button className="play-pause-btn">
          ⏸️
        </button>
        
        <div className="time-info">
          <span>0:00</span>
          <div className="progress-bar">
            <div className="progress" style={{ width: '20%' }} />
          </div>
          <span>3:45</span>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
