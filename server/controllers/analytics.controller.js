const {
    Events,
    Registrations,
    Users,
    AuditLogs
} = require('../models/db');
const {
    successResponse,
    errorResponse
} = require('../utils/apiResponse');
const {
    getPagination,
    paginationMeta
} = require('../utils/pagination');

const getAdminStats = async (req, res) => {
    try {
        const {
            events
        } = await Events.findByAdmin(req.user._id, {
            limit: 1000
        });
        const eventIds = events.map((e) => e._id);
        const regs = await Registrations.findByEventIds(eventIds);
        const totalRevenue = regs.filter((r) => r.paymentStatus === 'paid').reduce((s, r) => s + (r.amount || 0), 0);
        const eventsData = events.map((event) => {
            const eRegs = regs.filter((r) => r.event === event._id);
            const revenue = eRegs.filter((r) => r.paymentStatus === 'paid').reduce((s, r) => s + (r.amount || 0), 0);
            return {
                eventId: event._id,
                title: event.title,
                registrationCount: eRegs.length,
                revenue
            };
        });
        return successResponse(res, {
            totalEvents: events.length,
            totalRegistrations: regs.length,
            totalRevenue,
            eventsData
        }, 'Admin stats fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getPlatformStats = async (req, res) => {
    try {
        const [totalEvents, totalRegistrations, activeAdmins] = await Promise.all([
            Events.countAll(),
            Registrations.countAll(),
            Users.countWhere('role', '==', 'admin'),
        ]);
        const {
            events
        } = await Events.findAll({
            limit: 1000
        });
        const categoryBreakdown = events.reduce((acc, e) => {
            const cat = e.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});
        const eventIds = events.map((e) => e._id);
        const paidRegs = await Registrations.findPaidByEventIds(eventIds);
        const totalRevenue = paidRegs.reduce((s, r) => s + (r.amount || 0), 0);
        return successResponse(res, {
            totalEvents,
            totalRegistrations,
            totalRevenue,
            activeAdmins,
            categoryBreakdown
        }, 'Platform stats fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

const getAdminActivity = async (req, res) => {
    try {
        const {
            page,
            limit,
            skip
        } = getPagination(req.query);
        const {
            logs,
            total
        } = await AuditLogs.findAll({
            limit,
            offset: skip
        });
        const populated = await Promise.all(logs.map(async (log) => {
            const actor = await Users.findById(log.actor);
            return {
                ...log,
                actor: actor ? {
                    _id: actor._id,
                    name: actor.name,
                    email: actor.email
                } : null
            };
        }));
        return successResponse(res, {
            logs: populated,
            meta: paginationMeta(total, page, limit)
        }, 'Activity fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    getAdminStats,
    getPlatformStats,
    getAdminActivity
};