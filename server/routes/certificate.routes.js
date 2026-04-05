const express = require('express');
const {
    protect
} = require('../middleware/auth.middleware');
const {
    authorize
} = require('../middleware/rbac.middleware');
const {
    distributeCertificates,
    downloadCertificate
} = require('../controllers/certificate.controller');

const router = express.Router();

router.post('/distribute/:eventId', protect, authorize('admin'), distributeCertificates);
router.get('/download/:registrationId', protect, downloadCertificate);

module.exports = router;