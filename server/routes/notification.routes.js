const express = require('express');
const {
    protect
} = require('../middleware/auth.middleware');
const {
    authorize
} = require('../middleware/rbac.middleware');
const {
    createAnnouncement,
    getMyAnnouncements,
    getAllAnnouncements,
    deleteAnnouncement,
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} = require('../controllers/notification.controller');

const router = express.Router();

// Announcement routes (admin)
router.post('/announcements', protect, authorize('admin'), createAnnouncement);
router.get('/announcements/mine', protect, authorize('admin'), getMyAnnouncements);
router.delete('/announcements/:id', protect, authorize('admin'), deleteAnnouncement);

// Announcement routes (principal)
router.get('/announcements/all', protect, authorize('principal'), getAllAnnouncements);

// Notification routes (student)
router.get('/', protect, authorize('student'), getMyNotifications);
router.get('/unread-count', protect, authorize('student'), getUnreadCount);
router.patch('/read-all', protect, authorize('student'), markAllAsRead);
router.patch('/:id/read', protect, authorize('student'), markAsRead);

module.exports = router;