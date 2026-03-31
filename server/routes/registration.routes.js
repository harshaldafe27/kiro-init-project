const express = require('express');
const {
    protect
} = require('../middleware/auth.middleware');
const {
    authorize
} = require('../middleware/rbac.middleware');
const {
    register,
    getMyRegistrations,
    cancelRegistration,
    getEventRegistrations
} = require('../controllers/registration.controller');

const router = express.Router();

router.post('/', protect, authorize('student'), register);
router.get('/mine', protect, authorize('student'), getMyRegistrations);
router.delete('/:id', protect, authorize('student'), cancelRegistration);
router.get('/event/:eventId', protect, authorize('admin'), getEventRegistrations);

module.exports = router;