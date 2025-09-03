import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ContentGrid from './components/ContentGrid';
import AudioPlayer from './components/AudioPlayer';
import { getCategories, getCategoryContent } from './services/api';
import './styles/App.css';

const App = () => {
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('');
  const [content, setContent] = useState([]);
  const [navigationPath, setNavigationPath] = useState([]);
  const [currentLevel, setCurrentLevel] = useState('categories'); // categories, movies, songs, genres, shows, seasons, episodes
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      setCurrentLevel('categories');
      setNavigationPath([]);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (category) => {
    try {
      setLoading(true);
      const contentData = await getCategoryContent(category);
      setContent(contentData);
      setCurrentCategory(category);
      setNavigationPath([{ type: 'category', value: category, label: category.toUpperCase() }]);
      
      if (category === 'film-songs') {
        setCurrentLevel('movies');
      } else if (category === 'stories') {
        setCurrentLevel('genres');
      } else {
        setCurrentLevel('content');
      }
    } catch (error) {
      console.error('Error loading category content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie) => {
    const movieSongs = content.filter(item => 
      item.content_type === 'EPISODE' && item.movie_or_show === movie
    );
    setContent(movieSongs);
    setCurrentLevel('songs');
    setNavigationPath([
      ...navigationPath, 
      { type: 'movie', value: movie, label: movie }
    ]);
  };

  const handleGenreClick = (genre) => {
    // For stories, show available shows in that genre
    const genreShows = content.filter(item => 
      item.content_type === 'EPISODE' && 
      item.album_or_season?.toLowerCase().includes(genre.toLowerCase())
    );
    
    const uniqueShows = [...new Set(genreShows.map(item => item.movie_or_show))];
    setContent(uniqueShows.map(show => ({ 
      movie_or_show: show, 
      content_type: 'SHOW',
      category: currentCategory 
    })));
    setCurrentLevel('shows');
    setNavigationPath([
      ...navigationPath, 
      { type: 'genre', value: genre, label: genre }
    ]);
  };

  const handleShowClick = (showName) => {
    const showEpisodes = content.filter(item => 
      item.movie_or_show === showName
    );
    
    const seasons = [...new Set(showEpisodes.map(item => item.album_or_season))];
    setContent(seasons.map(season => ({ 
      album_or_season: season, 
      content_type: 'SEASON',
      movie_or_show: showName,
      category: currentCategory 
    })));
    setCurrentLevel('seasons');
    setNavigationPath([
      ...navigationPath, 
      { type: 'show', value: showName, label: showName }
    ]);
  };

  const handleSeasonClick = async (season) => {
    const seasonEpisodes = content.filter(item => 
      item.album_or_season === season && item.content_type === 'EPISODE'
    );
    setContent(seasonEpisodes);
    setCurrentLevel('episodes');
    setNavigationPath([
      ...navigationPath, 
      { type: 'season', value: season, label: season }
    ]);
  };

  const handlePlayAudio = async (contentItem) => {
    // For now, just show playing status
    setCurrentTrack({
      url: contentItem.cloudfront_url || '#',
      title: contentItem.title || contentItem.file_name,
      artist: contentItem.singer || contentItem.movie_or_show,
      contentItem
    });
  };

  const goBack = () => {
    if (navigationPath.length === 0) return;
    
    const newPath = [...navigationPath];
    newPath.pop();
    setNavigationPath(newPath);
    
    if (newPath.length === 0) {
      loadCategories();
    } else {
      // Rebuild content based on new path
      const lastItem = newPath[newPath.length - 1];
      if (lastItem.type === 'category') {
        handleCategoryClick(lastItem.value);
      } else if (lastItem.type === 'movie') {
        handleMovieClick(lastItem.value);
      } else if (lastItem.type === 'genre') {
        handleGenreClick(lastItem.value);
      } else if (lastItem.type === 'show') {
        handleShowClick(lastItem.value);
      }
    }
  };

  return (
    <div className="app">
      <Header />
      
      <main className="main-content">
        <div className="container">
          {/* Breadcrumb Navigation */}
          <div className="breadcrumb">
            <button onClick={loadCategories} className="breadcrumb-item">
              🏠 Home
            </button>
            {navigationPath.map((item, index) => (
              <React.Fragment key={index}>
                <span className="breadcrumb-separator">›</span>
                <button 
                  onClick={() => {
                    if (index === navigationPath.length - 1) return;
                    // Handle intermediate navigation
                  }}
                  className="breadcrumb-item"
                >
                  {item.label}
                </button>
              </React.Fragment>
            ))}
            {navigationPath.length > 0 && (
              <button onClick={goBack} className="back-btn">
                ← Back
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="content-section">
            {currentLevel === 'categories' && (
              <div>
                <h1>Browse Categories</h1>
                <div className="categories-grid">
                  {categories.map(category => (
                    <div 
                      key={category} 
                      className="category-card"
                      onClick={() => handleCategoryClick(category)}
                    >
                      <div className="category-icon">
                        {category === 'film-songs' && '🎵'}
                        {category === 'stories' && '📖'}
                        {category === 'podcasts' && '🎙️'}
                        {category === 'web-series' && '🎬'}
                      </div>
                      <h3>{category.replace('-', ' ').toUpperCase()}</h3>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentLevel === 'movies' && (
              <div>
                <h1>Film Songs - Movies</h1>
                <ContentGrid 
                  items={[...new Set(content.map(item => item.movie_or_show))]}
                  type="movies"
                  onItemClick={handleMovieClick}
                  loading={loading}
                />
              </div>
            )}

            {currentLevel === 'songs' && (
              <div>
                <h1>Songs</h1>
                <ContentGrid 
                  items={content}
                  type="songs"
                  onItemClick={handlePlayAudio}
                  loading={loading}
                />
              </div>
            )}

            {currentLevel === 'genres' && (
              <div>
                <h1>Stories - Choose Genre</h1>
                <div className="genres-grid">
                  <div className="genre-card" onClick={() => handleGenreClick('horror')}>
                    <div className="genre-icon">👻</div>
                    <h3>Horror</h3>
                  </div>
                  <div className="genre-card" onClick={() => handleGenreClick('thriller')}>
                    <div className="genre-icon">🔪</div>
                    <h3>Thriller</h3>
                  </div>
                  <div className="genre-card" onClick={() => handleGenreClick('mystery')}>
                    <div className="genre-icon">🕵️</div>
                    <h3>Mystery</h3>
                  </div>
                  <div className="genre-card" onClick={() => handleGenreClick('comedy')}>
                    <div className="genre-icon">😂</div>
                    <h3>Comedy</h3>
                  </div>
                </div>
              </div>
            )}

            {currentLevel === 'shows' && (
              <div>
                <h1>Shows</h1>
                <ContentGrid 
                  items={content}
                  type="shows"
                  onItemClick={(item) => handleShowClick(item.movie_or_show)}
                  loading={loading}
                />
              </div>
            )}

            {currentLevel === 'seasons' && (
              <div>
                <h1>Seasons</h1>
                <ContentGrid 
                  items={content}
                  type="seasons"
                  onItemClick={(item) => handleSeasonClick(item.album_or_season)}
                  loading={loading}
                />
              </div>
            )}

            {currentLevel === 'episodes' && (
              <div>
                <h1>Episodes</h1>
                <ContentGrid 
                  items={content}
                  type="episodes"
                  onItemClick={handlePlayAudio}
                  loading={loading}
                />
              </div>
            )}
          </div>
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
