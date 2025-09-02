import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroCarousel from './components/HeroCarousel';
import ContentCard from './components/ContentCard';
import AudioPlayer from './components/AudioPlayer';
import { getCategories, getCategoryContent, getPlaybackUrl } from './services/api';
import './styles/App.css';

const App = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('film-songs');
  const [content, setContent] = useState([]);
  const [featuredContent, setFeaturedContent] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      
      if (categoriesData.length > 0) {
        loadCategoryContent(categoriesData[0]);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryContent = async (category) => {
    try {
      setLoading(true);
      const contentData = await getCategoryContent(category);
      setContent(contentData);
      setSelectedCategory(category);
      
      // Set featured content (first 3 episodes)
      const episodes = contentData.filter(item => item.content_type === 'EPISODE');
      setFeaturedContent(episodes.slice(0, 3));
    } catch (error) {
      console.error('Error loading category content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayContent = async (contentItem) => {
    try {
      if (contentItem.cloudfront_url) {
        setCurrentTrack({
          url: contentItem.cloudfront_url,
          title: contentItem.title || contentItem.file_name,
          artist: contentItem.singer || contentItem.movie_or_show,
          contentItem
        });
      } else {
        const playbackData = await getPlaybackUrl(contentItem.content_id);
        setCurrentTrack({
          url: playbackData.playback_url,
          title: contentItem.title || contentItem.file_name,
          artist: contentItem.singer || contentItem.movie_or_show,
          contentItem
        });
      }
    } catch (error) {
      console.error('Error playing content:', error);
      alert('Unable to play this content. Please try again.');
    }
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm) return;
    
    const filteredContent = content.filter(item =>
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.singer?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setContent(filteredContent);
  };

  const episodes = content.filter(item => item.content_type === 'EPISODE');

  return (
    <div className="app">
      <Header onSearch={handleSearch} />
      
      <main className="main-content">
        {featuredContent.length > 0 && (
          <HeroCarousel 
            featuredContent={featuredContent}
            onPlayContent={handlePlayContent}
          />
        )}

        <section className="category-navigation">
          <div className="container">
            <div className="category-tabs">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => loadCategoryContent(category)}
                >
                  {category.replace('-', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="daily-episodes">
          <div className="container">
            <div className="section-header">
              <h2>Daily New Episodes</h2>
              <button className="view-all-btn">View All →</button>
            </div>
            
            {loading ? (
              <div className="loading">Loading content...</div>
            ) : (
              <div className="content-grid">
                {episodes.map(episode => (
                  <ContentCard
                    key={episode.content_id}
                    content={episode}
                    onPlay={handlePlayContent}
                    showDuration={true}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
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
