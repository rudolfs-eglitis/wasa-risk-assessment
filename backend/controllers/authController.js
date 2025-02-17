const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/database');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        // Log the role for debugging
        console.log('User role from DB:', user.role);

        // Normalize the role before checking (in case there are extra spaces or different casing)
        const normalizedRole = user.role.trim().toLowerCase();
        if (normalizedRole === 'inactive') {
            return res.status(403).json({ error: 'Your account is inactive' });
        }


        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ error: 'Invalid email or password' });

        // Set token to expire in one year (365 days)
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '365d' }
        );

        res.json({ token });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};
