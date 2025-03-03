const express = require('express');
const router = express.Router();
const {
    getAllConditions,
    addCondition,
    editCondition,
    deleteCondition
} = require('../controllers/conditionController');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');

router.get('/', authenticateToken, getAllConditions);
router.post('/add', authenticateToken, requireAdmin, addCondition);
router.put('/:id', authenticateToken, requireAdmin, editCondition);
router.delete('/:id', authenticateToken, requireAdmin, deleteCondition);

module.exports = router;
