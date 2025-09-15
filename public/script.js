const API_BASE_URL = 'https://uzjci0fxoa.execute-api.ap-south-1.amazonaws.com/prod';
const CLOUDFRONT_URL = 'https://d1f6bwiv6jb91l.cloudfront.net';

let currentView = 'categories';
let currentCategory = '';
let currentSubcategory = '';
let currentShow = null;
let currentSeason = '';
let allShows = [];
let audio = null;
let isPlaying = false;

// DOM Elements
const loading = document.getElementById('loading');
const breadcrumb = document.getElementById('breadcrumb');
const breadcrumbText = document.getElementById('breadcrumbText');
const goBackBtn = document.getElementById('goBack');
const categoriesSection = document.getElementById('categories');
const categoriesGrid = document.getElementById('categoriesGrid');
const showsSection = document.getElementById('shows');
const showsGrid = document.getElementById('showsGrid');
const showsTitle = document.getElementById('showsTitle');
const episodesSection = document.getElementById('episodes');
const episodesList = document.getElementById('episodesList');
const episodesTitle = document.getElementById('episodesTitle');
const audioPlayer = document.getElementById('audioPlayer');
const trackTitle = document.getElementById('trackTitle');
const trackArtist = document.getElementById('trackArtist');
const playPauseBtn = document.getElementById('playPauseBtn');
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
const progress = document.getElementById('progress');
const progressBar = document.querySelector('.progress-bar');
const closePlayer = document.getElementById('closePlayer');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    audio = document.getElementById('audio');
    loadCategories();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    goBackBtn.addEventListener('click', goBack);
    playPauseBtn.addEventListener('click', togglePlayPause);
    closePlayer.addEventListener('click', closeAudioPlayer);
    
    // Audio events
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => {
        playPauseBtn.textContent = '▶️';
        isPlaying = false;
    });
    
    // Progress bar click
    progressBar.addEventListener('click', seekAudio);
}

// API Functions
async function fetchAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await response.json();
        
        // Parse body if it's a string (Lambda response format)
        if (data.body && typeof data.body === 'string') {
            return JSON.parse(data.body);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        return [];
    }
}

