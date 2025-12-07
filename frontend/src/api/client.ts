import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  user_name: string;
  user_email: string;
}

export interface MyRoleResponse {
  role: 'owner' | 'admin' | 'member';
}

const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
  
  getMembers: (projectId: string) => 
    apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`),
  addMember: (projectId: string, userId: string) => 
    apiClient.post(`/projects/${projectId}/members`, { user_id: userId }),
  removeMember: (projectId: string, userId: string) =>
    apiClient.delete(`/projects/${projectId}/members/${userId}`),
  
  getMyRole: (projectId: string) => 
    apiClient.get<MyRoleResponse>(`/projects/${projectId}/my-role`),
  
  updateMemberRole: (projectId: string, userId: string, role: 'admin' | 'member') =>
    apiClient.put(`/projects/${projectId}/members/${userId}/role`, { role }),
  
  transferOwnership: (projectId: string, newOwnerId: string) =>
    apiClient.post(`/projects/${projectId}/transfer-ownership`, { new_owner_id: newOwnerId }),
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

// Boards API
export interface Board {
  id: string;
  project_id: string;
  name: string;
  data: BoardData;
  settings: BoardSettings;
  created_at: string;
  updated_at: string;
}

export interface BoardData {
  objects: DrawObject[];
  version: number;
}

export interface BoardSettings {
  backgroundColor: string;
}

export interface DrawObject {
  id: string;
  type: 'path' | 'line' | 'rect' | 'circle' | 'text';
  points?: { x: number; y: number }[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color: string;
  lineWidth: number;
  createdBy: string;
  createdAt: string;
}

export const boardsAPI = {
  getByProject: (projectId: string) => 
    apiClient.get<Board[]>(`/projects/${projectId}/boards`),
  getById: (boardId: string) => 
    apiClient.get<Board>(`/boards/${boardId}`),
  create: (projectId: string, name: string) => 
    apiClient.post<Board>(`/projects/${projectId}/boards`, { name }),
  update: (boardId: string, name: string) => 
    apiClient.put<Board>(`/boards/${boardId}`, { name }),
  delete: (boardId: string) => 
    apiClient.delete(`/boards/${boardId}`),
  clear: (boardId: string) => 
    apiClient.post(`/boards/${boardId}/clear`),
};
