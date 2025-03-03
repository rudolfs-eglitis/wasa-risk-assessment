const db = require('../config/database');

// Get all conditions grouped by type
exports.getAllConditions = async (req, res) => {
    try {
        const [conditions] = await db.query('SELECT * FROM conditions');

        const groupedConditions = conditions.reduce((acc, condition) => {
            if (!acc[condition.type]) acc[condition.type] = [];
            acc[condition.type].push(condition);
            return acc;
        }, {});

        res.json(groupedConditions);
    } catch (error) {
        console.error('Error fetching conditions:', error);
        res.status(500).json({ error: 'Failed to fetch conditions.' });
    }
};

// Admin - Add a new condition
exports.addCondition = async (req, res) => {
    try {
        const { name, type } = req.body;

        // Validation: Check if name is empty
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Condition name cannot be empty.' });
        }

        // Validation: Check if name already exists
        const [existing] = await db.query('SELECT id FROM conditions WHERE name = ? AND type = ?', [name, type]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Condition with this name already exists.' });
        }

        // Insert new condition
        await db.query('INSERT INTO conditions (name, type) VALUES (?, ?)', [name, type]);
        res.json({ message: 'Condition added successfully.' });
    } catch (error) {
        console.error('Error adding condition:', error);
        res.status(500).json({ error: 'Failed to add condition.' });
    }
};

// Admin - Edit a condition
exports.editCondition = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Condition name cannot be empty.' });
        }
        // Validation: Check if name already exists
        const [existing] = await db.query('SELECT id FROM conditions WHERE name = ? AND type = ?', [name, type]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Condition with this name already exists.' });
        }
        await db.query('UPDATE conditions SET name = ?, type = ? WHERE id = ?', [name, type, id]);
        res.json({ message: 'Condition updated successfully.' });
    } catch (error) {
        console.error('Error updating condition:', error);
        res.status(500).json({ error: 'Failed to update condition.' });
    }
};

// Admin - Delete a condition
exports.deleteCondition = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM conditions WHERE id = ?', [id]);
        res.json({ message: 'Condition deleted successfully.' });
    } catch (error) {
        console.error('Error deleting condition:', error);
        res.status(500).json({ error: 'Failed to delete condition.' });
    }
};
