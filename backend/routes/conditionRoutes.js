const express = require('express');
const router = express.Router();
const {
    getAllConditions,
    getGroupedConditions,
    getWeatherConditions,
    getLocationConditions,
    getTreeConditions,
    addCondition,
    editCondition,
    deleteCondition
} = require('../controllers/conditionController');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/all', authenticateToken, getAllConditions);
router.get('/', authenticateToken, getGroupedConditions);
router.get('/weather', authenticateToken, getWeatherConditions);
router.get('/location', authenticateToken, getLocationConditions);
router.get('/tree', authenticateToken, getTreeConditions);

router.post('/add', authenticateToken, requireAdmin, addCondition);
router.put('/:id', authenticateToken, requireAdmin, editCondition);
router.delete('/:id', authenticateToken, requireAdmin, deleteCondition);

module.exports = router;
