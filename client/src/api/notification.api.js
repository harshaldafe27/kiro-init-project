import api from './axiosInstance';

export const createAnnouncementApi = (data) => api.post('/notifications/announcements', data);
export const getMyAnnouncementsApi = () => api.get('/notifications/announcements/mine');
export const getAllAnnouncementsApi = () => api.get('/notifications/announcements/all');
export const deleteAnnouncementApi = (id) => api.delete(`/notifications/announcements/${id}`);
export const getMyNotificationsApi = (params) => api.get('/notifications', {
    params
});
export const getUnreadCountApi = () => api.get('/notifications/unread-count');
export const markAsReadApi = (id) => api.patch(`/notifications/${id}/read`);
export const markAllAsReadApi = () => api.patch('/notifications/read-all');