const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');
const {
    generateQR,
    scanQR,
    getEntryStats,
    getEntryLogs,
    getPlatformEntryStats,
} = require('../controllers/qr.controller');

const router = express.Router();

// Student: generate QR for their confirmed registration
router.get('/generate/:registrationId', protect, authorize('student'), generateQR);

// Admin: scan a QR code to validate entry
router.post('/scan', protect, authorize('admin'), scanQR);

// Admin: entry stats for a specific event
router.get('/stats/:eventId', protect, authorize('admin'), getEntryStats);

// Principal: live entry logs
router.get('/entry-logs', protect, authorize('principal'), getEntryLogs);

// Principal: platform-wide entry stats
router.get('/platform-entry-stats', protect, authorize('principal'), getPlatformEntryStats);

module.exports = router;
