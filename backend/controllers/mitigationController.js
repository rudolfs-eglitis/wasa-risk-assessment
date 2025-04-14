const db = require('../config/database');

exports.createMitigation = async (req, res) => {
    console.log('createMitigation called with:', req.body);
    try {
        const { name, type, conditionId } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Mitigation name cannot be empty.' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insert the mitigation
            const [insertResult] = await connection.query(
                'INSERT INTO mitigations (name, type) VALUES (?, ?)',
                [name.trim(), type]
            );
            const mitigationId = insertResult.insertId;

            // If conditionId is provided, also link it
            if (conditionId) {
                // Validate that types match
                const [conditionRows] = await connection.query(
                    'SELECT type FROM conditions WHERE id = ?',
                    [conditionId]
                );

                if (conditionRows.length === 0) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Condition does not exist.' });
                }

                if (conditionRows[0].type !== type) {
                    await connection.rollback();
                    return res.status(400).json({ error: 'Mitigation type must match condition type.' });
                }

                // Prevent duplicate entry
                const [existingLink] = await connection.query(
                    'SELECT id FROM condition_mitigations WHERE condition_id = ? AND mitigation_id = ?',
                    [conditionId, mitigationId]
                );

                if (existingLink.length === 0) {
                    await connection.query(
                        'INSERT INTO condition_mitigations (condition_id, mitigation_id) VALUES (?, ?)',
                        [conditionId, mitigationId]
                    );
                }
            }

            await connection.commit();

            const [mitigationRows] = await connection.query('SELECT * FROM mitigations WHERE id = ?', [mitigationId]);
            res.status(201).json(mitigationRows[0]);

        } catch (error) {
            await connection.rollback();
            console.error('Error creating mitigation (transaction rollback):', error);
            res.status(500).json({ error: 'Failed to create mitigation.' });
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error creating mitigation:', error);
        res.status(500).json({ error: 'Failed to create mitigation.' });
    }
};

exports.editMitigation = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Mitigation name cannot be empty.' });
        }

        await db.query('UPDATE mitigations SET name = ?, type = ?, updated_at = NOW() WHERE id = ?', [name.trim(), type, id]);
        res.json({ message: 'Mitigation updated successfully.' });
    } catch (error) {
        console.error('Error updating mitigation:', error);
        res.status(500).json({ error: 'Failed to update mitigation.' });
    }
};

exports.deleteMitigation = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM mitigations WHERE id = ?', [id]);
        res.json({ message: 'Mitigation deleted successfully.' });
    } catch (error) {
        console.error('Error deleting mitigation:', error);
        res.status(500).json({ error: 'Failed to delete mitigation.' });
    }
};


// READ all mitigations
exports.getAllMitigations = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM mitigations ORDER BY name');
        res.json(rows);
    } catch (err) {
        console.error('Error fetching mitigations:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// READ single mitigation by ID
exports.getMitigationById = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM mitigations WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Mitigation not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching mitigation:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// UPDATE mitigation
exports.updateMitigation = async (req, res) => {
    const { name, type } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE mitigations SET name = ?, type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, type, req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Mitigation not found' });

        const [updated] = await db.query('SELECT * FROM mitigations WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (err) {
        console.error('Error updating mitigation:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

