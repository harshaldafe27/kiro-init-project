import api from './axiosInstance';

export const markCompleteApi = (eventId) => api.patch(`/events/${eventId}/complete`);
export const distributeApi = (eventId) => api.post(`/certificates/distribute/${eventId}`);
export const downloadCertificateApi = (registrationId) =>
    api.get(`/certificates/download/${registrationId}`, {
        responseType: 'blob'
    });