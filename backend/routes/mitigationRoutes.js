const express = require('express');
const router = express.Router();
const {
    createMitigation,
    getAllMitigations,
    getMitigationById,
    updateMitigation,
    deleteMitigation,

} = require('../controllers/mitigationController');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');
const mitigationController = require('../controllers/mitigationController');

// All routes are protected and admin-only
router.post('/', authenticateToken, requireAdmin, createMitigation);
router.get('/', authenticateToken, requireAdmin, getAllMitigations);
router.get('/:id', authenticateToken, requireAdmin, getMitigationById);
router.put('/:id', authenticateToken, requireAdmin, updateMitigation);
router.delete('/:id', authenticateToken, requireAdmin, deleteMitigation);

module.exports = router;