// Load Categories
async function loadCategories() {
    showLoading(true);
    
    try {
        const shows = await fetchAPI('/shows');
        const categories = [...new Set(shows.map(show => show.categoryEnglish))];
        
        displayCategories(categories);
        showView('categories');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    
    showLoading(false);
}

// Display Categories
function displayCategories(categories) {
    const categoryIcons = {
        'film-songs': '🎵',
        'stories': '📚',
        'podcasts': '🎙️',
        'web-series': '🎬'
    };
    
    categoriesGrid.innerHTML = categories.map(category => `
        <div class="category-card ${category}" onclick="loadShows('${category}')">
            <div class="category-icon">${categoryIcons[category] || '🎵'}</div>
            <h3>${category.replace('-', ' ').toUpperCase()}</h3>
        </div>
    `).join('');
}

// Load Subcategories
async function loadShows(category) {
    // Check authentication first
    if (!requireAuth()) {
        showLoading(false);
        return;
    }
    
    showLoading(true);
    currentCategory = category;
    
    try {
        allShows = await fetchAPI('/shows');
        const categoryShows = allShows.filter(show => show.categoryEnglish === category);
        
        if (category === 'stories') {
            // Show horror/thriller subcategories
            const subcategories = [...new Set(categoryShows.map(show => show.subcategoryEnglish))];
            displaySubcategories(subcategories, category);
        } else if (category === 'film-songs') {
            // Show hit-kannada-songs-vol1 etc
            const subcategories = [...new Set(categoryShows.map(show => show.subcategoryEnglish))];
            displaySubcategories(subcategories, category);
        } else if (category === 'web-series') {
            // Show action-drama etc
            const subcategories = [...new Set(categoryShows.map(show => show.subcategoryEnglish))];
            displaySubcategories(subcategories, category);
        } else if (category === 'podcasts') {
            // Show season1/season2
            const subcategories = [...new Set(categoryShows.map(show => show.subcategoryEnglish))];
            displaySubcategories(subcategories, category);
        }
        
        showView('shows');
        updateBreadcrumb(`${category.replace('-', ' ').toUpperCase()}`);
    } catch (error) {
        console.error('Error loading shows:', error);
    }
    
    showLoading(false);
}

// Display Subcategories
function displaySubcategories(subcategories, category) {
    const subcategoryIcons = {
        'horror': '👻',
        'thriller': '🔪',
        'hit-kannada-songs-vol1': '🎵',
        'action-drama': '🎬',
        'season1': '📅',
        'season2': '📅'
    };
    
    showsTitle.textContent = `${category.replace('-', ' ').toUpperCase()} Categories`;
    
    showsGrid.innerHTML = subcategories.map(subcategory => `
        <div class="content-card">
            <div class="card-image ${subcategory}" onclick="loadShowsInSubcategory('${subcategory}')" style="background-image: url('images/backgrounds/${subcategory}-bg.jpg')">
                <span class="placeholder-image">${subcategoryIcons[subcategory] || '📁'}</span>
            </div>
            <div class="card-content" onclick="loadShowsInSubcategory('${subcategory}')">
                <h3>${subcategory.replace('-', ' ').toUpperCase()}</h3>
                <p>Browse ${subcategory} content</p>
            </div>
        </div>
    `).join('');
}

// Load Shows in Subcategory
function loadShowsInSubcategory(subcategory) {
    // Check authentication first
    if (!requireAuth()) {
        return;
    }
    
    currentSubcategory = subcategory;
    
    const categoryShows = allShows.filter(show => 
        show.categoryEnglish === currentCategory && 
        show.subcategoryEnglish === subcategory
    );
    
    displayActualShows(categoryShows);
    showView('shows');
    updateBreadcrumb(`${currentCategory.replace('-', ' ').toUpperCase()} > ${subcategory.replace('-', ' ').toUpperCase()}`);
}

// Display Actual Shows
function displayActualShows(shows) {
    showsTitle.textContent = `${currentSubcategory.replace('-', ' ').toUpperCase()} Shows`;
    
    // For podcasts, go directly to episodes (no intermediate show level)
    if (currentCategory === 'podcasts') {
        if (shows.length > 0) {
            loadEpisodes(shows[0].showId, `Podcast ${currentSubcategory.toUpperCase()}`);
        }
        return;
    }
    
    // For film songs, go directly to episodes (no seasons)
    if (currentCategory === 'film-songs') {
        const uniqueShows = {};
        shows.forEach(show => {
            const showName = show.showTitleEnglish || show.showTitle;
            if (!uniqueShows[showName]) {
                uniqueShows[showName] = show;
            }
        });
        
        showsGrid.innerHTML = Object.values(uniqueShows).map(show => {
            const bgImage = show.backgroundUrl || `images/show-backgrounds/${show.showId}-bg.jpg`;
            return `
                <div class="content-card" onclick="loadEpisodes('${show.showId}', '${show.showTitleEnglish || show.showTitle}')">
                    <div class="card-image" style="background-image: url('${bgImage}')">
                        <span class="placeholder-image">🎵</span>
                    </div>
                    <div class="card-content">
                        <h3>${show.showTitleEnglish || show.showTitle}</h3>
                        <p>${show.description || 'No description available'}</p>
                        <p><strong>Songs Available</strong></p>
                    </div>
                </div>
            `;
        }).join('');
        return;
    }
    
    // For stories, group by show name (BhootadaMane1, BhootadaMane2)
    const uniqueShows = {};
    shows.forEach(show => {
        const showName = show.showTitleEnglish || show.showTitle;
        if (!uniqueShows[showName]) {
            uniqueShows[showName] = show;
        }
    });
    
    showsGrid.innerHTML = Object.values(uniqueShows).map(show => {
        const bgImage = show.backgroundUrl || `images/show-backgrounds/${show.showId}-bg.jpg`;
        return `
            <div class="content-card" onclick="loadSeasons('${show.showId}', '${show.showTitleEnglish || show.showTitle}')">
                <div class="card-image" style="background-image: url('${bgImage}')">
                    <span class="placeholder-image">📺</span>
                </div>
                <div class="card-content">
                    <h3>${show.showTitleEnglish || show.showTitle}</h3>
                    <p>${show.description || 'No description available'}</p>
                    <p><strong>Seasons Available</strong></p>
                </div>
            </div>
        `;
    }).join('');
}

// For podcasts, go directly to episodes from subcategory
function loadPodcastEpisodes(season) {
    const seasonShows = allShows.filter(show => 
        show.categoryEnglish === 'podcasts' && 
        (show.seasonEnglish === season || show.subcategoryEnglish === season)
    );
    
    if (seasonShows.length > 0) {
        // Go directly to episodes
        loadEpisodes(seasonShows[0].showId, `Podcast ${season.toUpperCase()}`);
    }
}

// Load Seasons (stories/horror/BhootadaMane1/season1, season2)
function loadSeasons(showId, showTitle) {
    // Check authentication first
    if (!requireAuth()) {
        return;
    }
    
    currentShow = { showId, showTitle };
    
    // Find all seasons for this show
    const showSeasons = allShows.filter(show => {
        return (show.showTitleEnglish === showTitle || show.showTitle === showTitle) &&
               show.categoryEnglish === currentCategory &&
               show.subcategoryEnglish === currentSubcategory;
    });
    
    // Get unique seasons
    const seasons = [...new Set(showSeasons.map(show => show.seasonEnglish || 'season1'))];
    
    displaySeasons(seasons, showTitle, showSeasons);
    showView('shows');
    updateBreadcrumb(`${currentCategory.replace('-', ' ').toUpperCase()} > ${currentSubcategory.replace('-', ' ').toUpperCase()} > ${showTitle}`);
}

// Display Seasons
function displaySeasons(seasons, showTitle, seasonShows) {
    showsTitle.textContent = `${showTitle} - Seasons`;
    
    showsGrid.innerHTML = seasons.map(season => {
        const seasonShow = seasonShows.find(show => (show.seasonEnglish || 'season1') === season);
        return `
            <div class="content-card" onclick="loadEpisodes('${seasonShow.showId}', '${showTitle}', '${season}')">
                <div class="card-image">
                    <span class="placeholder-image">📅</span>
                </div>
                <div class="card-content">
                    <h3>${season.replace('-', ' ').toUpperCase()}</h3>
                    <p>${seasonShow.totalEpisodes || 2} Episodes available</p>
                </div>
            </div>
        `;
    }).join('');
}

// Load Episodes
async function loadEpisodes(showId, showTitle, season = '') {
    // Check authentication first
    if (!requireAuth()) {
        showLoading(false);
        return;
    }
    
    showLoading(true);
    currentShow = { showId, showTitle };
    currentSeason = season;
    
    try {
        const episodes = await fetchAPI(`/shows/${showId}/episodes`);
        
        displayEpisodes(episodes, showTitle, season);
        showView('episodes');
        
        let breadcrumbPath = `${currentCategory.replace('-', ' ').toUpperCase()}`;
        
        // For podcasts, don't show the show title in breadcrumb
        if (currentCategory === 'podcasts') {
            if (currentSubcategory) breadcrumbPath += ` > ${currentSubcategory.replace('-', ' ').toUpperCase()}`;
        } else {
            // For other categories, show full path
            if (currentSubcategory) breadcrumbPath += ` > ${currentSubcategory.replace('-', ' ').toUpperCase()}`;
            breadcrumbPath += ` > ${showTitle}`;
            if (season) breadcrumbPath += ` > ${season.toUpperCase()}`;
        }
        
        updateBreadcrumb(breadcrumbPath);
    } catch (error) {
        console.error('Error loading episodes:', error);
    }
    
    showLoading(false);
}

// Display Episodes
function displayEpisodes(episodes, showTitle, season = '') {
    const title = season ? `${showTitle} - ${season.toUpperCase()} Episodes` : `${showTitle} - Episodes`;
    episodesTitle.textContent = title;
    
    episodesList.innerHTML = episodes.map((episode, index) => `
        <div class="episode-item" onclick="playEpisode('${episode.s3Key}', '${episode.title || episode.titleEnglish}', '${episode.singer || 'Unknown Artist'}')">
            <div class="episode-number">${index + 1}</div>
            <div class="episode-info">
                <h4>${episode.title || episode.titleEnglish}</h4>
                <p>${episode.singer ? `Singer: ${episode.singer}` : 'Episode'}</p>
                <p>${episode.description || ''}</p>
            </div>
            <button class="play-btn">▶️</button>
        </div>
    `).join('');
}

// Play Episode
function playEpisode(s3Key, title, artist) {
    // Check authentication first
    if (!requireAuth()) {
        return;
    }
    
    const audioUrl = `${CLOUDFRONT_URL}/${s3Key}`;
    
    trackTitle.textContent = title;
    trackArtist.textContent = artist;
    
    audio.src = audioUrl;
    audio.load();
    
    audioPlayer.style.display = 'flex';
    
    // Auto play
    audio.play().then(() => {
        playPauseBtn.textContent = '⏸️';
        isPlaying = true;
    }).catch(error => {
        console.error('Error playing audio:', error);
        alert('Error playing audio. Please check if the file exists.');
    });
}

// Audio Controls
function togglePlayPause() {
    if (isPlaying) {
        audio.pause();
        playPauseBtn.textContent = '▶️';
        isPlaying = false;
    } else {
        audio.play().then(() => {
            playPauseBtn.textContent = '⏸️';
            isPlaying = true;
        }).catch(error => {
            console.error('Error playing audio:', error);
        });
    }
}

function updateDuration() {
    const dur = formatTime(audio.duration);
    duration.textContent = dur;
}

function updateProgress() {
    const current = audio.currentTime;
    const total = audio.duration;
    
    if (total > 0) {
        const progressPercent = (current / total) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTime.textContent = formatTime(current);
    }
}

function seekAudio(e) {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    
    audio.currentTime = percentage * audio.duration;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function closeAudioPlayer() {
    audio.pause();
    audioPlayer.style.display = 'none';
    playPauseBtn.textContent = '▶️';
    isPlaying = false;
}

// Navigation
function goBack() {
    if (currentView === 'episodes') {
        // For podcasts, go back to category level
        if (currentCategory === 'podcasts') {
            loadShows(currentCategory);
            currentSubcategory = '';
            currentShow = null;
            currentSeason = '';
        } else if (currentSeason) {
            loadSeasons(currentShow.showId, currentShow.showTitle);
        } else if (currentSubcategory) {
            loadShowsInSubcategory(currentSubcategory);
        } else {
            loadShows(currentCategory);
        }
    } else if (currentView === 'shows') {
        if (currentShow && currentSeason) {
            loadShowsInSubcategory(currentSubcategory);
            currentShow = null;
            currentSeason = '';
        } else if (currentSubcategory) {
            loadShows(currentCategory);
            currentSubcategory = '';
        } else {
            loadCategories();
            currentCategory = '';
        }
    }
}

function showView(view) {
    // Hide all sections
    categoriesSection.style.display = 'none';
    showsSection.style.display = 'none';
    episodesSection.style.display = 'none';
    
    // Show selected section
    if (view === 'categories') {
        categoriesSection.style.display = 'block';
        breadcrumb.style.display = 'none';
        currentView = 'categories';
    } else if (view === 'shows') {
        showsSection.style.display = 'block';
        breadcrumb.style.display = 'flex';
        currentView = 'shows';
    } else if (view === 'episodes') {
        episodesSection.style.display = 'block';
        breadcrumb.style.display = 'flex';
        currentView = 'episodes';
    }
}

function updateBreadcrumb(text) {
    const parts = text.split(' > ');
    let breadcrumbHTML = '<span class="breadcrumb-item" onclick="goHome()">Home</span>';
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        
        if (isLast) {
            breadcrumbHTML += ` > <span class="breadcrumb-current">${part}</span>`;
        } else {
            const clickHandler = getBreadcrumbClickHandler(i, parts);
            breadcrumbHTML += ` > <span class="breadcrumb-item" onclick="${clickHandler}">${part}</span>`;
        }
    }
    
    breadcrumbText.innerHTML = breadcrumbHTML;
}

function getBreadcrumbClickHandler(index, parts) {
    if (index === 0) {
        // Category level (STORIES, PODCASTS, etc.)
        const category = parts[0].toLowerCase().replace(' ', '-');
        return `loadShows('${category}')`;
    } else if (index === 1) {
        // Subcategory level (THRILLER, HORROR, etc.)
        const subcategory = parts[1].toLowerCase().replace(' ', '-');
        return `loadShowsInSubcategory('${subcategory}')`;
    } else if (index === 2) {
        // Show level (Blood Case 2, etc.)
        const showTitle = parts[2];
        return `loadSeasons('${currentShow?.showId}', '${showTitle}')`;
    }
    return '';
}

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
}

