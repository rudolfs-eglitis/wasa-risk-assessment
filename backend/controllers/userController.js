const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/database');

const tokenBlacklist = []; // In-memory token blacklist (you may use Redis for scalability)


// Add user
exports.addUser = async (req, res) => {
    const { name, email, phone_number, role } = req.body;

    try {
        // Generate a random password (simple for now)
        const generatedPassword = Math.random().toString(36).slice(-8); // 8-character random password
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Insert the user into the database
        const [result] = await db.query(
            'INSERT INTO users (name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, phone_number, hashedPassword, role]
        );

        // Return the user and generated password
        res.status(201).json({
            message: 'User added successfully!',
            userId: result.insertId,
            generatedPassword,
        });
    } catch (error) {
        console.error('Error adding user:', error.message);
        res.status(500).json({ error: 'Could not add user' });
    }
};


// Fetch all users
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, phone_number, role FROM users');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error.message);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Fetch all user without sensitive data
exports.getArborists = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, phone_number FROM users');
        res.json(users);
    } catch (error) {
        console.error('Error fetching arborists:', error.message);
        res.status(500).json({ error: 'Failed to fetch arborists' });
    }
};

// Reset user password
exports.resetPassword = async (req, res) => {
    const userId = req.params.id;

    // Prevent resetting passwords for users with ID 1 and 2
    if (userId === '1' || userId === '2') {
        return res.status(403).json({ error: 'Cannot reset password for this user.' });
    }

    try {
        const generatedPassword = Math.random().toString(36).slice(-8); // Generate random password
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        // Invalidate the token
        const token = req.headers['authorization']?.split(' ')[1];
        if (token) {
            tokenBlacklist.push(token); // Add the token to the blacklist
        }

        res.json({ message: 'Password reset successfully!', generatedPassword });
    } catch (error) {
        console.error('Error resetting password:', error.message);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    const userId = req.params.id;

    // Prevent deleting users with ID 1 and 2
    if (userId === '1' || userId === '2') {
        return res.status(403).json({ error: 'Cannot delete this user.' });
    }

    try {
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User deleted successfully!' });
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};