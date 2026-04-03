const {
    Events,
    Registrations,
    Users
} = require('../models/db');
const paymentService = require('../services/payment.service');
const {
    successResponse,
    errorResponse
} = require('../utils/apiResponse');
const {
    RAZORPAY_KEY_ID
} = require('../config/env');
const {
    generateSpecialId
} = require('../utils/generateSpecialId');

const createOrder = async (req, res) => {
    try {
        const {
            eventId,
            participantDetails,
            teamName,
            teamMembers
        } = req.body;
        const event = await Events.findById(eventId);
        if (!event || event.isCancelled) return errorResponse(res, 'Event not available', 404);
        if (event.fee <= 0) return errorResponse(res, 'This event is free', 400);
        if (event.registeredCount >= event.capacity) return errorResponse(res, 'Event is full', 400);

        const existing = await Registrations.findDuplicate(req.user._id, eventId);
        if (existing && existing.status !== 'cancelled') return errorResponse(res, 'Already registered', 409);

        let registration = existing && existing.status === 'cancelled' ? null : existing;
        if (!registration) {
            if (existing && existing.status === 'cancelled') {
                // Reuse the cancelled doc
                registration = await Registrations.update(existing._id, {
                    status: 'pending',
                    paymentStatus: 'pending',
                    amount: event.fee,
                    participantDetails: participantDetails || {},
                    teamName: teamName || '',
                    teamMembers: teamMembers || [],
                    specialId: null,
                    paymentId: null,
                    orderId: null,
                });
            } else {
                registration = await Registrations.create({
                    student: req.user._id,
                    event: eventId,
                    status: 'pending',
                    paymentStatus: 'pending',
                    amount: event.fee,
                    participantDetails: participantDetails || {},
                    teamName: teamName || '',
                    teamMembers: teamMembers || [],
                });
            }
        }

        const receipt = ('rcpt_' + registration._id).slice(0, 40);
        const order = await paymentService.createOrder({
            amount: Math.round(event.fee * 100),
            currency: 'INR',
            receipt,
            notes: {
                eventId,
                studentId: req.user._id,
                registrationId: registration._id
            }
        });
        await Registrations.update(registration._id, {
            orderId: order.id
        });

        return successResponse(res, {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: RAZORPAY_KEY_ID,
            registrationId: registration._id,
            eventTitle: event.title
        }, 'Order created', 201);
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const verifyPayment = async (req, res) => {
    try {
        const {
            orderId,
            paymentId,
            signature,
            registrationId
        } = req.body;
        if (!orderId || !paymentId || !signature || !registrationId) return errorResponse(res, 'Missing fields', 400);

        const isValid = paymentService.verifySignature({
            orderId,
            paymentId,
            signature
        });
        if (!isValid) {
            await Registrations.update(registrationId, {
                paymentStatus: 'failed'
            });
            return errorResponse(res, 'Invalid payment signature', 422);
        }

        const reg = await Registrations.findById(registrationId);
        if (!reg) return errorResponse(res, 'Registration not found', 404);
        if (reg.student !== req.user._id) return errorResponse(res, 'Forbidden', 403);

        // Fetch event BEFORE using it in generateSpecialId
        const event = await Events.findById(reg.event);

        const specialId = generateSpecialId(event ? event.title : '');
        const updated = await Registrations.update(registrationId, {
            paymentStatus: 'paid',
            status: 'confirmed',
            paymentId,
            orderId,
            specialId,
        });
        await Events.incrementCount(reg.event, 1);

        try {
            const {
                sendRegistrationConfirmation
            } = require('../services/email.service');
            const user = await Users.findById(req.user._id);
            await sendRegistrationConfirmation(user, event);
        } catch (_) {}
        try {
            const {
                getIO
            } = require('../sockets/index');
            const io = getIO();
            if (io && event) io.to('admin-' + event.createdBy).emit('registration:update', {
                eventId: event._id,
                count: event.registeredCount
            });
        } catch (_) {}

        return successResponse(res, {
            registration: {
                ...updated,
                specialId
            },
            event
        }, 'Payment verified');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getPaymentHistory = async (req, res) => {
    try {
        const regs = await Registrations.findByStudent(req.user._id);
        const paid = regs.filter((r) => ['paid', 'pending', 'failed'].includes(r.paymentStatus));
        const populated = await Promise.all(paid.map(async (r) => {
            const event = await Events.findById(r.event);
            return {
                ...r,
                event
            };
        }));
        return successResponse(res, {
            registrations: populated
        }, 'Payment history fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    createOrder,
    verifyPayment,
    getPaymentHistory
};