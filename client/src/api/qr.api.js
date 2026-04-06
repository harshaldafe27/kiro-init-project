import api from './axiosInstance';

export const generateQRApi = (registrationId) =>
    api.get(`/qr/generate/${registrationId}`);

export const scanQRApi = (qrData) =>
    api.post('/qr/scan', { qrData });

export const getEntryStatsApi = (eventId) =>
    api.get(`/qr/stats/${eventId}`);

export const getEntryLogsApi = () =>
    api.get('/qr/entry-logs');

export const getPlatformEntryStatsApi = () =>
    api.get('/qr/platform-entry-stats');
