// real-estate-app/backend/routes/users.js

const express = require('express');
const router = express.Router();
const { toggleFavorite, getFavorites } = require('../controllers/userController');
const { requireAuth } = require('../middleware/authMiddleware');


router.use(requireAuth);

router.get('/favorites', getFavorites);
router.post('/favorites/:propertyId', toggleFavorite);

module.exports = router;
