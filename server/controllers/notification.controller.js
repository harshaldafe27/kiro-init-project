const {
    Announcements,
    Notifications,
    Users,
    Registrations,
    Events
} = require('../models/db');
const {
    successResponse,
    errorResponse
} = require('../utils/apiResponse');
const {
    paginationMeta
} = require('../utils/pagination');

// ─── Task 2.1 ─────────────────────────────────────────────────────────────────

const createAnnouncement = async (req, res, next) => {
    try {
        const {
            title,
            message,
            audienceType,
            eventId
        } = req.body;

        // Validate title
        if (!title || title.trim().length < 1 || title.trim().length > 100) {
            return errorResponse(res, 'Title must be 1–100 characters', 422);
        }

        // Validate message
        if (!message || message.trim().length < 1 || message.trim().length > 1000) {
            return errorResponse(res, 'Message must be 1–1000 characters', 422);
        }

        // Require eventId for event_registrants audience
        if (audienceType === 'event_registrants' && !eventId) {
            return errorResponse(res, 'Event is required for event_registrants audience', 422);
        }

        // Resolve recipients
        let recipientIds = [];
        let eventTitle = null;

        if (audienceType === 'event_registrants') {
            const event = await Events.findById(eventId);
            if (!event) return errorResponse(res, 'Event not found', 404);
            eventTitle = event.title;

            const registrations = await Registrations.findByEvent(eventId);
            recipientIds = registrations.map((r) => r.student);
        } else {
            // all_students
            const snap = await Users.findAll({
                limit: 10000
            });
            recipientIds = snap.filter((u) => u.role === 'student').map((u) => u._id);
        }

        // Batch-create notifications
        const notificationDocs = recipientIds.map((recipientId) => ({
            announcementId: null, // will be set after announcement is created
            recipientId,
            senderId: req.user._id,
            title: title.trim(),
            message: message.trim(),
            audienceType,
            eventId: eventId || null,
        }));

        // Create announcement first
        const announcement = await Announcements.create({
            senderId: req.user._id,
            senderName: req.user.name,
            title: title.trim(),
            message: message.trim(),
            audienceType,
            eventId: eventId || null,
            eventTitle,
            recipientCount: recipientIds.length,
        });

        // Now batch-create notifications with the real announcementId
        const notificationsWithId = notificationDocs.map((n) => ({
            ...n,
            announcementId: announcement._id,
        }));

        if (notificationsWithId.length > 0) {
            await Notifications.createBatch(notificationsWithId);
        }

        return successResponse(res, {
            announcement,
            recipientCount: recipientIds.length
        }, 'Announcement sent successfully', 201);
    } catch (err) {
        next(err);
    }
};

// ─── Task 2.5 ─────────────────────────────────────────────────────────────────

const getMyAnnouncements = async (req, res, next) => {
    try {
        const {
            announcements,
            total
        } = await Announcements.findBySender(req.user._id, {
            limit: 50,
            offset: 0
        });
        return successResponse(res, {
            announcements,
            total
        }, 'Announcements fetched');
    } catch (err) {
        next(err);
    }
};

const getAllAnnouncements = async (req, res, next) => {
    try {
        const {
            announcements,
            total
        } = await Announcements.findAll({
            limit: 200,
            offset: 0
        });
        return successResponse(res, {
            announcements,
            total
        }, 'All announcements fetched');
    } catch (err) {
        next(err);
    }
};

const deleteAnnouncement = async (req, res, next) => {
    try {
        const {
            id
        } = req.params;
        const announcement = await Announcements.findById(id);

        if (!announcement) return errorResponse(res, 'Announcement not found', 404);

        if (announcement.senderId !== req.user._id) {
            return errorResponse(res, 'Forbidden: not the owner', 403);
        }

        await Notifications.deleteByAnnouncement(id);
        await Announcements.delete(id);

        return successResponse(res, null, 'Announcement deleted');
    } catch (err) {
        next(err);
    }
};

// ─── Task 2.8 ─────────────────────────────────────────────────────────────────

const getMyNotifications = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = 20;
        const offset = (page - 1) * limit;

        const {
            notifications,
            total
        } = await Notifications.findByRecipient(req.user._id, {
            limit,
            offset
        });

        return successResponse(res, {
            notifications,
            meta: paginationMeta(total, page, limit),
        }, 'Notifications fetched');
    } catch (err) {
        next(err);
    }
};

const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notifications.countUnread(req.user._id);
        return successResponse(res, {
            count
        }, 'Unread count fetched');
    } catch (err) {
        next(err);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const {
            id
        } = req.params;
        const {
            col
        } = require('../models/db');

        const doc = await col('notifications').doc(id).get();
        if (!doc.exists) return errorResponse(res, 'Notification not found', 404);

        const notification = {
            _id: doc.id,
            ...doc.data()
        };
        if (notification.recipientId !== req.user._id) {
            return errorResponse(res, 'Forbidden', 403);
        }

        const updated = await Notifications.markRead(id);
        return successResponse(res, {
            notification: updated
        }, 'Notification marked as read');
    } catch (err) {
        next(err);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        await Notifications.markAllRead(req.user._id);
        return successResponse(res, null, 'All notifications marked as read');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createAnnouncement,
    getMyAnnouncements,
    getAllAnnouncements,
    deleteAnnouncement,
    getMyNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
};