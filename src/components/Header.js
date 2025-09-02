import React, { useState } from 'react';
import '../styles/Header.css';

const Header = ({ onLanguageChange, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <button className="menu-btn">
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <div className="logo">
            <span className="logo-text">PKRK</span>
          </div>

          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-container">
              <input
                type="text"
                placeholder="Search audiobook & stories"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn">
                🔍
              </button>
            </div>
          </form>
        </div>

        <div className="header-right">
          <div className="language-selector">
            <button 
              className="language-btn"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            >
              Languages
              <span className="dropdown-arrow">▼</span>
              <span className="language-label">kannada</span>
            </button>
            {showLanguageDropdown && (
              <div className="language-dropdown">
                <div className="language-option active">Kannada</div>
                <div className="language-option">Hindi</div>
                <div className="language-option">English</div>
              </div>
            )}
          </div>

          <div className="header-actions">
            <button className="action-btn kuku-tv">
              📺 Kuku TV
            </button>
            <button className="action-btn download">
              📱 Download App
            </button>
            <button className="trial-btn">
              Get Free Trial
            </button>
            <button className="theme-toggle">🌙</button>
            <button className="login-btn">
              Login / Signup
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
