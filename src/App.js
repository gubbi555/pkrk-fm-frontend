import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AudioPlayer from './components/AudioPlayer';
import { getCategories, getCategoryContent } from './services/api';
import './styles/App.css';

const App = () => {
  const [categories, setCategories] = useState([]);
  const [content, setContent] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentView, setCurrentView] = useState('categories');
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

  const loadCategoryContent = async (category) => {
    setLoading(true);
    const contentData = await getCategoryContent(category);
    setContent(contentData);
    setSelectedCategory(category);
    setLoading(false);
    return contentData;
  };

  // Go Back Function
  const goBack = () => {
    if (breadcrumb.length === 0) return;

    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.pop();
    setBreadcrumb(newBreadcrumb);

    if (newBreadcrumb.length === 0) {
      setCurrentView('categories');
    } else {
      const lastCrumb = newBreadcrumb[newBreadcrumb.length - 1];
      
      if (lastCrumb.type === 'category') {
        handleCategoryClick(lastCrumb.value);
      } else if (lastCrumb.type === 'album') {
        showAlbumSongs(lastCrumb.value);
      } else if (lastCrumb.type === 'genre') {
        showGenreShows(selectedCategory, lastCrumb.value);
      } else if (lastCrumb.type === 'show') {
        showShowSeasons(lastCrumb.value);
      }
    }
  };

  // Category Click - Shows albums/genres/shows
  const handleCategoryClick = async (category) => {
    const contentData = await loadCategoryContent(category);
    setBreadcrumb([{name: category.replace('-', ' ').toUpperCase(), type: 'category', value: category}]);

    if (category === 'film-songs') {
      // Show albums: hit-kannada-songs-vol1
      const albums = [...new Set(contentData.map(item => item.album_or_season))];
      setFilteredContent(albums.map(album => ({name: album, type: 'album'})));
      setCurrentView('list');
    } 
    else if (category === 'stories') {
      // Show genres: horror, thriller
      const genres = [...new Set(contentData.map(item => {
        const path = item.content_id.split('#');
        return path[2]; // horror or thriller
      }))];
      setFilteredContent(genres.map(genre => ({name: genre, type: 'genre'})));
      setCurrentView('list');
    }
    else if (category === 'podcasts') {
      // Show seasons directly: season1
      const seasons = [...new Set(contentData.map(item => item.album_or_season))];
      setFilteredContent(seasons.map(season => ({name: season, type: 'season'})));
      setCurrentView('list');
    }
    else if (category === 'web-series') {
      // Show series: jackie1
      const series = [...new Set(contentData.map(item => item.movie_or_show))];
      setFilteredContent(series.map(show => ({name: show, type: 'show'})));
      setCurrentView('list');
    }
  };

  // Film Songs: Album → Movies → Songs
  const showAlbumMovies = (album) => {
    const movies = [...new Set(content.filter(item => 
      item.album_or_season === album
    ).map(item => item.movie_or_show))];
    
    setBreadcrumb([...breadcrumb, {name: album, type: 'album', value: album}]);
    setFilteredContent(movies.map(movie => ({name: movie, type: 'movie'})));
    setCurrentView('list');
  };

  const showAlbumSongs = (movie) => {
    const songs = content.filter(item => 
      item.movie_or_show === movie && item.content_type === 'EPISODE'
    );
    
    setBreadcrumb([...breadcrumb, {name: movie, type: 'movie', value: movie}]);
    setFilteredContent(songs);
    setCurrentView('episodes');
  };

  // Stories: Genre → Shows → Seasons → Episodes
  const showGenreShows = (category, genre) => {
    const shows = [...new Set(content.filter(item => {
      const path = item.content_id.split('#');
      return path[2] === genre; // horror or thriller
    }).map(item => item.movie_or_show))];
    
    setBreadcrumb([...breadcrumb, {name: genre, type: 'genre', value: genre}]);
    setFilteredContent(shows.map(show => ({name: show, type: 'show'})));
    setCurrentView('list');
  };

  const showShowSeasons = (show) => {
    const seasons = [...new Set(content.filter(item => 
      item.movie_or_show === show
    ).map(item => item.album_or_season))];
    
    setBreadcrumb([...breadcrumb, {name: show, type: 'show', value: show}]);
    setFilteredContent(seasons.map(season => ({name: season, type: 'season'})));
    setCurrentView('list');
  };

  const showSeasonEpisodes = (season) => {
    const episodes = content.filter(item => 
      item.album_or_season === season && item.content_type === 'EPISODE'
    );
    
    setBreadcrumb([...breadcrumb, {name: season, type: 'season', value: season}]);
    setFilteredContent(episodes);
    setCurrentView('episodes');
  };

  // Handle clicks
  const handleItemClick = (item) => {
    if (item.type === 'album') {
      showAlbumMovies(item.name);
    } else if (item.type === 'movie') {
      showAlbumSongs(item.name);
    } else if (item.type === 'genre') {
      showGenreShows(selectedCategory, item.name);
    } else if (item.type === 'show') {
      showShowSeasons(item.name);
    } else if (item.type === 'season') {
      showSeasonEpisodes(item.name);
    }
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

  const renderList = () => (
    <div className="content-section">
      <div className="content-grid">
        {filteredContent.map((item, index) => (
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

  const renderEpisodes = () => (
    <div className="content-section">
      <div className="episodes-list">
        {filteredContent.map((episode, index) => (
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

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        {/* Breadcrumb with Go Back Button */}
        {breadcrumb.length > 0 && (
          <div className="breadcrumb">
            <button className="go-back-btn" onClick={goBack}>← Go Back</button>
            <span>Home</span>
            {breadcrumb.map((crumb, index) => (
              <span key={index}> > {crumb.name}</span>
            ))}
          </div>
        )}

        <div className="container">
          {loading && <div className="loading">Loading...</div>}
          
          {currentView === 'categories' && renderCategories()}
          {currentView === 'list' && renderList()}
          {currentView === 'episodes' && renderEpisodes()}
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
