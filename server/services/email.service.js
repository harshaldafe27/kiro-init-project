const nodemailer = require('nodemailer');
const {
    EMAIL_USER,
    EMAIL_PASS
} = require('../config/env');

const createTransporter = () =>
    nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: EMAIL_USER,
            pass: EMAIL_PASS
        },
    });

const sendRegistrationConfirmation = async (user, event) => {
    try {
        await createTransporter().sendMail({
            from: `"EventFlex" <${EMAIL_USER}>`,
            to: user.email,
            subject: `Registration Confirmed: ${event.title}`,
            html: `<h2>You're registered!</h2><p>Hi ${user.name || 'there'},</p>
             <p>Your registration for <strong>${event.title}</strong> is confirmed.</p>
             <ul><li><strong>Date:</strong> ${new Date(event.date).toLocaleString()}</li>
             <li><strong>Venue:</strong> ${event.venue}</li></ul>`,
        });
    } catch (err) {
        console.error('[email] sendRegistrationConfirmation:', err.message);
    }
};

const sendCancellationNotice = async (user, event) => {
    try {
        await createTransporter().sendMail({
            from: `"EventFlex" <${EMAIL_USER}>`,
            to: user.email,
            subject: `Registration Cancelled: ${event.title}`,
            html: `<h2>Registration Cancelled</h2><p>Hi ${user.name || 'there'},</p>
             <p>Your registration for <strong>${event.title}</strong> has been cancelled.</p>`,
        });
    } catch (err) {
        console.error('[email] sendCancellationNotice:', err.message);
    }
};

const sendEventUpdateNotice = async (users, event) => {
    const transporter = createTransporter();
    for (const user of users) {
        try {
            await transporter.sendMail({
                from: `"EventFlex" <${EMAIL_USER}>`,
                to: user.email,
                subject: `Event Updated: ${event.title}`,
                html: `<h2>Event Updated</h2><p>Hi ${user.name || 'there'},</p>
               <p><strong>${event.title}</strong> has been updated. Check EventFlex for details.</p>`,
            });
        } catch (err) {
            console.error(`[email] sendEventUpdateNotice for ${user.email}:`, err.message);
        }
    }
};

module.exports = {
    sendRegistrationConfirmation,
    sendCancellationNotice,
    sendEventUpdateNotice
};