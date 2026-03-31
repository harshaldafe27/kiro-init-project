const express = require('express');
const {
    body
} = require('express-validator');
const {
    protect
} = require('../middleware/auth.middleware');
const {
    authorize
} = require('../middleware/rbac.middleware');
const {
    validate
} = require('../middleware/validate.middleware');
const {
    getProfile,
    updateProfile,
    listUsers,
    toggleUserStatus
} = require('../controllers/user.controller');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
], validate, updateProfile);
router.get('/', protect, authorize('principal'), listUsers);
router.patch('/:id/status', protect, authorize('principal'), toggleUserStatus);

module.exports = router;