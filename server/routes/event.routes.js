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
    listEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    togglePublish,
    getRegistrants,
    getAdminEvents,
    getAllEvents,
} = require('../controllers/event.controller');

const router = express.Router();

const createEventValidation = [
    body('title').notEmpty().withMessage('Title is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('venue').notEmpty().withMessage('Venue is required'),
    body('capacity').isInt({
        min: 1
    }).withMessage('Capacity must be at least 1'),
];

router.get('/', protect, listEvents);
router.get('/all', protect, authorize('principal'), getAllEvents);
router.get('/admin/mine', protect, authorize('admin'), getAdminEvents);
router.get('/:id', protect, getEvent);
router.post('/', protect, authorize('admin'), createEventValidation, validate, createEvent);
router.put('/:id', protect, authorize('admin'), updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);
router.patch('/:id/publish', protect, authorize('admin'), togglePublish);
router.get('/:id/registrants', protect, authorize('admin'), getRegistrants);

module.exports = router;