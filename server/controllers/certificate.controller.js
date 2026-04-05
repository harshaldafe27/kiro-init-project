const {
    Events,
    Registrations,
    Users,
    Notifications
} = require('../models/db');
const {
    generateCertificate
} = require('../utils/generateCertificate');
const {
    successResponse,
    errorResponse
} = require('../utils/apiResponse');

const distributeCertificates = async (req, res, next) => {
    try {
        const {
            eventId
        } = req.params;
        const {
            templateBase64,
            nameX,
            nameY,
            fontSize
        } = req.body;

        const event = await Events.findById(eventId);
        if (!event) return errorResponse(res, 'Event not found', 404);

        if (!event.isCompleted) {
            return errorResponse(res, 'Event must be marked as completed before distributing certificates', 400);
        }

        if (event.certificatesDistributed === true) {
            return errorResponse(res, 'Certificates have already been distributed for this event', 409);
        }

        const confirmed = await Registrations.findConfirmedByEvent(eventId);
        if (!confirmed.length) {
            return successResponse(res, {
                distributed: 0
            }, 'No eligible registrants found');
        }

        // Save template config on the event so download can reuse it
        await Events.update(eventId, {
            certificateTemplate: templateBase64 || null,
            certificateNameX: nameX != null ? Number(nameX) : null,
            certificateNameY: nameY != null ? Number(nameY) : null,
            certificateFontSize: fontSize ? Number(fontSize) : null,
        });

        const ids = confirmed.map((r) => r._id);
        await Registrations.setCertificateAvailable(ids);

        const notifications = confirmed.map((r) => ({
            recipientId: r.student,
            title: 'Certificate Available',
            message: `Your participation certificate for ${event.title} is now available. Visit My Registrations to download it.`,
            eventId,
        }));
        await Notifications.createBatch(notifications);

        await Events.setCertificatesDistributed(eventId);

        return successResponse(res, {
            distributed: confirmed.length
        }, 'Certificates distributed');
    } catch (err) {
        next(err);
    }
};

const downloadCertificate = async (req, res, next) => {
    try {
        const {
            registrationId
        } = req.params;

        const registration = await Registrations.findById(registrationId);
        if (!registration) return errorResponse(res, 'Registration not found', 404);

        if (registration.student !== req.user._id) {
            return errorResponse(res, 'Forbidden', 403);
        }

        if (!registration.certificateAvailable) {
            return errorResponse(res, 'Certificate is not available for this registration', 403);
        }

        const [event, user] = await Promise.all([
            Events.findById(registration.event),
            Users.findById(req.user._id),
        ]);

        const participantName = (registration.participantDetails && registration.participantDetails.name) || user.name;

        const pdfBytes = await generateCertificate({
            participantName,
            eventName: event.title,
            eventDate: event.date,
            templateBase64: event.certificateTemplate || null,
            nameX: event.certificateNameX,
            nameY: event.certificateNameY,
            fontSize: event.certificateFontSize,
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="certificate.pdf"');
        res.end(Buffer.from(pdfBytes));
    } catch (err) {
        next(err);
    }
};

module.exports = {
    distributeCertificates,
    downloadCertificate
};