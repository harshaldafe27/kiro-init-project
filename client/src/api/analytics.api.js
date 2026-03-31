import api from './axiosInstance';
export const getAdminStatsApi = () => api.get('/analytics/admin');
export const getPlatformStatsApi = () => api.get('/analytics/platform');
export const getAdminActivityApi = (params) => api.get('/analytics/admin-activity', {
    params
});