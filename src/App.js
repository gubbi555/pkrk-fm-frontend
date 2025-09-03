import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AudioPlayer from './components/AudioPlayer';
import { getCategories, getCategoryContent } from './services/api';
import './styles/App.css';

const App = () => {
  const [categories, setCategories] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [currentItems, setCurrentItems] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const categoriesData = await getCategories();
    setCategories(categoriesData);
  };

  // STEP 1: Click category (film-songs, stories, podcasts, web-series)
  const handleCategoryClick = async (category) => {
    setLoading(true);
    const contentData = await getCategoryContent(category);
    setAllContent(contentData);
    setBreadcrumb([category.toUpperCase()]);

    if (category === 'film-songs') {
      // Show albums: hit-kannada-songs-vol1
      const albums = [...new Set(contentData.map(item => item.album_or_season))].filter(Boolean);
      setCurrentItems(albums.map(name => ({ name, type: 'album', category })));
    }
    else if (category === 'stories') {
      // Show genres: horror, thriller (3rd part of content_id)
      const genres = [...new Set(contentData.map(item => {
        const parts = item.content_id.split('#');
        return parts[2]; // horror or thriller
      }))].filter(Boolean);
      setCurrentItems(genres.map(name => ({ name, type: 'genre', category })));
    }
    else if (category === 'podcasts') {
      // Show seasons directly: season1
      const seasons = [...new Set(contentData.map(item => item.album_or_season))].filter(Boolean);
      setCurrentItems(seasons.map(name => ({ name, type: 'season', category })));
    }
    else if (category === 'web-series') {
      // Show series: jackie1
      const shows = [...new Set(contentData.map(item => item.movie_or_show))].filter(Boolean);
      setCurrentItems(shows.map(name => ({ name, type: 'show', category })));
    }
    setLoading(false);
  };

  // Handle item clicks based on S3 structure
  const handleItemClick = (item) => {
    const newBreadcrumb = [...breadcrumb, item.name];
    setBreadcrumb(newBreadcrumb);

    if (item.category === 'film-songs') {
      if (item.type === 'album') {
        // Show movies in this album
        const movies = [...new Set(allContent
          .filter(content => content.album_or_season === item.name)
          .map(content => content.movie_or_show))].filter(Boolean);
        setCurrentItems(movies.map(name => ({ name, type: 'movie', category: item.category, album: item.name })));
      }
      else if (item.type === 'movie') {
        // Show songs in this movie
        const songs = allContent.filter(content => 
          content.album_or_season === item.album && 
          content.movie_or_show === item.name &&
          content.content_type === 'EPISODE'
        );
        setCurrentItems(songs);
      }
    }
    else if (item.category === 'stories') {
      if (item.type === 'genre') {
        // Show shows in this genre (BhoothadaMane1, BhoothadaMane2)
        const shows = [...new Set(allContent
          .filter(content => {
            const parts = content.content_id.split('#');
            return parts[2] === item.name; // genre match
          })
          .map(content => content.movie_or_show))].filter(Boolean);
        setCurrentItems(shows.map(name => ({ name, type: 'show', category: item.category, genre: item.name })));
      }
      else if (item.type === 'show') {
        // Show seasons in this show
        const seasons = [...new Set(allContent
          .filter(content => content.movie_or_show === item.name)
          .map(content => content.album_or_season))].filter(Boolean);
        setCurrentItems(seasons.map(name => ({ name, type: 'season', category: item.category, show: item.name })));
      }
      else if (item.type === 'season') {
        // Show episodes in this season
        const episodes = allContent.filter(content => 
          content.movie_or_show === item.show &&
          content.album_or_season === item.name &&
          content.content_type === 'EPISODE'
        );
        setCurrentItems(episodes);
      }
    }
    else if (item.category === 'podcasts') {
      if (item.type === 'season') {
        // Show episodes directly
        const episodes = allContent.filter(content => 
          content.album_or_season === item.name &&
          content.content_type === 'EPISODE'
        );
        setCurrentItems(episodes);
      }
    }
    else if (item.category === 'web-series') {
      if (item.type === 'show') {
        // Show seasons
        const seasons = [...new Set(allContent
          .filter(content => content.movie_or_show === item.name)
          .map(content => content.album_or_season))].filter(Boolean);
        setCurrentItems(seasons.map(name => ({ name, type: 'season', category: item.category, show: item.name })));
      }
      else if (item.type === 'season') {
        // Show episodes
        const episodes = allContent.filter(content => 
          content.movie_or_show === item.show &&
          content.album_or_season === item.name &&
          content.content_type === 'EPISODE'
        );
        setCurrentItems(episodes);
      }
    }
  };

  const goBack = () => {
    if (breadcrumb.length <= 1) {
      // Go back to categories
      setBreadcrumb([]);
      setCurrentItems([]);
      return;
    }

    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.pop();
    setBreadcrumb(newBreadcrumb);

    // Rebuild the view for the previous level
    if (newBreadcrumb.length === 1) {
      // Back to category level
      handleCategoryClick(newBreadcrumb[0].toLowerCase().replace(' ', '-'));
    }
    // Add more back navigation logic as needed
  };

  const handlePlayContent = (contentItem) => {
    setCurrentTrack({
      url: contentItem.cloudfront_url,
      title: contentItem.title || contentItem.file_name,
      artist: contentItem.singer || contentItem.movie_or_show || 'PKRK FM',
      contentItem
    });
  };

  const renderCategories = () => (
    <div className="categories-section">
      <h2>Browse Categories</h2>
      <div className="categories-grid">
        {categories.map(category => (
          <div key={category} className="category-card" onClick={() => handleCategoryClick(category)}>
            <div className="category-icon">
              {category === 'film-songs' && '🎵'}
              {category === 'stories' && '📚'}
              {category === 'podcasts' && '🎙️'}
              {category === 'web-series' && '🎬'}
            </div>
            <h3>{category.replace('-', ' ').toUpperCase()}</h3>
          </div>
        ))}
      </div>
    </div>
  );

  const renderItems = () => {
    // Check if items are episodes (have content_id)
    const isEpisodes = currentItems.length > 0 && currentItems[0].content_id;

    if (isEpisodes) {
      return (
        <div className="episodes-section">
          <h2>Episodes</h2>
          <div className="episodes-list">
            {currentItems.map((episode, index) => (
              <div key={episode.content_id} className="episode-item" onClick={() => handlePlayContent(episode)}>
                <div className="episode-number">#{index + 1}</div>
                <div className="episode-info">
                  <h4>{episode.title || episode.file_name}</h4>
                  <p>{episode.singer ? `Singer: ${episode.singer}` : 'Episode'}</p>
                </div>
                <button className="play-btn">▶️</button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="content-section">
        <div className="content-grid">
          {currentItems.map((item, index) => (
            <div key={index} className="content-card" onClick={() => handleItemClick(item)}>
              <div className="card-image">
                {item.type === 'album' && '💿'}
                {item.type === 'movie' && '🎬'}
                {item.type === 'genre' && '📖'}
                {item.type === 'show' && '📺'}
                {item.type === 'season' && '📅'}
              </div>
              <h3>{item.name}</h3>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        {breadcrumb.length > 0 && (
          <div className="breadcrumb">
            <button className="go-back-btn" onClick={goBack}>← Go Back</button>
            <span>Home</span>
            {breadcrumb.map((crumb, index) => (
              <span key={index}> > {crumb}</span>
            ))}
          </div>
        )}

        <div className="container">
          {loading && <div className="loading">Loading...</div>}
          
          {breadcrumb.length === 0 ? renderCategories() : renderItems()}
        </div>
      </main>

      {currentTrack && (
        <AudioPlayer
          currentTrack={currentTrack}
          onTrackEnd={() => setCurrentTrack(null)}
        />
      )}
    </div>
  );
};

export default App;
