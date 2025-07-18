// services/api/service.js
import axios from 'axios';

// Get your base URL from environment variables or define it
// Make sure NEXT_PUBLIC_API_URL is defined in your .env.local file
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth services
export const authService = {
  register: async (userData) => {
    const response = await apiClient.post('/register', userData);
    // Upon successful registration, the backend returns an access_token. Store it.
    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  login: async (username, password) => {
    const response = await apiClient.post('/login', { username, password });
    // Upon successful login, store the access_token.
    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },
  // Added a logout function to clear the token
  logout: () => {
    localStorage.removeItem('token');
    // Optionally, redirect to login page or update global auth state
  }
};

// Species services
export const speciesService = {
  getSpecies: async () => {
    const response = await apiClient.get('/species');
    return response.data.species; // Returns the array of species
  },
  addSpecies: async (speciesData) => {
    const formData = new FormData();
    formData.append('name', speciesData.name);
    formData.append('scientific_name', speciesData.scientific_name || '');
    formData.append('category', speciesData.category);
    formData.append('description', speciesData.description || '');

    const response = await apiClient.post('/species', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.species; // Returns the created species object
  },
};

// Question services
export const questionService = {
  getQuestions: async () => {
    const response = await apiClient.get('/questions');
    return response.data.questions; // Returns the array of questions
  },
  createQuestion: async (q) => {
    const res = await apiClient.post('/questions', q);
    return res.data.question;
  },
};

// Observation services
export const observationService = {
  submitObservation: async (logData, photo) => {
    const formData = new FormData();
    formData.append('species_log', JSON.stringify(logData));
    if (photo) {
      formData.append('photo', photo);
    }

    const response = await apiClient.post('/species-logs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data; // Returns the created species_log object with message
  },

  getUserLogs: async () => {
    const response = await apiClient.get('/species-logs');
    return response.data.species_logs; // Returns the array of user-specific logs
  },

  // Admin-only
  getAllLogs: async () => {
    const response = await apiClient.get('/admin/all-logs');
    // This expects { species_logs: [...], total_count: N } from backend.
    // We only return the array of logs.
    return response.data.species_logs;
  },

  deleteLog: async (id) => {
    const response = await apiClient.delete(`/species-logs/${id}`);
    return response.data; // Backend might return a message, e.g., {"message": "Log deleted"}
  },

  updateLog: async (id, updateData) => {
    const response = await apiClient.put(`/species-logs/${id}`, updateData);
    // Backend returns { "message": "...", "species_log": {...} }
    return response.data.species_log; // Returns the updated species_log object
  },

  exportCSV: async () => {
    const response = await apiClient.get('/admin/export-csv', {
      responseType: 'blob', // Important for file downloads
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'biodiversity_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove(); // Clean up the element
    window.URL.revokeObjectURL(url); // Release the object URL
  },
};

// User services (Admin only)
export const userService = {
  getAllUsers: async () => {
    const response = await apiClient.get('/admin/users');
    return response.data.users; // Returns the array of users
  },
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/admin/users/${id}`);
    return response.data; // Backend might return a message
  },
  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/admin/users/${id}`, userData);
    return response.data.user; // Returns the updated user object
  },
};

// Public map services
export const mapService = {
  getSpeciesLocations: async () => {
    const response = await axios.get(`${API_BASE_URL}/public/species-locations`);
    return response.data;
  },
  getSpeciesImages: async () => {
    const response = await axios.get(`${API_BASE_URL}/public/species-images`);
    return response.data;
  },
};
