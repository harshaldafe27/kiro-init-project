const {
    Events,
    Registrations,
    Users
} = require('../models/db');
const {
    successResponse,
    errorResponse
} = require('../utils/apiResponse');

const register = async (req, res) => {
    try {
        const {
            eventId
        } = req.body;
        const event = await Events.findById(eventId);
        if (!event || !event.isPublished || event.isCancelled) return errorResponse(res, 'Event not available', 404);
        if (new Date(event.date) <= new Date()) return errorResponse(res, 'Registration deadline passed', 400);
        if (event.registeredCount >= event.capacity) return errorResponse(res, 'Event is full', 400);
        const dup = await Registrations.findDuplicate(req.user._id, eventId);
        if (dup && dup.status !== 'cancelled') return errorResponse(res, 'Already registered', 409);

        if (event.fee > 0) {
            const reg = await Registrations.create({
                student: req.user._id,
                event: eventId,
                status: 'pending',
                paymentStatus: 'pending',
                amount: event.fee
            });
            return successResponse(res, {
                registration: reg,
                requiresPayment: true
            }, 'Registration initiated', 201);
        }

        const reg = await Registrations.create({
            student: req.user._id,
            event: eventId,
            status: 'confirmed',
            paymentStatus: 'not_required'
        });
        await Events.incrementCount(eventId, 1);

        // Email (non-blocking)
        try {
            const {
                sendRegistrationConfirmation
            } = require('../services/email.service');
            const user = await Users.findById(req.user._id);
            await sendRegistrationConfirmation(user, event);
        } catch (_) {}

        // Socket
        try {
            const {
                getIO
            } = require('../sockets/index');
            const io = getIO();
            if (io) io.to('admin-' + event.createdBy).emit('registration:update', {
                eventId,
                count: event.registeredCount + 1
            });
        } catch (_) {}

        return successResponse(res, {
            registration: reg
        }, 'Registered successfully', 201);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getMyRegistrations = async (req, res) => {
    try {
        const regs = await Registrations.findByStudent(req.user._id);
        const populated = await Promise.all(regs.map(async (r) => {
            const event = await Events.findById(r.event);
            return {
                ...r,
                event
            };
        }));
        return successResponse(res, {
            registrations: populated
        }, 'Registrations fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const cancelRegistration = async (req, res) => {
    try {
        const reg = await Registrations.findById(req.params.id);
        if (!reg) return errorResponse(res, 'Registration not found', 404);
        if (reg.student !== req.user._id) return errorResponse(res, 'Forbidden', 403);
        const wasConfirmed = reg.status === 'confirmed';
        const updated = await Registrations.update(req.params.id, {
            status: 'cancelled'
        });
        if (wasConfirmed) await Events.incrementCount(reg.event, -1);
        return successResponse(res, {
            registration: updated
        }, 'Registration cancelled');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getEventRegistrations = async (req, res) => {
    try {
        const event = await Events.findById(req.params.eventId);
        if (!event) return errorResponse(res, 'Event not found', 404);
        if (event.createdBy !== req.user._id) return errorResponse(res, 'Forbidden', 403);
        const regs = await Registrations.findByEvent(req.params.eventId);
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
        }, 'Registrations fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    register,
    getMyRegistrations,
    cancelRegistration,
    getEventRegistrations
};