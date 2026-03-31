const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['not_required', 'pending', 'paid', 'failed'],
        default: 'not_required',
    },
    paymentId: {
        type: String
    },
    orderId: {
        type: String
    },
    amount: {
        type: Number
    },
    registeredAt: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
});

registrationSchema.index({
    student: 1,
    event: 1
}, {
    unique: true
});

module.exports = mongoose.model('Registration', registrationSchema);