// Make togglePassword available globally
window.togglePassword = function(inputId, toggleElement) {
    const input = document.getElementById(inputId);
    
    if (input && input.type === 'password') {
        input.type = 'text';
        toggleElement.innerHTML = '🙈'; // See no evil monkey
    } else if (input) {
        input.type = 'password';
        toggleElement.innerHTML = '👁️'; // Eye
    }
};

// Search functionality
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim().toLowerCase();
    
    if (!query) {
        alert('Please enter a search term');
        return;
    }
    
    console.log('Searching for:', query);
    searchContent(query);
}

function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        performSearch();
    }
}

async function searchContent(query) {
    showLoading(true);
    
    try {
        // Get all shows and episodes
        const allShows = await fetchAPI('/shows');
        const searchResults = [];
        
        // Search in shows
        allShows.forEach(show => {
            const showTitle = (show.showTitleEnglish || show.showTitle || '').toLowerCase();
            const description = (show.description || '').toLowerCase();
            const category = (show.categoryEnglish || '').toLowerCase();
            
            if (showTitle.includes(query) || description.includes(query) || category.includes(query)) {
                searchResults.push({
                    type: 'show',
                    title: show.showTitleEnglish || show.showTitle,
                    description: show.description,
                    category: show.categoryEnglish,
                    data: show
                });
            }
        });
        
        // Search in episodes for each show
        for (const show of allShows) {
            try {
                const episodes = await fetchAPI(`/shows/${show.showId}/episodes`);
                episodes.forEach(episode => {
                    const episodeTitle = (episode.title || episode.titleEnglish || '').toLowerCase();
                    const episodeDesc = (episode.description || '').toLowerCase();
                    
                    if (episodeTitle.includes(query) || episodeDesc.includes(query)) {
                        searchResults.push({
                            type: 'episode',
                            title: episode.title || episode.titleEnglish,
                            description: episode.description,
                            showTitle: show.showTitleEnglish || show.showTitle,
                            data: episode
                        });
                    }
                });
            } catch (error) {
                console.log('No episodes found for show:', show.showId);
            }
        }
        
        displaySearchResults(searchResults, query);
        
    } catch (error) {
        console.error('Search error:', error);
        alert('Search failed. Please try again.');
    }
    
    showLoading(false);
}

