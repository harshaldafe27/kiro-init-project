const {
    Events,
    Registrations,
    Users
} = require('../models/db');
const {
    logAudit
} = require('../utils/auditLogger');
const {
    successResponse,
    errorResponse
} = require('../utils/apiResponse');
const {
    getPagination,
    paginationMeta
} = require('../utils/pagination');

const listEvents = async (req, res) => {
    try {
        const {
            page,
            limit,
            skip
        } = getPagination(req.query);
        const {
            search,
            category
        } = req.query;
        const {
            events,
            total
        } = await Events.findPublished({
            search,
            category,
            limit,
            offset: skip
        });
        return successResponse(res, {
            events,
            meta: paginationMeta(total, page, limit)
        }, 'Events fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getEvent = async (req, res) => {
    try {
        const event = await Events.findById(req.params.id);
        if (!event) return errorResponse(res, 'Event not found', 404);
        return successResponse(res, {
            event
        }, 'Event fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const createEvent = async (req, res) => {
    try {
        const event = await Events.create({
            ...req.body,
            createdBy: req.user._id
        });
        try {
            await logAudit({
                actor: req.user._id,
                action: 'CREATE_EVENT',
                targetType: 'Event',
                targetId: event._id,
                metadata: {
                    title: event.title
                },
                ip: req.ip
            });
        } catch (_) {}
        // Emit real-time
        try {
            const {
                getIO
            } = require('../sockets/index');
            const io = getIO();
            if (io) io.to('student-room').emit('event:new', event);
        } catch (_) {}
        return successResponse(res, {
            event
        }, 'Event created', 201);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const updateEvent = async (req, res) => {
    try {
        const event = await Events.findById(req.params.id);
        if (!event) return errorResponse(res, 'Event not found', 404);
        if (event.createdBy !== req.user._id) return errorResponse(res, 'Forbidden', 403);
        const updated = await Events.update(req.params.id, req.body);
        try {
            await logAudit({
                actor: req.user._id,
                action: 'UPDATE_EVENT',
                targetType: 'Event',
                targetId: event._id,
                metadata: {
                    title: event.title
                },
                ip: req.ip
            });
        } catch (_) {}
        try {
            const {
                getIO
            } = require('../sockets/index');
            const io = getIO();
            if (io) io.to('student-room').emit('event:updated', updated);
        } catch (_) {}
        return successResponse(res, {
            event: updated
        }, 'Event updated');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const deleteEvent = async (req, res) => {
    try {
        const event = await Events.findById(req.params.id);
        if (!event) return errorResponse(res, 'Event not found', 404);
        if (event.createdBy !== req.user._id) return errorResponse(res, 'Forbidden', 403);
        await Registrations.deleteByEvent(req.params.id);
        await Events.delete(req.params.id);
        try {
            await logAudit({
                actor: req.user._id,
                action: 'DELETE_EVENT',
                targetType: 'Event',
                targetId: event._id,
                metadata: {
                    title: event.title
                },
                ip: req.ip
            });
        } catch (_) {}
        try {
            const {
                getIO
            } = require('../sockets/index');
            const io = getIO();
            if (io) io.to('student-room').emit('event:cancelled', {
                eventId: event._id
            });
        } catch (_) {}
        return successResponse(res, null, 'Event deleted');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const togglePublish = async (req, res) => {
    try {
        const event = await Events.findById(req.params.id);
        if (!event) return errorResponse(res, 'Event not found', 404);
        if (event.createdBy !== req.user._id) return errorResponse(res, 'Forbidden', 403);
        const updated = await Events.update(req.params.id, {
            isPublished: !event.isPublished
        });
        return successResponse(res, {
            event: updated
        }, 'Publish toggled');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getRegistrants = async (req, res) => {
    try {
        const event = await Events.findById(req.params.id);
        if (!event) return errorResponse(res, 'Event not found', 404);
        if (event.createdBy !== req.user._id) return errorResponse(res, 'Forbidden', 403);
        const regs = await Registrations.findByEvent(req.params.id);
        // Populate student info
        const populated = await Promise.all(regs.map(async (r) => {
            const student = await Users.findById(r.student);
            return {
                ...r,
                student: student ? {
                    _id: student._id,
                    name: student.name,
                    email: student.email,
                    college: student.college
                } : null
            };
        }));
        return successResponse(res, {
            registrations: populated
        }, 'Registrants fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getAdminEvents = async (req, res) => {
    try {
        const {
            page,
            limit,
            skip
        } = getPagination(req.query);
        const {
            events,
            total
        } = await Events.findByAdmin(req.user._id, {
            limit,
            offset: skip
        });
        return successResponse(res, {
            events,
            meta: paginationMeta(total, page, limit)
        }, 'Admin events fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getAllEvents = async (req, res) => {
    try {
        const {
            page,
            limit,
            skip
        } = getPagination(req.query);
        const {
            events,
            total
        } = await Events.findAll({
            limit,
            offset: skip
        });
        // Populate createdBy
        const populated = await Promise.all(events.map(async (e) => {
            const admin = await Users.findById(e.createdBy);
            return {
                ...e,
                createdBy: admin ? {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email
                } : e.createdBy
            };
        }));
        return successResponse(res, {
            events: populated,
            meta: paginationMeta(total, page, limit)
        }, 'All events fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    listEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    togglePublish,
    getRegistrants,
    getAdminEvents,
    getAllEvents
};