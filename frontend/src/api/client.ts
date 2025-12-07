import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_name: string;
  user_email: string;
}

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url); // Debug
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url); // Debug
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Auth API
export const authAPI = {
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/signup', { email, password, name }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  getMe: () => apiClient.get('/me'),
};

// Projects API
export const projectsAPI = {
  getAll: () => apiClient.get('/projects'),
  getById: (id: string) => apiClient.get(`/projects/${id}`),
  create: (data: any) => apiClient.post('/projects', data),
  update: (id: string, data: any) => apiClient.put(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete(`/projects/${id}`),
  // Members
  getMembers: (projectId: string) => apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`),
  addMember: (projectId: string, userId: string) => 
    apiClient.post(`/projects/${projectId}/members`, { user_id: userId }),
  removeMember: (projectId: string, userId: string) =>
    apiClient.delete(`/projects/${projectId}/members/${userId}`),
};

// User API
export const usersAPI = {
  search: (query: string, excludeProjectId?: string) => {
    const params = new URLSearchParams({ q: query });
    if (excludeProjectId) {
      params.append('exclude_project', excludeProjectId);
    }
    return apiClient.get(`/users/search?${params.toString()}`);
  },
};

// Tasks API
export const tasksAPI = {
  getByProject: (projectId: string) => apiClient.get(`/projects/${projectId}/tasks`),
  getById: (id: string) => apiClient.get(`/tasks/${id}`),
  create: (projectId: string, data: any) => apiClient.post(`/projects/${projectId}/tasks`, data),
  update: (id: string, data: any) => apiClient.put(`/tasks/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
};

// Constants API
export const constantsAPI = {
  getAll: (params?: any) => apiClient.get('/constants', { params }),
  getById: (id: string) => apiClient.get(`/constants/${id}`),
  create: (data: any) => apiClient.post('/constants', data),
  update: (id: string, data: any) => apiClient.put(`/constants/${id}`, data),
  delete: (id: string) => apiClient.delete(`/constants/${id}`),
};

// Formulas API
export const formulasAPI = {
  getAll: (params?: any) => apiClient.get('/formulas', { params }),
  getById: (id: string) => apiClient.get(`/formulas/${id}`),
  create: (data: any) => apiClient.post('/formulas', data),
  update: (id: string, data: any) => apiClient.put(`/formulas/${id}`, data),
  delete: (id: string) => apiClient.delete(`/formulas/${id}`),
};