function displaySearchResults(results, query) {
    // Update breadcrumb
    updateBreadcrumb(`Search Results for "${query}"`);
    showView('shows');
    
    showsTitle.textContent = `Search Results for "${query}" (${results.length} found)`;
    
    if (results.length === 0) {
        showsGrid.innerHTML = `
            <div class="no-results">
                <h3>No results found</h3>
                <p>Try searching with different keywords</p>
            </div>
        `;
        return;
    }
    
    showsGrid.innerHTML = results.map(result => {
        if (result.type === 'show') {
            return `
                <div class="content-card" onclick="loadEpisodes('${result.data.showId}', '${result.title}')">
                    <div class="card-image">
                        <span class="placeholder-image">📺</span>
                    </div>
                    <div class="card-content">
                        <h3>${result.title}</h3>
                        <p><strong>Category:</strong> ${result.category}</p>
                        <p>${result.description || 'No description available'}</p>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="content-card" onclick="playEpisode('${result.data.s3Key}', '${result.title}', 'PKRK FM')">
                    <div class="card-image">
                        <span class="placeholder-image">🎵</span>
                    </div>
                    <div class="card-content">
                        <h3>${result.title}</h3>
                        <p><strong>From:</strong> ${result.showTitle}</p>
                        <p>${result.description || 'Episode'}</p>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// Language filter functionality
function handleLanguageChange(selectedLanguage) {
    console.log('Language changed to:', selectedLanguage);
    
    if (selectedLanguage === 'kannada') {
        // Show normal content
        loadCategories();
        showView('categories');
    } else {
        // Show content not found for other languages
        showLanguageNotFound(selectedLanguage);
    }
}

function showLanguageNotFound(language) {
    // Hide all sections
    categoriesSection.style.display = 'none';
    showsSection.style.display = 'none';
    episodesSection.style.display = 'none';
    breadcrumb.style.display = 'none';
    
    // Create and show not found message
    let notFoundSection = document.getElementById('languageNotFound');
    if (!notFoundSection) {
        notFoundSection = document.createElement('div');
        notFoundSection.id = 'languageNotFound';
        notFoundSection.className = 'language-not-found';
        document.querySelector('.main-content .container').appendChild(notFoundSection);
    }
    
    notFoundSection.innerHTML = `
        <div class="not-found-content">
            <h2>😔 Content Not Found</h2>
            <p>Sorry, we don't have ${language.charAt(0).toUpperCase() + language.slice(1)} content available yet.</p>
            <p>Currently, we only support <strong>Kannada</strong> audio content.</p>
            <button onclick="switchToKannada()" class="back-to-kannada-btn">Switch to Kannada</button>
        </div>
    `;
    
    notFoundSection.style.display = 'block';
}

function switchToKannada() {
    // Reset language dropdown to Kannada
    const languageDropdown = document.querySelector('.language-dropdown');
    if (languageDropdown) {
        languageDropdown.value = 'kannada';
    }
    
    // Hide not found section
    const notFoundSection = document.getElementById('languageNotFound');
    if (notFoundSection) {
        notFoundSection.style.display = 'none';
    }
    
    // Show categories
    loadCategories();
    showView('categories');
}

// Make search and language functions globally available
window.performSearch = performSearch;
window.handleSearchKeypress = handleSearchKeypress;
window.handleLanguageChange = handleLanguageChange;
window.switchToKannada = switchToKannada;