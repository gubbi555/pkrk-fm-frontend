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
    const shows = response.data;
    const categories = [...new Set(shows.map(show => show.categoryEnglish))];
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return ['film-songs', 'stories', 'podcasts', 'web-series'];
  }
};

export const getCategoryContent = async (category) => {
  try {
    const response = await api.get(`/shows?category=${category}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching category content:', error);
    return [];
  }
};

export const getShowEpisodes = async (showId) => {
  try {
    const response = await api.get(`/shows/${showId}/episodes`);
    return response.data || [];
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
