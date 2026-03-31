import api from './axiosInstance';
export const loginApi = (data) => api.post('/auth/login', data);
export const registerApi = (data) => api.post('/auth/register', data);
export const logoutApi = () => api.post('/auth/logout');
export const refreshApi = () => api.post('/auth/refresh');
export const getMeApi = () => api.get('/auth/me');
export const updateProfileApi = (data) => api.put('/users/profile', data);
export const getProfileApi = () => api.get('/users/profile');