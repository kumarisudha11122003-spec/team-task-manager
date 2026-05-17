import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : (process.env.REACT_APP_API_URL || '/api'),
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only force-logout on 401 (token expired/missing), NOT 403 (forbidden - user is authenticated but lacks permission)
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
  updateProfile: (data) => API.patch('/auth/me', data),
  changePassword: (data) => API.post('/auth/change-password', data),
  deleteAccount: () => API.delete('/auth/me'),
};

export const usersAPI = {
  getAll: () => API.get('/users'),
  invite: (data) => API.post('/users/invite', data),
  delete: (id) => API.delete(`/users/${id}`),
  updateRole: (id, role) => API.patch(`/users/${id}/role`, { role }),
};

export const projectsAPI = {
  getAll: () => API.get('/projects'),
  getOne: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  delete: (id) => API.delete(`/projects/${id}`),
  addMember: (id, email) => API.post(`/projects/${id}/members`, { email }),
  removeMember: (id, userId) => API.delete(`/projects/${id}/members/${userId}`),
};

export const tasksAPI = {
  getAll: () => API.get('/tasks'),
  getByProject: (projectId) => API.get(`/tasks?project_id=${projectId}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.patch(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
};

export const dashboardAPI = {
  get: () => API.get('/dashboard/stats'),
};

export default API;
