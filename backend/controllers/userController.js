const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('../config/database');

const tokenBlacklist = []; // In-memory token blacklist (you may use Redis for scalability)

exports.createUser = async (req, res) => {
    try {
        const { name, email, role, phone_number } = req.body;

        // Validate required fields
        if (!name || !email || !role || !phone_number) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // Ensure role is one of the allowed ENUM values
        const allowedRoles = ['admin', 'user', 'inactive'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role provided.' });
        }

        // Generate a random password (16 hex characters, for example)
        const generatedPassword = crypto.randomBytes(8).toString('hex');

        // Hash the generated password
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        // Insert the new user into the database
        await db.query(
            `INSERT INTO users (name, email, password, role, phone_number) VALUES (?, ?, ?, ?, ?)`,
            [name.trim(), email.trim(), hashedPassword, role, phone_number.trim()]
        );

        console.log(`User created: ${name}`);
        res.status(201).json({
            message: 'User created successfully!',
            generatedPassword, // Return the plain-text generated password so admin can share it
        });
    } catch (error) {
        console.error('Error creating user:', error.stack);
        res.status(500).json({ error: 'Failed to create user.', details: error.message });
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
        const [users] = await db.query('SELECT id, name, email, phone_number FROM users WHERE role <> ?', ['inactive']);
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

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Optionally, you can protect certain user IDs from being deactivated (e.g., admin accounts).
        // For example, if userId is 1 or 2, you might want to disallow the operation.
        if (userId === '1' || userId === '2') {
            return res.status(403).json({ error: "Cannot deactivate an admin user." });
        }

        // Instead of deleting the user, update their role to 'inactive'
        const [result] = await db.query('UPDATE users SET role = ? WHERE id = ?', ['inactive', userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        res.json({ message: 'User deactivated successfully.' });
    } catch (error) {
        console.error('Error deactivating user:', error.stack);
        res.status(500).json({ error: 'Failed to deactivate user.' });
    }
};

exports.toggleUserActivation = async (req, res) => {
    try {
        const userId = req.params.id;

        // Fetch the user's current role
        const [rows] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const currentRole = rows[0].role;

        // Prevent toggling for admin users
        if (userId === '1' || userId === '2') {
            return res.status(403).json({ error: 'Cannot toggle activation for these users.' });
        }

        // Toggle role: if inactive, set to user; if user, set to inactive.
        const newRole = (currentRole === 'inactive') ? 'user' : 'inactive';

        await db.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);

        res.json({ message: `User role updated to "${newRole}".` });
    } catch (error) {
        console.error('Error toggling user activation:', error.stack);
        res.status(500).json({ error: 'Failed to toggle user activation.' });
    }
};
