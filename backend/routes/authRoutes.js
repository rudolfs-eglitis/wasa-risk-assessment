const express = require('express');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authenticateToken');

const { login } = require('../controllers/authController');
const router = express.Router();

const tokenBlacklist = []; // Example: A simple in-memory blacklist


router.post('/login', login);

router.post('/logout', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (token) {
        tokenBlacklist.push(token); // Add token to blacklist
        res.status(200).json({ message: 'Logged out successfully' });
    } else {
        res.status(400).json({ error: 'No token provided' });
    }
});

router.get('/validate', authenticateToken, (req, res) => {
    res.json({ valid: true });
});


module.exports = router;
