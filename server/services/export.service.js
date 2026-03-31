const {
    Registrations,
    Users
} = require('../models/db');

const exportRegistrantsCSV = async (eventId) => {
    const {
        createObjectCsvStringifier
    } = require('csv-writer');
    const regs = await Registrations.findByEvent(eventId);
    const populated = await Promise.all(regs.map(async (r) => {
        const student = await Users.findById(r.student);
        return {
            ...r,
            student
        };
    }));
    const csv = createObjectCsvStringifier({
        header: [{
                id: 'name',
                title: 'Name'
            }, {
                id: 'email',
                title: 'Email'
            },
            {
                id: 'college',
                title: 'College'
            }, {
                id: 'status',
                title: 'Status'
            },
            {
                id: 'registeredAt',
                title: 'Registered At'
            },
        ],
    });
    const records = populated.map((r) => ({
        name: (r.student && r.student.name) || '',
        email: (r.student && r.student.email) || '',
        college: (r.student && r.student.college) || '',
        status: r.status,
        registeredAt: r.registeredAt || '',
    }));
    return csv.getHeaderString() + csv.stringifyRecords(records);
};

const exportRegistrantsPDF = async (eventId, eventTitle) => {
    const PDFDocument = require('pdfkit');
    const regs = await Registrations.findByEvent(eventId);
    const populated = await Promise.all(regs.map(async (r) => {
        const student = await Users.findById(r.student);
        return {
            ...r,
            student
        };
    }));
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 40
        });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.fontSize(18).font('Helvetica-Bold').text(eventTitle || 'Event Registrants', {
            align: 'center'
        });
        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Bold');
        ['Name', 'Email', 'College', 'Status'].forEach((h, i) => {
            doc.text(h, 40 + i * 130, doc.y, {
                continued: i < 3,
                width: 125
            });
        });
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(560, doc.y).stroke().moveDown(0.3);
        doc.font('Helvetica').fontSize(9);
        for (const r of populated) {
            const y = doc.y;
            const s = r.student || {};
            [s.name || '', s.email || '', s.college || '', r.status]
            .forEach((cell, i) => doc.text(cell, 40 + i * 130, y, {
                width: 125,
                lineBreak: false
            }));
            doc.moveDown(0.6);
        }
        doc.end();
    });
};

module.exports = {
    exportRegistrantsCSV,
    exportRegistrantsPDF
};