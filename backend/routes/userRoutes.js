const express = require('express');
const { createUser } = require('../controllers/userController');
const { getAllUsers, resetPassword, deleteUser } = require('../controllers/userController');
const { getArborists } = require('../controllers/userController');
const authenticateToken = require('../middleware/authenticateToken');
const requireAdmin = require('../middleware/requireAdmin');
const router = express.Router();

router.post('/create', authenticateToken, requireAdmin, createUser);


// List all users
router.get('/', [authenticateToken, requireAdmin], getAllUsers);




// Reset user password
router.post('/:id/reset-password', [authenticateToken, requireAdmin], resetPassword);

// Delete user
router.delete('/:id', [authenticateToken, requireAdmin], deleteUser);


// Fetch arborists, no role restrictions
router.get('/arborists', authenticateToken, getArborists);

module.exports = router;