const express = require('express');
const { createAssessment } = require('../controllers/assessmentController');
const { getTodayAssessments } = require('../controllers/assessmentController');
const { getAssessmentById } = require('../controllers/assessmentController');
const { getAssessmentHistory } = require('../controllers/assessmentController');


const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Endpoint to create a new assessment
router.post('/create', authenticateToken, createAssessment);

// Fetch today's assessments for the current user
router.get('/today', authenticateToken, getTodayAssessments);

// Route for history
router.get('/history', authenticateToken, requireAdmin, getAssessmentHistory);

router.get('/:id', authenticateToken, getAssessmentById);

module.exports = router;
