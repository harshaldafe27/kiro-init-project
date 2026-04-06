const {
    Events,
    ApprovalRequests,
    Users,
    Notifications
} = require('../models/db');
const {
    successResponse,
    errorResponse
} = require('../utils/apiResponse');

// Admin: submit approval request for an event
const submitApprovalRequest = async (req, res, next) => {
    try {
        const {
            eventId
        } = req.params;

        const event = await Events.findById(eventId);
        if (!event) return errorResponse(res, 'Event not found', 404);
        if (event.createdBy !== req.user._id) return errorResponse(res, 'Forbidden', 403);

        // Check for existing pending request
        const existing = await ApprovalRequests.findByEvent(eventId);
        if (existing && existing.status === 'pending') {
            return errorResponse(res, 'An approval request is already pending for this event', 409);
        }

        // Get admin's full user record for name
        const admin = await Users.findById(req.user._id);
        const adminName = admin ? admin.name : 'Admin';

        // Find principals to notify
        const allUsers = await Users.findAll({
            limit: 1000
        });
        const principals = allUsers.filter((u) => u.role === 'principal');

        const request = await ApprovalRequests.create({
            eventId,
            eventTitle: event.title,
            adminId: req.user._id,
            adminName,
        });

        // Update event approval status
        await Events.update(eventId, {
            approvalStatus: 'pending',
            isPublished: false
        });

        // Notify all principals
        if (principals.length > 0) {
            await Notifications.createBatch(principals.map((p) => ({
                recipientId: p._id,
                senderId: req.user._id,
                title: 'Event Approval Request',
                message: `${adminName} has requested approval to publish "${event.title}".`,
                eventId,
            })));
        }

        return successResponse(res, {
            request
        }, 'Approval request submitted', 201);
    } catch (err) {
        next(err);
    }
};

// Principal: get all approval requests
const getApprovalRequests = async (req, res, next) => {
    try {
        const {
            status
        } = req.query;
        let result;
        if (status === 'pending') {
            result = await ApprovalRequests.findPending();
        } else {
            result = await ApprovalRequests.findAll();
        }

        // Populate event details
        const populated = await Promise.all(result.requests.map(async (r) => {
            const event = await Events.findById(r.eventId);
            return {
                ...r,
                event: event || null
            };
        }));

        return successResponse(res, {
            requests: populated,
            total: result.total
        }, 'Requests fetched');
    } catch (err) {
        next(err);
    }
};

// Principal: approve a request
const approveRequest = async (req, res, next) => {
    try {
        const {
            id
        } = req.params;

        const request = await ApprovalRequests.findById(id);
        if (!request) return errorResponse(res, 'Request not found', 404);
        if (request.status !== 'pending') return errorResponse(res, 'Request already processed', 400);

        await ApprovalRequests.update(id, {
            status: 'approved',
            reviewedBy: req.user._id,
            reviewedAt: new Date().toISOString()
        });
        await Events.update(request.eventId, {
            approvalStatus: 'approved'
        });

        // Notify admin
        await Notifications.create({
            recipientId: request.adminId,
            senderId: req.user._id,
            title: 'Event Approved',
            message: `Your event "${request.eventTitle}" has been approved. You can now publish it.`,
            eventId: request.eventId,
        });

        return successResponse(res, null, 'Request approved');
    } catch (err) {
        next(err);
    }
};

// Principal: reject a request
const rejectRequest = async (req, res, next) => {
    try {
        const {
            id
        } = req.params;
        const {
            reason
        } = req.body; // optional

        const request = await ApprovalRequests.findById(id);
        if (!request) return errorResponse(res, 'Request not found', 404);
        if (request.status !== 'pending') return errorResponse(res, 'Request already processed', 400);

        await ApprovalRequests.update(id, {
            status: 'rejected',
            rejectionReason: reason || null,
            reviewedBy: req.user._id,
            reviewedAt: new Date().toISOString(),
        });
        await Events.update(request.eventId, {
            approvalStatus: 'rejected',
            rejectionReason: reason || null
        });

        // Notify admin
        const message = reason ?
            `Your event "${request.eventTitle}" was rejected. Reason: ${reason}` :
            `Your event "${request.eventTitle}" was rejected. You can edit and resubmit.`;

        await Notifications.create({
            recipientId: request.adminId,
            senderId: req.user._id,
            title: 'Event Rejected',
            message,
            eventId: request.eventId,
        });

        return successResponse(res, null, 'Request rejected');
    } catch (err) {
        next(err);
    }
};

// Admin: get approval status for their events
const getMyApprovalRequests = async (req, res, next) => {
    try {
        const {
            requests,
            total
        } = await ApprovalRequests.findByAdmin(req.user._id);
        return successResponse(res, {
            requests,
            total
        }, 'My approval requests fetched');
    } catch (err) {
        next(err);
    }
};

module.exports = {
    submitApprovalRequest,
    getApprovalRequests,
    approveRequest,
    rejectRequest,
    getMyApprovalRequests
};