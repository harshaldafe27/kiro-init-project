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
    createOrder,
    verifyPayment,
    getPaymentHistory,
    retryOrder
} = require('../controllers/payment.controller');

const router = express.Router();

// POST /api/v1/payments/create-order
router.post(
    '/create-order',
    protect,
    authorize('student'),
    [body('eventId').notEmpty().withMessage('eventId is required')],
    validate,
    createOrder
);

// POST /api/v1/payments/verify
router.post(
    '/verify',
    protect,
    authorize('student'),
    [
        body('orderId').notEmpty().withMessage('orderId is required'),
        body('paymentId').notEmpty().withMessage('paymentId is required'),
        body('signature').notEmpty().withMessage('signature is required'),
        body('registrationId').notEmpty().withMessage('registrationId is required'),
    ],
    validate,
    verifyPayment
);

// GET /api/v1/payments/history
router.get('/history', protect, authorize('student'), getPaymentHistory);

// POST /api/v1/payments/retry-order
router.post(
    '/retry-order',
    protect,
    authorize('student'),
    [body('registrationId').notEmpty().withMessage('registrationId is required')],
    validate,
    retryOrder
);

module.exports = router;