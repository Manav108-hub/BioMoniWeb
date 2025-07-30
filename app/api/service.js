import axios from 'axios';

// Enhanced API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with better configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  // Add retry configuration
  retry: 3,
  retryDelay: 1000,
});

// Enhanced request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log request for debugging
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with retry logic
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // Log detailed error information
    console.error('❌ API Error:', {
      url: config?.url,
      method: config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code
    });

    // Handle network errors with retry
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || !error.response) {
      if (!config._retry) {
        config._retry = 0;
      }
      
      if (config._retry < (config.retry || 3)) {
        config._retry++;
        console.log(`🔄 Retrying request (${config._retry}/${config.retry || 3}): ${config.url}`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, config.retryDelay || 1000));
        return apiClient.request(config);
      }
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('🔒 Authentication failed - clearing token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
    }

    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('🚨 Server error detected:', error.response.status);
    }

    return Promise.reject(error);
  }
);

// Connection health check
export const healthCheck = async () => {
  try {
    console.log('🏥 Checking API health...');
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ API is healthy');
    return { healthy: true, status: response.status };
  } catch (error) {
    console.error('💔 API health check failed:', error.message);
    return { 
      healthy: false, 
      error: error.message,
      code: error.code,
      status: error.response?.status 
    };
  }
};

