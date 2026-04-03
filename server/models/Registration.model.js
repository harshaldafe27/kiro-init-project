const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    btId: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
}, {
    _id: false
});

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
    // Unique ticket ID generated on confirmation
    specialId: {
        type: String,
        unique: true,
        sparse: true
    },
    // Participant details collected at registration
    participantDetails: {
        name: {
            type: String
        },
        btId: {
            type: String
        },
        branch: {
            type: String
        },
        year: {
            type: String
        },
    },
    // Team fields (optional — only for team events)
    teamName: {
        type: String
    },
    teamMembers: {
        type: [teamMemberSchema],
        default: []
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