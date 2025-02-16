const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
const router = express.Router();

router.get('/reverse', async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    try {
        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
        );
        const address = response.data.results[0]?.formatted_address || 'Unknown location';
        res.json({ address });
    } catch (error) {
        console.error('Error fetching address:', error.message);
        res.status(500).json({ error: 'Failed to fetch address.' });
    }
});

module.exports = router;
