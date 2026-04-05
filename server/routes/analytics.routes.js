const express = require('express');
const {
    protect
} = require('../middleware/auth.middleware');
const {
    authorize
} = require('../middleware/rbac.middleware');
const {
    getAdminStats,
    getPlatformStats,
    getAdminActivity,
    getEventAnalytics
} = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/admin', protect, authorize('admin'), getAdminStats);
router.get('/platform', protect, authorize('principal'), getPlatformStats);
router.get('/admin-activity', protect, authorize('principal'), getAdminActivity);
router.get('/event/:id', protect, authorize('admin'), getEventAnalytics);

module.exports = router;