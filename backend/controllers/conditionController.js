const db = require('../config/database');

// Get all conditions (ungrouped)
exports.getAllConditions = async (req, res) => {
    try {
        const [conditions] = await db.query('SELECT * FROM conditions');
        res.json(conditions);
    } catch (error) {
        console.error('Error fetching all conditions:', error);
        res.status(500).json({ error: 'Failed to fetch all conditions.' });
    }
};

// Get all conditions grouped by type
exports.getGroupedConditions = async (req, res) => {
    try {
        const [conditions] = await db.query('SELECT * FROM conditions');

        const groupedConditions = conditions.reduce((acc, condition) => {
            if (!acc[condition.type]) acc[condition.type] = [];
            acc[condition.type].push(condition);
            return acc;
        }, {});

        res.json(groupedConditions);
    } catch (error) {
        console.error('Error fetching grouped conditions:', error);
        res.status(500).json({ error: 'Failed to fetch grouped conditions.' });
    }
};

// Get only weather conditions
exports.getWeatherConditions = async (req, res) => {
    try {
        const [weatherConditions] = await db.query('SELECT * FROM conditions WHERE type = "weather"');
        res.json(weatherConditions);
    } catch (error) {
        console.error('Error fetching weather conditions:', error);
        res.status(500).json({ error: 'Failed to fetch weather conditions.' });
    }
};

// Get only location conditions
exports.getLocationConditions = async (req, res) => {
    try {
        const [locationConditions] = await db.query('SELECT * FROM conditions WHERE type = "location"');
        res.json(locationConditions);
    } catch (error) {
        console.error('Error fetching location conditions:', error);
        res.status(500).json({ error: 'Failed to fetch location conditions.' });
    }
};

// Get only tree conditions
exports.getTreeConditions = async (req, res) => {
    try {
        const [treeConditions] = await db.query('SELECT * FROM conditions WHERE type = "tree"');
        res.json(treeConditions);
    } catch (error) {
        console.error('Error fetching tree conditions:', error);
        res.status(500).json({ error: 'Failed to fetch tree conditions.' });
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

exports.getConditionsWithMitigations = async (req, res) => {
    try {
        const [conditions] = await db.query('SELECT * FROM conditions ORDER BY type, name');

        const [links] = await db.query(`
            SELECT cm.condition_id, m.id AS mitigation_id, m.name, m.type
            FROM condition_mitigations cm
                     LEFT JOIN mitigations m ON cm.mitigation_id = m.id
        `); // <-- Use LEFT JOIN to avoid failure if mitigations are missing

        const conditionMap = {};
        conditions.forEach(cond => {
            conditionMap[cond.id] = { ...cond, mitigations: [] };
        });

        links.forEach(link => {
            if (link.mitigation_id && conditionMap[link.condition_id]) {
                conditionMap[link.condition_id].mitigations.push({
                    id: link.mitigation_id,
                    name: link.name,
                    type: link.type,
                });
            }
        });

        res.json(Object.values(conditionMap));
    } catch (err) {
        console.error('Error fetching conditions with mitigations:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all conditions with mitigations that match a list of names and type
exports.getConditionsWithMitigationsByNames = async (names, type) => {
    const [conditions] = await db.query(
        'SELECT * FROM conditions WHERE name IN (?) AND type = ?',
        [names, type]
    );

    if (conditions.length === 0) return [];

    const conditionIds = conditions.map(c => c.id);
    const [links] = await db.query(`
        SELECT cm.condition_id, m.id AS mitigation_id, m.name, m.type
        FROM condition_mitigations cm
        JOIN mitigations m ON cm.mitigation_id = m.id
        WHERE cm.condition_id IN (?)
    `, [conditionIds]);

    const map = {};
    conditions.forEach(cond => {
        map[cond.id] = { ...cond, mitigations: [] };
    });

    links.forEach(link => {
        if (map[link.condition_id]) {
            map[link.condition_id].mitigations.push({
                id: link.mitigation_id,
                name: link.name,
                type: link.type,
            });
        }
    });

    return Object.values(map);
};