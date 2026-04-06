const express = require('express');
const {
    protect
} = require('../middleware/auth.middleware');
const {
    authorize
} = require('../middleware/rbac.middleware');
const {
    submitApprovalRequest,
    getApprovalRequests,
    approveRequest,
    rejectRequest,
    getMyApprovalRequests,
} = require('../controllers/approval.controller');

const router = express.Router();

// Admin routes
router.post('/events/:eventId/request', protect, authorize('admin'), submitApprovalRequest);
router.get('/mine', protect, authorize('admin'), getMyApprovalRequests);

// Principal routes
router.get('/', protect, authorize('principal'), getApprovalRequests);
router.patch('/:id/approve', protect, authorize('principal'), approveRequest);
router.patch('/:id/reject', protect, authorize('principal'), rejectRequest);

module.exports = router;