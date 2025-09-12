import axios from 'axios';

const API_BASE_URL = 'https://uzjci0fxoa.execute-api.ap-south-1.amazonaws.com/prod';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const getCategories = async () => {
  try {
    const response = await api.get('/shows');
    let shows = response.data;
    
    // Parse the response body if it's a string
    if (typeof shows === 'string') {
      shows = JSON.parse(shows);
    }
    
    // Ensure shows is an array
    if (!Array.isArray(shows)) {
      console.log('Shows response:', shows);
      return ['film-songs', 'stories', 'podcasts', 'web-series'];
    }
    
    const categories = [...new Set(shows.map(show => show.categoryEnglish))];
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ['film-songs', 'stories', 'podcasts', 'web-series'];
  }
};

export const getCategoryContent = async (category) => {
  try {
    // Get all shows and filter client-side since API Gateway isn't passing query params
    const response = await api.get('/shows');
    let data = response.data;
    
    // Parse the response body if it's a string
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    // Filter by category on client side
    const filteredShows = data.filter(show => show.categoryEnglish === category);
    console.log(`Category: ${category}, Total shows: ${data.length}, Filtered: ${filteredShows.length}`);
    
    return filteredShows;
  } catch (error) {
    console.error('Error fetching category content:', error);
    return [];
  }
};

export const getShowEpisodes = async (showId) => {
  try {
    const response = await api.get(`/shows/${showId}/episodes`);
    let data = response.data;
    
    // Parse the response body if it's a string
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }
    
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return [];
  }
};

export const getPlaybackUrl = async (contentId) => {
  try {
    const response = await api.post('/playback', {
      content_id: contentId
    });
    return response.data;
  } catch (error) {
    console.error('Error getting playback URL:', error);
    throw error;
  }
};

export default api;
