const express = require('express');
const router = express.Router();
const { getAllRisks, addRisk, deleteRisk } = require('../controllers/riskController');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', authenticateToken, getAllRisks);
router.post('/add', authenticateToken, requireAdmin, addRisk);
router.delete('/:id', authenticateToken, requireAdmin, deleteRisk);

module.exports = router;
