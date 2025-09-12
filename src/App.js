import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AudioPlayer from './components/AudioPlayer';
import { getCategories, getCategoryContent, getShowEpisodes } from './services/api';
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
    
    // Show all shows in the category
    setCurrentItems(contentData.map(show => ({
      name: show.showTitleEnglish || show.showTitle,
      type: 'show',
      data: show
    })));
  };

  const handleItemClick = async (item) => {
    setBreadcrumb([...breadcrumb, item.name]);
    
    if (item.type === 'show') {
      // Load episodes for the show
      const episodes = await getShowEpisodes(item.data.showId);
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
      url: `https://d1f6bwiv6jb91l.cloudfront.net/${contentItem.s3Key}`,
      title: contentItem.title || contentItem.titleEnglish,
      artist: contentItem.singer || 'PKRK FM'
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
    const isEpisodes = currentItems.length > 0 && currentItems[0].audioId;

    if (isEpisodes) {
      return (
        <div className="episodes-section">
          <h2>Episodes</h2>
          <div className="episodes-list">
            {currentItems.map((episode, index) => (
              <div key={episode.audioId} className="episode-item" onClick={() => handlePlayContent(episode)}>
                <div className="episode-number">#{index + 1}</div>
                <div className="episode-info">
                  <h4>{episode.title || episode.titleEnglish}</h4>
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
