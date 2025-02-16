const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        console.log('Access denied: User is not an admin');
        return res.status(403).json({ error: 'Forbidden' });
    }
};

module.exports = requireAdmin;
