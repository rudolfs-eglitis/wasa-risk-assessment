const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const assessmentRoutes = require('./routes/assessmentRoutes');
const authenticateToken = require('./middleware/authenticateToken');
const geocodeRoutes = require('./routes/geocodeRoutes');
const axios = require('axios');

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());

// Serve static files from React (frontend build directory)
app.use(express.static(path.join(__dirname, 'frontend', 'dist')));

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/assessments', assessmentRoutes);

app.use('/api/geocode', geocodeRoutes);
app.use('/protected', authenticateToken, (req, res) => {
    res.send('This is a protected route');
});

// Catch-all route to serve React's index.html for non-API routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