// Enhanced auth services with better error handling
export const authService = {
  register: async (userData, adminSecret = null) => {
    try {
      const headers = {};
      if (adminSecret) {
        headers['x-admin-secret'] = adminSecret;
      }
      
      const response = await apiClient.post('/register', userData, { headers });
      
      if (response.data.access_token && typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error; // Let the component handle the error
    }
  },

  login: async (username, password) => {
    try {
      if (!username || !password) {
        throw new Error('Username and password are required');
      }
      
      const response = await apiClient.post('/login', { username, password });
      
      if (response.data.access_token && typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Let the component handle the error
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      console.log('🚪 User logged out');
    }
  },

  getProfile: async () => {
    try {
      const response = await apiClient.get('/profile');
      return response.data.user;
    } catch (error) {
      console.error('Failed to get profile:', error);
      throw error;
    }
  },

  getStats: async () => {
    try {
      const response = await apiClient.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get stats:', error);
      throw error;
    }
  },
};

// Enhanced species services
export const speciesService = {
  getSpecies: async () => {
    try {
      const response = await apiClient.get('/species');
      return response.data.species || [];
    } catch (error) {
      console.error('Failed to get species:', error);
      throw error;
    }
  },

  addSpecies: async (speciesData) => {
    try {
      if (!speciesData.name || !speciesData.category) {
        throw new Error('Species name and category are required');
      }

      const formData = new FormData();
      formData.append('name', speciesData.name);
      formData.append('scientific_name', speciesData.scientific_name || '');
      formData.append('category', speciesData.category);
      formData.append('description', speciesData.description || '');

      const response = await apiClient.post('/species', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      return response.data.species;
    } catch (error) {
      console.error('Failed to add species:', error);
      throw error;
    }
  },
};

// Enhanced question services
export const questionService = {
  getQuestions: async () => {
    try {
      const response = await apiClient.get('/questions');
      return response.data.questions || [];
    } catch (error) {
      console.error('Failed to get questions:', error);
      throw error;
    }
  },

  getQuestionsWithDependencies: async () => {
    try {
      const response = await apiClient.get('/questions-with-dependencies');
      return response.data.questions || [];
    } catch (error) {
      console.error('Failed to get questions with dependencies:', error);
      throw error;
    }
  },

  createQuestion: async (questionData) => {
    try {
      if (!questionData.question_text) {
        throw new Error('Question text is required');
      }

      if ((questionData.question_type === 'single_choice' || 
           questionData.question_type === 'multiple_choice') && 
          (!questionData.options || questionData.options.length === 0)) {
        throw new Error('Options are required for choice questions');
      }

      const response = await apiClient.post('/questions', questionData);
      return response.data.question;
    } catch (error) {
      console.error('Failed to create question:', error);
      throw error;
    }
  },

  updateQuestion: async (id, updateData) => {
    try {
      if (!id) {
        throw new Error('Question ID is required');
      }

      const response = await apiClient.put(`/questions/${id}`, updateData);
      return response.data.question;
    } catch (error) {
      console.error('Failed to update question:', error);
      throw error;
    }
  },

  bulkUpdateQuestions: async (bulkPayload) => {
    try {
      if (!bulkPayload || !Array.isArray(bulkPayload.questions)) {
        throw new Error('Invalid bulk update payload');
      }

      const response = await apiClient.put('/questions/bulk', bulkPayload);
      return response.data;
    } catch (error) {
      console.error('Failed to bulk update questions:', error);
      throw error;
    }
  },

  deleteQuestion: async (id) => {
    try {
      if (!id) {
        throw new Error('Question ID is required');
      }

      const response = await apiClient.delete(`/questions/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete question:', error);
      throw error;
    }
  },

  bulkDeleteQuestions: async (ids) => {
    try {
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new Error('Question IDs are required');
      }

      const response = await apiClient.delete('/questions/bulk', {
        data: { question_ids: ids },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to bulk delete questions:', error);
      throw error;
    }
  },

  archiveQuestion: async (id) => {
    try {
      if (!id) {
        throw new Error('Question ID is required');
      }

      const response = await apiClient.patch(`/questions/${id}/archive`);
      return response.data;
    } catch (error) {
      console.error('Failed to archive question:', error);
      throw error;
    }
  },
};

// Enhanced observation services
export const observationService = {
  submitObservation: async (logData, photo) => {
    try {
      if (!logData) {
        throw new Error('Observation data is required');
      }

      const formData = new FormData();
      formData.append('species_log', JSON.stringify(logData));
      if (photo) {
        if (photo.size > 10 * 1024 * 1024) {
          throw new Error('Photo size must be less than 10MB');
        }
        formData.append('photo', photo);
      }

      const response = await apiClient.post('/species-logs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to submit observation:', error);
      throw error;
    }
  },

  getUserLogs: async () => {
    try {
      const response = await apiClient.get('/species-logs');
      return response.data.species_logs || [];
    } catch (error) {
      console.error('Failed to get user logs:', error);
      throw error;
    }
  },

  getLogDetail: async (logId) => {
    try {
      if (!logId) {
        throw new Error('Log ID is required');
      }

      const response = await apiClient.get(`/species-logs/${logId}`);
      return response.data.species_log;
    } catch (error) {
      console.error('Failed to get log detail:', error);
      throw error;
    }
  },

  getAllLogs: async () => {
    try {
      const response = await apiClient.get('/admin/all-logs');
      return response.data.species_logs || [];
    } catch (error) {
      console.error('Failed to get all logs:', error);
      throw error;
    }
  },

  deleteLog: async (id) => {
    try {
      if (!id) {
        throw new Error('Log ID is required');
      }

      const response = await apiClient.delete(`/species-logs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete log:', error);
      throw error;
    }
  },

  updateLog: async (id, data) => {
    try {
      if (!id) {
        throw new Error('Log ID is required');
      }

      const response = await apiClient.put(`/species-logs/${id}`, data);
      return response.data.species_log;
    } catch (error) {
      console.error('Failed to update log:', error);
      throw error;
    }
  },

  exportCSV: async () => {
    try {
      if (typeof window === 'undefined') {
        throw new Error('CSV export is only available in browser environment');
      }

      const response = await apiClient.get('/admin/export-csv', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `biodiversity_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { message: 'CSV exported successfully' };
    } catch (error) {
      console.error('Failed to export CSV:', error);
      throw error;
    }
  },
};

// Enhanced user services
export const userService = {
  getAllUsers: async () => {
    try {
      const response = await apiClient.get('/admin/users');
      return response.data.users || [];
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      if (!id) {
        throw new Error('User ID is required');
      }

      const response = await apiClient.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  },

  updateUser: async (id, data) => {
    try {
      if (!id) {
        throw new Error('User ID is required');
      }

      const response = await apiClient.put(`/admin/users/${id}`, data);
      return response.data.user;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  },
};

// Enhanced map services
export const mapService = {
  getSpeciesLocations: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/public/species-locations`, {
        timeout: 30000,
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to get species locations:', error);
      throw error;
    }
  },

  getSpeciesImages: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/public/species-images`, {
        timeout: 30000,
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to get species images:', error);
      throw error;
    }
  },
};

// Enhanced error handler
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  // Network errors
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
    return 'Unable to connect to server. Please check your internet connection and try again.';
  }
  
  // Timeout errors
  if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // Server response errors
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // HTTP status errors
  if (error.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 422:
        return 'Validation error. Please check your input.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `Server error (${error.response.status}). Please try again.`;
    }
  }
  
  // Generic errors
  if (error.message) {
    return error.message;
  }
  
  return defaultMessage;
};

// Debug helper
export const debugAPI = {
  checkConnection: async () => {
    console.log('🔍 Running API diagnostics...');
    console.log('📍 API Base URL:', API_BASE_URL);
    
    const health = await healthCheck();
    console.log('🏥 Health Check:', health);
    
    // Test basic endpoints
    const tests = [
      { name: 'Species', endpoint: '/species' },
      { name: 'Questions', endpoint: '/questions' },
    ];
    
    for (const test of tests) {
      try {
        const response = await axios.get(`${API_BASE_URL}${test.endpoint}`, { timeout: 5000 });
        console.log(`✅ ${test.name}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      }
    }
  },
  
  getConnectionInfo: () => ({
    baseURL: API_BASE_URL,
    hasToken: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Server',
    timestamp: new Date().toISOString()
  })
};

// Export all services
export default {
  authService,
  speciesService,
  questionService,
  observationService,
  userService,
  mapService,
  handleApiError,
  healthCheck,
  debugAPI,
};