import api from './axiosInstance';
export const registerForEventApi = (eventId) => api.post('/registrations', {
    eventId
});
export const getMyRegistrationsApi = () => api.get('/registrations/mine');
export const cancelRegistrationApi = (id) => api.delete(`/registrations/${id}`);
export const createPaymentOrderApi = (eventId) => api.post('/payments/create-order', {
    eventId
});
export const verifyPaymentApi = (data) => api.post('/payments/verify', data);