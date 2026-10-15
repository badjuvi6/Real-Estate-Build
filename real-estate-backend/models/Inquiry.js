// real-estate-app/backend/models/Inquiry.js
//
// Backs the "Inquire About Property" form on PropertyDetailPage (simulated
// client-side since Phase 3, when this model didn't exist yet) and the
// dashboard's Inquiries tab. Deliberately minimal - no read/unread status,
// no agent-reply thread, no notifications. Just "a message was sent about
// a property, and the sender can see their own sent messages later."

const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    // The logged-in sender, if any. Kept optional rather than required so
    // this doesn't force a login just to contact an agent - an anonymous
    // inquiry still has name/email/message to go on. It just won't show up
    // in anyone's dashboard.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Inquiry', inquirySchema);
