import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AudioPlayer from './components/AudioPlayer';
import { getCategories, getCategoryContent } from './services/api';
import './styles/App.css';

const App = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [content, setContent] = useState([]);
  const [currentView, setCurrentView] = useState('categories'); // categories, movies, songs, genres, shows, seasons, episodes
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

  const handleCategoryClick = async (category) => {
    setLoading(true);
    const contentData = await getCategoryContent(category);
    setContent(contentData);
    setSelectedCategory(category);
    
    if (category === 'film-songs') {
      setCurrentView('movies');
      setBreadcrumb([{name: 'Film Songs', type: 'category'}]);
    } else if (category === 'stories') {
      setCurrentView('genres');
      setBreadcrumb([{name: 'Stories', type: 'category'}]);
    } else {
      setCurrentView('shows');
      setBreadcrumb([{name: category.replace('-', ' ').toUpperCase(), type: 'category'}]);
    }
    setLoading(false);
  };

  const handleMovieClick = (movie) => {
    const movieSongs = content.filter(item => 
      item.content_type === 'EPISODE' && item.movie_or_show === movie
    );
    setContent(movieSongs);
    setCurrentView('songs');
    setBreadcrumb([
      {name: 'Film Songs', type: 'category'},
      {name: movie, type: 'movie'}
    ]);
  };

  const handleGenreClick = (genre) => {
    const genreStories = content.filter(item => 
      item.category === 'stories' && item.album_or_season?.includes(genre)
    );
    setContent(genreStories);
    setCurrentView('shows');
    setBreadcrumb([
      {name: 'Stories', type: 'category'},
      {name: genre, type: 'genre'}
    ]);
  };

  const handleShowClick = (show) => {
    const showSeasons = content.filter(item => 
      item.movie_or_show === show
    );
    setContent(showSeasons);
    setCurrentView('seasons');
    setBreadcrumb([
      ...breadcrumb,
      {name: show, type: 'show'}
    ]);
  };

  const handleSeasonClick = (season) => {
    const seasonEpisodes = content.filter(item => 
      item.album_or_season === season
    );
    setContent(seasonEpisodes);
    setCurrentView('episodes');
    setBreadcrumb([
      ...breadcrumb,
      {name: season, type: 'season'}
    ]);
  };

  const handlePlayContent = (contentItem) => {
    setCurrentTrack({
      url: contentItem.cloudfront_url,
      title: contentItem.title || contentItem.file_name,
      artist: contentItem.singer || contentItem.movie_or_show
    });
  };

  const handleBreadcrumbClick = (index) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    
    if (index === 0) {
      setCurrentView('categories');
      handleCategoryClick(selectedCategory);
    }
    // Add more breadcrumb logic as needed
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

  const renderMovies = () => {
    const movies = [...new Set(content.map(item => item.movie_or_show))];
    return (
      <div className="content-section">
        <h2>Kannada Movies</h2>
        <div className="content-grid">
          {movies.map(movie => (
            <div key={movie} className="content-card" onClick={() => handleMovieClick(movie)}>
              <div className="card-image">🎬</div>
              <h3>{movie}</h3>
              <p>Click to view songs</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGenres = () => (
    <div className="content-section">
      <h2>Story Genres</h2>
      <div className="content-grid">
        <div className="content-card" onClick={() => handleGenreClick('horror')}>
          <div className="card-image">👻</div>
          <h3>Horror</h3>
          <p>Scary stories</p>
        </div>
        <div className="content-card" onClick={() => handleGenreClick('thriller')}>
          <div className="card-image">🔪</div>
          <h3>Thriller</h3>
          <p>Suspense stories</p>
        </div>
        <div className="content-card" onClick={() => handleGenreClick('drama')}>
          <div className="card-image">🎭</div>
          <h3>Drama</h3>
          <p>Emotional stories</p>
        </div>
      </div>
    </div>
  );

  const renderShows = () => {
    const shows = [...new Set(content.map(item => item.movie_or_show))];
    return (
      <div className="content-section">
        <h2>Shows</h2>
        <div className="content-grid">
          {shows.map(show => (
            <div key={show} className="content-card" onClick={() => handleShowClick(show)}>
              <div className="card-image">📺</div>
              <h3>{show}</h3>
              <p>Click to view seasons</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSeasons = () => {
    const seasons = [...new Set(content.map(item => item.album_or_season))];
    return (
      <div className="content-section">
        <h2>Seasons</h2>
        <div className="content-grid">
          {seasons.map(season => (
            <div key={season} className="content-card" onClick={() => handleSeasonClick(season)}>
              <div className="card-image">📅</div>
              <h3>{season}</h3>
              <p>Click to view episodes</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSongs = () => (
    <div className="content-section">
      <h2>Songs</h2>
      <div className="songs-list">
        {content.map(song => (
          <div key={song.content_id} className="song-item" onClick={() => handlePlayContent(song)}>
            <div className="song-info">
              <h4>{song.title || song.file_name}</h4>
              <p>Singer: {song.singer || 'Unknown'}</p>
            </div>
            <button className="play-btn">▶️</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEpisodes = () => (
    <div className="content-section">
      <h2>Episodes</h2>
      <div className="songs-list">
        {content.map((episode, index) => (
          <div key={episode.content_id} className="song-item" onClick={() => handlePlayContent(episode)}>
            <div className="episode-number">#{index + 1}</div>
            <div className="song-info">
              <h4>{episode.title || episode.file_name}</h4>
              <p>Duration: 30 min</p>
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
        {/* Breadcrumb Navigation */}
        {breadcrumb.length > 0 && (
          <div className="breadcrumb">
            <span onClick={() => {setCurrentView('categories'); setBreadcrumb([]);}}>Home</span>
            {breadcrumb.map((crumb, index) => (
              <span key={index}>
                {' > '}
                <span onClick={() => handleBreadcrumbClick(index)}>{crumb.name}</span>
              </span>
            ))}
          </div>
        )}

        <div className="container">
          {loading && <div className="loading">Loading...</div>}
          
          {currentView === 'categories' && renderCategories()}
          {currentView === 'movies' && renderMovies()}
          {currentView === 'genres' && renderGenres()}
          {currentView === 'shows' && renderShows()}
          {currentView === 'seasons' && renderSeasons()}
          {currentView === 'songs' && renderSongs()}
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
