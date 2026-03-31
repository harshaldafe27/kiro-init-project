const express = require('express');
const router = express.Router();
const {
    protect
} = require('../middleware/auth.middleware');
const {
    authorize
} = require('../middleware/rbac.middleware');
const {
    exportRegistrantsCSV,
    exportRegistrantsPDF
} = require('../services/export.service');
const Event = require('../models/Event.model');

router.get('/event/:id/csv', protect, authorize('admin'), async (req, res) => {
    try {
        const csv = await exportRegistrantsCSV(req.params.id);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="registrants-${req.params.id}.csv"`);
        res.send(csv);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

router.get('/event/:id/pdf', protect, authorize('admin'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        const buf = await exportRegistrantsPDF(req.params.id, event && event.title);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="registrants-${req.params.id}.pdf"`);
        res.send(buf);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;