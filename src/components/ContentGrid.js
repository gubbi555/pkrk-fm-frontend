import React from 'react';

const ContentGrid = ({ items, type, onItemClick, loading }) => {
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!items || items.length === 0) {
    return <div className="no-content">No content available</div>;
  }

  const renderItem = (item, index) => {
    switch (type) {
      case 'movies':
        return (
          <div key={index} className="content-card" onClick={() => onItemClick(item)}>
            <div className="card-image">
              <div className="placeholder-image">🎬</div>
            </div>
            <div className="card-content">
              <h3>{item}</h3>
              <p>Kannada Movie</p>
            </div>
          </div>
        );

      case 'songs':
        return (
          <div key={item.content_id} className="content-card" onClick={() => onItemClick(item)}>
            <div className="card-image">
              <div className="placeholder-image">🎵</div>
              <button className="play-btn">▶</button>
            </div>
            <div className="card-content">
              <h3>{item.title || item.file_name}</h3>
              <p>Singer: {item.singer || 'Unknown'}</p>
              <p>Movie: {item.movie_or_show}</p>
            </div>
          </div>
        );

      case 'shows':
        return (
          <div key={item.movie_or_show} className="content-card" onClick={() => onItemClick(item)}>
            <div className="card-image">
              <div className="placeholder-image">📖</div>
            </div>
            <div className="card-content">
              <h3>{item.movie_or_show}</h3>
              <p>Story Series</p>
            </div>
          </div>
        );

      case 'seasons':
        return (
          <div key={item.album_or_season} className="content-card" onClick={() => onItemClick(item)}>
            <div className="card-image">
              <div className="placeholder-image">📚</div>
            </div>
            <div className="card-content">
              <h3>{item.album_or_season}</h3>
              <p>Season</p>
            </div>
          </div>
        );

      case 'episodes':
        return (
          <div key={item.content_id} className="content-card" onClick={() => onItemClick(item)}>
            <div className="card-image">
              <div className="placeholder-image">🎧</div>
              <button className="play-btn">▶</button>
            </div>
            <div className="card-content">
              <h3>{item.file_name}</h3>
              <p>Episode</p>
              <p>Duration: {item.duration || 'Unknown'}</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="content-grid">
      {Array.isArray(items) ? items.map(renderItem) : [items].map(renderItem)}
    </div>
  );
};

export default ContentGrid;
