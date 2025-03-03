const db = require('../db');

// Get all risks, grouped by category
exports.getAllRisks = async (req, res) => {
    try {
        const [risks] = await db.query('SELECT * FROM risks');

        // Group risks by category
        const groupedRisks = risks.reduce((acc, risk) => {
            if (!acc[risk.category]) acc[risk.category] = [];
            acc[risk.category].push(risk);
            return acc;
        }, {});

        res.json(groupedRisks);
    } catch (error) {
        console.error('Error fetching risks:', error);
        res.status(500).json({ error: 'Failed to fetch risks.' });
    }
};

// Admin - Add a new risk
exports.addRisk = async (req, res) => {
    try {
        const { category, name, mitigation } = req.body;
        await db.query(
            'INSERT INTO risks (category, name, mitigation) VALUES (?, ?, ?)',
            [category, name, mitigation]
        );
        res.json({ message: 'Risk added successfully.' });
    } catch (error) {
        console.error('Error adding risk:', error);
        res.status(500).json({ error: 'Failed to add risk.' });
    }
};

// Admin - Delete a risk
exports.deleteRisk = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM risks WHERE id = ?', [id]);
        res.json({ message: 'Risk deleted successfully.' });
    } catch (error) {
        console.error('Error deleting risk:', error);
        res.status(500).json({ error: 'Failed to delete risk.' });
    }
};
