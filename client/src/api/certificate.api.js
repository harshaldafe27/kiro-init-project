import api from './axiosInstance';

export const markCompleteApi = (eventId) => api.patch(`/events/${eventId}/complete`);

export const distributeApi = ({
        eventId,
        templateBase64,
        nameX,
        nameY,
        fontSize
    }) =>
    api.post(`/certificates/distribute/${eventId}`, {
        templateBase64,
        nameX,
        nameY,
        fontSize
    });

export const downloadCertificateApi = (registrationId) =>
    api.get(`/certificates/download/${registrationId}`, {
        responseType: 'blob'
    });