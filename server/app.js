const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {
    CLIENT_URL
} = require('./config/env');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// CORS
app.use(cors({
    origin: CLIENT_URL,
    credentials: true
}));

// Body parsers
app.use(express.json());
app.use(cookieParser());

// Routes (mounted as they are implemented)
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/events', require('./routes/event.routes'));
app.use('/api/v1/registrations', require('./routes/registration.routes'));
app.use('/api/v1/analytics', require('./routes/analytics.routes'));
app.use('/api/v1/payments', require('./routes/payment.routes'));
app.use('/api/v1/export', require('./routes/export.routes'));

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;