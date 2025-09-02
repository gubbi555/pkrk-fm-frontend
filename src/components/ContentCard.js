import React from 'react';
import '../styles/ContentCard.css';

const ContentCard = ({ content, onPlay, showDuration = false }) => {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'film-songs': return '🎵';
      case 'stories': return '📖';
      case 'podcasts': return '🎙️';
      case 'web-series': return '🎬';
      default: return '🎵';
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    return duration.includes(':') ? duration : `${duration} min`;
  };

  return (
    <div className="content-card">
      <div className="card-image">
        <div className="placeholder-image">
          <span className="category-icon">{getCategoryIcon(content.category)}</span>
        </div>
        
        <button 
          className="card-play-btn"
          onClick={() => onPlay(content)}
        >
          <div className="play-icon">▶</div>
        </button>

        {showDuration && content.duration && (
          <span className="duration-badge">
            {formatDuration(content.duration)}
          </span>
        )}

        {content.track_number && (
          <span className="episode-badge">
            #{content.track_number}
          </span>
        )}
      </div>

      <div className="card-content">
        <h3 className="card-title">{content.title || content.file_name}</h3>
        
        {content.singer && (
          <p className="card-subtitle">Singer: {content.singer}</p>
        )}
        
        {content.movie_or_show && (
          <p className="card-subtitle">From: {content.movie_or_show}</p>
        )}
        
        {content.description && (
          <p className="card-description">{content.description}</p>
        )}

        <div className="card-meta">
          <span className="category-tag">
            {content.category?.replace('-', ' ').toUpperCase()}
          </span>
          
          {content.language && (
            <span className="language-tag">{content.language}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
