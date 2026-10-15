// real-estate-app/backend/routes/inquiries.js

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const Property = require('../models/Property');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');

router.post('/', optionalAuth, async (req, res) => {
    try {
        const { propertyId, name, email, phone, message } = req.body;

        if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ message: 'A valid propertyId is required' });
        }
        if (!name || !email || !message) {
            return res.status(400).json({ message: 'name, email, and message are required' });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        const inquiry = await Inquiry.create({
            property: propertyId,
            user: req.userId, 
            name,
            email,
            phone,
            message
        });

        res.status(201).json(inquiry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/mine', requireAuth, async (req, res) => {
    try {
        const inquiries = await Inquiry.find({ user: req.userId })
            .sort({ createdAt: -1 })
            .populate('property', 'title address imageUrl price currency');
        res.json(inquiries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
