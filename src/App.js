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
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const categoriesData = await getCategories();
    setCategories(categoriesData);
  };

  const loadCategoryContent = async (category) => {
    setLoading(true);
    const contentData = await getCategoryContent(category);
    setAllContent(contentData);
    setLoading(false);
    return contentData;
  };

  // Parse S3 path structure correctly
  const parseContentPath = (contentId) => {
    const parts = contentId.split('#');
    // Example: "stories#horror#BhootadaMane1#season1#episode1"
    return {
      category: parts[0],      // stories
      genre: parts[1],         // horror  
      show: parts[2],          // BhootadaMane1
      season: parts[3],        // season1
      episode: parts[4]        // episode1
    };
  };

  const handleCategoryClick = async (category) => {
    const contentData = await loadCategoryContent(category);
    setBreadcrumb([category.toUpperCase()]);

    if (category === 'film-songs') {
      // Show albums
      const albums = [...new Set(contentData.map(item => item.album_or_season))];
      setCurrentItems(albums.map(name => ({ name, type: 'album', data: name })));
    }
    else if (category === 'stories') {
      // Show genres (horror, thriller)
      const genres = [...new Set(contentData.map(item => {
        const parsed = parseContentPath(item.content_id);
        return parsed.genre;
      }))].filter(Boolean);
      setCurrentItems(genres.map(name => ({ name, type: 'genre', data: name })));
    }
    else if (category === 'podcasts') {
      // Show seasons directly
      const seasons = [...new Set(contentData.map(item => item.album_or_season))];
      setCurrentItems(seasons.map(name => ({ name, type: 'season', data: name })));
    }
    else if (category === 'web-series') {
      // Show series
      const shows = [...new Set(contentData.map(item => item.movie_or_show))];
      setCurrentItems(shows.map(name => ({ name, type: 'show', data: name })));
    }
  };

  const handleItemClick = (item) => {
    setBreadcrumb([...breadcrumb, item.name]);

    if (item.type === 'album') {
      // Film songs: show movies in album
      const movies = [...new Set(allContent
        .filter(content => content.album_or_season === item.data)
        .map(content => content.movie_or_show))];
      setCurrentItems(movies.map(name => ({ name, type: 'movie', data: { album: item.data, movie: name } })));
    }
    else if (item.type === 'movie') {
      // Film songs: show songs in movie
      const songs = allContent.filter(content => 
        content.album_or_season === item.data.album && 
        content.movie_or_show === item.data.movie &&
        content.content_type === 'EPISODE'
      );
      setCurrentItems(songs);
    }
    else if (item.type === 'genre') {
      // Stories: show shows in genre
      const shows = [...new Set(allContent
        .filter(content => {
          const parsed = parseContentPath(content.content_id);
          return parsed.genre === item.data;
        })
        .map(content => content.movie_or_show))];
      setCurrentItems(shows.map(name => ({ name, type: 'show', data: { genre: item.data, show: name } })));
    }
    else if (item.type === 'show') {
      // Stories/Web-series: show seasons in show
      const seasons = [...new Set(allContent
        .filter(content => content.movie_or_show === item.data.show || content.movie_or_show === item.data)
        .map(content => content.album_or_season))];
      setCurrentItems(seasons.map(name => ({ 
        name, 
        type: 'season', 
        data: { show: item.data.show || item.data, season: name } 
      })));
    }
    else if (item.type === 'season') {
      // Show episodes in season
      const episodes = allContent.filter(content => 
        content.album_or_season === item.data.season || content.album_or_season === item.data &&
        content.content_type === 'EPISODE'
      );
      setCurrentItems(episodes);
    }
  };

  const goBack = () => {
    if (breadcrumb.length <= 1) {
      setBreadcrumb([]);
      setCurrentItems([]);
      return;
    }

    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.pop();
    setBreadcrumb(newBreadcrumb);

    // Rebuild previous level
    if (newBreadcrumb.length === 1) {
      handleCategoryClick(newBreadcrumb[0].toLowerCase());
    }
  };

  const handlePlayContent = (contentItem) => {
    setCurrentTrack({
      url: contentItem.cloudfront_url,
      title: contentItem.title || contentItem.file_name,
      artist: contentItem.singer || contentItem.movie_or_show || 'PKRK FM'
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
