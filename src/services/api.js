import axios from 'axios';

const API_BASE_URL = 'https://otgbpyshhg.execute-api.ap-south-1.amazonaws.com/prod';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    return response.data.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

export const getCategoryContent = async (category) => {
  try {
    const response = await api.get(`/category/${category}`);
    return response.data.content || [];
  } catch (error) {
    console.error('Error fetching category content:', error);
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
