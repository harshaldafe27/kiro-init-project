const express = require('express');
const {
    body
} = require('express-validator');
const {
    validate
} = require('../middleware/validate.middleware');
const {
    protect
} = require('../middleware/auth.middleware');
const {
    register,
    login,
    logout,
    refresh,
    getMe,
} = require('../controllers/auth.controller');

const router = express.Router();

const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({
        min: 6
    }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);

module.exports = router;