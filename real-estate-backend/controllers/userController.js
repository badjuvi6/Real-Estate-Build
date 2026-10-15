// real-estate-app/backend/controllers/userController.js

const mongoose = require('mongoose');
const User = require('../models/User');
const Property = require('../models/Property');

// POST /api/users/favorites/:propertyId (protected)
// Toggles: adds the property to the user's favorites if it isn't already
// there, removes it if it is. One endpoint for both directions, matching
// a heart/bookmark icon's click-to-toggle behavior on the frontend.
async function toggleFavorite(req, res) {
    try {
        const { propertyId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ message: 'Invalid property ID format' });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: 'Property not found' });
        }

        const user = await User.findById(req.userId);
        const index = user.favorites.findIndex((id) => id.equals(propertyId));

        let isFavorited;
        if (index === -1) {
            user.favorites.push(propertyId);
            isFavorited = true;
        } else {
            user.favorites.splice(index, 1);
            isFavorited = false;
        }

        await user.save();
        res.json({ isFavorited, favorites: user.favorites });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// GET /api/users/favorites (protected)
// Returns full property documents (not just IDs), populated from the
// user's favorites list - what the dashboard's Saved Properties tab
// renders directly without a second round-trip per property.
async function getFavorites(req, res) {
    try {
        const user = await User.findById(req.userId).populate('favorites');
        res.json(user.favorites);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { toggleFavorite, getFavorites };
