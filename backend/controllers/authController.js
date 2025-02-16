const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../config/database');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

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
