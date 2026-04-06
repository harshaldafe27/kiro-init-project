const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { Users, Events, Registrations } = require('../models/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { isAllowedStudentEmail } = require('../utils/allowedStudents');
const { getIO } = require('../sockets/index');

/**
 * Generate a real QR code for a confirmed registration.
 * Called by student after registration is confirmed.
 * GET /api/v1/qr/generate/:registrationId
 */
const generateQR = async (req, res) => {
    try {
        const reg = await Registrations.findById(req.params.registrationId);
        if (!reg) return errorResponse(res, 'Registration not found', 404);
        if (reg.student !== req.user._id) return errorResponse(res, 'Forbidden', 403);
        if (reg.status !== 'confirmed') return errorResponse(res, 'Registration is not confirmed', 400);

        // Generate or reuse qrToken
        let qrToken = reg.qrToken;
        if (!qrToken) {
            qrToken = uuidv4();
            await Registrations.update(reg._id, { qrToken });
        }

        // Encode payload as JSON string in QR
        const payload = JSON.stringify({
            userId: reg.student,
            eventId: reg.event,
            token: qrToken,
        });

        const qrDataUrl = await QRCode.toDataURL(payload, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: 300,
            color: { dark: '#1e1b4b', light: '#ffffff' },
        });

        return successResponse(res, { qrDataUrl, qrToken }, 'QR generated');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Validate a scanned QR code and mark entry.
 * POST /api/v1/qr/scan
 * Body: { qrData: "<JSON string from QR>" }
 * Auth: admin only
 */
const scanQR = async (req, res) => {
    try {
        const { qrData } = req.body;
        if (!qrData) return errorResponse(res, 'QR data is required', 400);

        // Parse QR payload
        let payload;
        try {
            payload = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
        } catch {
            return errorResponse(res, 'Invalid QR format', 422);
        }

        const { userId, eventId, token } = payload;
        if (!userId || !eventId || !token) {
            return errorResponse(res, 'Invalid QR: missing fields', 422);
        }

        // 1. Verify user exists
        const user = await Users.findById(userId);
        if (!user) return errorResponse(res, 'Invalid Pass: user not found', 422);

        // 2. Verify student email domain + allowed dataset
        if (!isAllowedStudentEmail(user.email)) {
            return errorResponse(res, 'Invalid Pass: email not authorized', 422);
        }

        // 3. Verify event exists
        const event = await Events.findById(eventId);
        if (!event) return errorResponse(res, 'Invalid Pass: event not found', 422);

        // 4. Find registration
        const reg = await Registrations.findDuplicate(userId, eventId);
        if (!reg || reg.status !== 'confirmed') {
            return errorResponse(res, 'Invalid Pass: not registered for this event', 422);
        }

        // 5. Verify token matches
        if (reg.qrToken !== token) {
            return errorResponse(res, 'Invalid Pass: token mismatch', 422);
        }

        // 6. Check if already used
        if (reg.qrStatus === 'USED') {
            return successResponse(res, {
                status: 'ALREADY_USED',
                message: 'Already Entered',
                entryTime: reg.entryTime,
                student: { name: user.name, email: user.email },
                event: { title: event.title },
            }, 'Already Entered');
        }

        // 7. Mark as USED
        const entryTime = new Date().toISOString();
        await Registrations.update(reg._id, { qrStatus: 'USED', entryTime });

        // 8. Emit real-time entry log to admin + principal rooms
        try {
            const io = getIO();
            if (io) {
                const entryLog = {
                    name: user.name,
                    email: user.email,
                    eventTitle: event.title,
                    entryTime,
                    registrationId: reg._id,
                };
                io.to('admin-' + event.createdBy).emit('entry:scanned', entryLog);
                io.to('principal-room').emit('entry:scanned', entryLog);
            }
        } catch (_) {}

        return successResponse(res, {
            status: 'VALID',
            message: 'Entry Allowed',
            student: { name: user.name, email: user.email },
            event: { title: event.title },
            entryTime,
        }, 'Entry Allowed');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get entry stats for an event (admin).
 * GET /api/v1/qr/stats/:eventId
 */
const getEntryStats = async (req, res) => {
    try {
        const event = await Events.findById(req.params.eventId);
        if (!event) return errorResponse(res, 'Event not found', 404);
        if (event.createdBy !== req.user._id) return errorResponse(res, 'Forbidden', 403);

        const regs = await Registrations.findByEvent(req.params.eventId);
        const confirmed = regs.filter((r) => r.status === 'confirmed');
        const entered = confirmed.filter((r) => r.qrStatus === 'USED');
        const remaining = confirmed.filter((r) => r.qrStatus !== 'USED');

        return successResponse(res, {
            totalRegistrations: confirmed.length,
            totalEntries: entered.length,
            remainingEntries: remaining.length,
        }, 'Entry stats fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get live entry logs for principal (all events).
 * GET /api/v1/qr/entry-logs
 */
const getEntryLogs = async (req, res) => {
    try {
        // Fetch all registrations that have been scanned
        const { col } = require('../models/db');
        const snap = await col('registrations').where('qrStatus', '==', 'USED').get();
        const regs = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));

        // Sort by entryTime desc
        regs.sort((a, b) => (b.entryTime || '').localeCompare(a.entryTime || ''));

        const populated = await Promise.all(regs.slice(0, 100).map(async (r) => {
            const [user, event] = await Promise.all([
                Users.findById(r.student),
                Events.findById(r.event),
            ]);
            return {
                registrationId: r._id,
                name: user?.name || 'Unknown',
                email: user?.email || 'Unknown',
                eventTitle: event?.title || 'Unknown',
                entryTime: r.entryTime,
            };
        }));

        return successResponse(res, { logs: populated }, 'Entry logs fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get platform-wide entry analytics for principal.
 * GET /api/v1/qr/platform-entry-stats
 */
const getPlatformEntryStats = async (req, res) => {
    try {
        const { col } = require('../models/db');
        const [confirmedSnap, usedSnap] = await Promise.all([
            col('registrations').where('status', '==', 'confirmed').count().get(),
            col('registrations').where('qrStatus', '==', 'USED').count().get(),
        ]);
        const totalRegistrations = confirmedSnap.data().count;
        const totalEntries = usedSnap.data().count;
        return successResponse(res, {
            totalRegistrations,
            totalEntries,
            remainingEntries: totalRegistrations - totalEntries,
        }, 'Platform entry stats fetched');
    } catch (err) {
        return errorResponse(res, err.message, 500);
    }
};

module.exports = { generateQR, scanQR, getEntryStats, getEntryLogs, getPlatformEntryStats };
