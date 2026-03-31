const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    venue: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true,
        min: 1
    },
    registeredCount: {
        type: Number,
        default: 0
    },
    fee: {
        type: Number,
        default: 0,
        min: 0
    },
    tags: [{
        type: String
    }],
    category: {
        type: String
    },
    banner: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isCancelled: {
        type: Boolean,
        default: false
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);