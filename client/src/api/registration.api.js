import api from './axiosInstance';
export const registerForEventApi = (eventId, formData) =>
    api.post('/registrations', {
        eventId,
        ...formData
    });
export const getMyRegistrationsApi = () => api.get('/registrations/mine');
export const cancelRegistrationApi = (id) => api.delete(`/registrations/${id}`);
export const createPaymentOrderApi = (eventId, formData) =>
    api.post('/payments/create-order', {
        eventId,
        ...formData
    });
export const verifyPaymentApi = (data) => api.post('/payments/verify', data);