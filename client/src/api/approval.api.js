import api from './axiosInstance';

export const submitApprovalRequestApi = (eventId) => api.post(`/approvals/events/${eventId}/request`);
export const getApprovalRequestsApi = (params) => api.get('/approvals', {
    params
});
export const approveRequestApi = (id) => api.patch(`/approvals/${id}/approve`);
export const rejectRequestApi = (id, reason) => api.patch(`/approvals/${id}/reject`, {
    reason
});
export const getMyApprovalRequestsApi = () => api.get('/approvals/mine');