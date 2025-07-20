const express = require('express');
const {
    getTodayAssessments,
    getAssessmentHistory,
    getAssessmentById,
    createAssessment,
    deleteTodayAssessment,
    getAssessmentPdf
} = require('../controllers/assessmentController');


const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// Endpoint to create a new assessment
router.post('/create', authenticateToken, createAssessment);

// Fetch today's assessments for the current user
router.get('/today', authenticateToken, getTodayAssessments);

// Route for history
router.get('/history', authenticateToken, requireAdmin, getAssessmentHistory);

router.get('show/:id', authenticateToken, getAssessmentById);

router.get('/pdf/:id', authenticateToken, getAssessmentPdf);


router.get('/:id', authenticateToken, getAssessmentById);


router.delete('/:id', authenticateToken, deleteTodayAssessment);

module.exports = router;
