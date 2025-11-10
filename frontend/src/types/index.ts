export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Constant {
  id: string;
  name: string;
  symbol: string;
  value: string;
  unit: string;
  description: string;
  scope: 'user' | 'project' | 'global';
  scope_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Formula {
  id: string;
  title: string;
  latex: string;
  description: string;
  project_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
}

export interface CreateConstantRequest {
  name: string;
  symbol: string;
  value: string;
  unit: string;
  description: string;
  scope: string;
  scope_id?: string;
}

export interface CreateFormulaRequest {
  title: string;
  latex: string;
  description: string;
  project_id?: string;
}
