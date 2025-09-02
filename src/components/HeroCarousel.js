import React, { useState, useEffect } from 'react';
import '../styles/HeroCarousel.css';

const HeroCarousel = ({ featuredContent, onPlayContent }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => 
        prev === featuredContent.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredContent.length]);

  const nextSlide = () => {
    setCurrentSlide(currentSlide === featuredContent.length - 1 ? 0 : currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide === 0 ? featuredContent.length - 1 : currentSlide - 1);
  };

  if (!featuredContent.length) return null;

  return (
    <div className="hero-carousel">
      <div className="carousel-container">
        {featuredContent.map((item, index) => (
          <div
            key={item.content_id}
            className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <div className="slide-content">
              <div className="slide-image">
                <div className="placeholder-image">
                  {item.category === 'film-songs' && '🎵'}
                  {item.category === 'stories' && '📖'}
                  {item.category === 'podcasts' && '🎙️'}
                  {item.category === 'web-series' && '🎬'}
                </div>
              </div>
              
              <div className="slide-info">
                <h2 className="slide-title">{item.title || item.file_name}</h2>
                <p className="slide-subtitle">
                  {item.singer && `Singer: ${item.singer}`}
                  {item.director && `Director: ${item.director}`}
                  {item.description && item.description}
                </p>
                
                <button 
                  className="play-button"
                  onClick={() => onPlayContent(item)}
                >
                  <div className="play-icon">▶</div>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        <button className="carousel-btn prev" onClick={prevSlide}>
          ❮
        </button>
        <button className="carousel-btn next" onClick={nextSlide}>
          ❯
        </button>
        
        <div className="carousel-dots">
          {featuredContent.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
