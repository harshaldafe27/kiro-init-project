import api from './axiosInstance';
export const getEventsApi = (params) => api.get('/events', {
    params
});
export const getEventApi = (id) => api.get(`/events/${id}`);
export const getAdminEventsApi = (params) => api.get('/events/admin/mine', {
    params
});
export const getAllEventsApi = (params) => api.get('/events/all', {
    params
});
export const createEventApi = (data) => api.post('/events', data);
export const updateEventApi = (id, data) => api.put(`/events/${id}`, data);
export const deleteEventApi = (id) => api.delete(`/events/${id}`);
export const togglePublishApi = (id) => api.patch(`/events/${id}/publish`);
export const getRegistrantsApi = (id) => api.get(`/events/${id}/registrants`);