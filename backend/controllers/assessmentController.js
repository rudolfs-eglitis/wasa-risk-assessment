const db = require('../config/database');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const moment = require('moment');
const { getConditionsWithMitigationsByNames } = require('./conditionController');
const generateAssessmentPdf = require('../utils/generateAssessmentPdf');


// Helper function to safely parse JSON
const safeParse = (str) => {
    if (typeof str !== 'string') return str;
    const trimmed = str.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
            return JSON.parse(trimmed);
        } catch (err) {
            console.error('JSON parse error for:', trimmed, err.message);
            return [];
        }
    }
    return [];
};



exports.createAssessment = async (req, res) => {
    try {
        const {
            jobSiteLocation, // Expects an object: { address, lat, lng }
            onSiteArborists, // Array of arborist IDs
            weatherConditions, // Array of strings
            methodsOfWork, // Array of strings
            locationRisks, // Array of strings
            treeRisks, // Array of strings
            nearestHospital, // Object: { name, address, phone } (optional)
            carKeyLocation, // String
            additionalRisks, // String, can be empty
            safetyApproval, // Boolean
            teamLeader, // ID of the selected team leader
        } = req.body;

        // Fetch address using Google Maps Geocoding API
        let jobSiteAddress = jobSiteLocation.address; // Default to manual entry
        if (!jobSiteAddress && jobSiteLocation.lat && jobSiteLocation.lng) {
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${jobSiteLocation.lat},${jobSiteLocation.lng}&key=${GOOGLE_API_KEY}`;
            const geocodeResponse = await axios.get(geocodeUrl);

            if (geocodeResponse.data.status === 'OK') {
                jobSiteAddress = geocodeResponse.data.results[0].formatted_address;
            } else {
                console.error('Geocoding failed:', geocodeResponse.data.error_message || geocodeResponse.data.status);
                return res.status(500).json({ error: 'Failed to fetch address from coordinates.' });
            }
        }


        // Insert the new assessment record into the database
        await db.query(
            `
      INSERT INTO assessments (
        job_site_address, job_site_lat, job_site_lng,
        nearest_hospital_name, nearest_hospital_address, nearest_hospital_phone,
        on_site_arborists, weather_conditions, methods_of_work, location_risks, tree_risks,
        car_key_location, additional_risks, safety_confirmation, team_leader, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                jobSiteLocation.address,
                jobSiteLocation.lat,
                jobSiteLocation.lng,
                nearestHospital ? nearestHospital.name : null,
                nearestHospital ? nearestHospital.address : null,
                nearestHospital ? nearestHospital.phone : null,
                JSON.stringify(onSiteArborists),
                JSON.stringify(weatherConditions),
                JSON.stringify(methodsOfWork),
                JSON.stringify(locationRisks),
                JSON.stringify(treeRisks),
                carKeyLocation,
                additionalRisks,
                safetyApproval,
                teamLeader,
                req.user.id, // Assuming req.user is set by your authentication middleware
            ]
        );

        res.status(201).json({ message: 'Risk assessment created successfully!' });
    } catch (error) {
        console.error('Error creating assessment:', error.message);
        res.status(500).json({ error: 'Failed to create risk assessment.' });
    }
};



exports.getAssessmentHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin'; // Adjust this depending on how your roles are stored

        let assessmentsQuery = `
            SELECT
                a.id,
                a.job_site_address AS address,
                a.created_at,
                u.name AS created_by
            FROM assessments a
            LEFT JOIN users u ON a.created_by = u.id
        `;

        const queryParams = [];

        if (!isAdmin) {
            assessmentsQuery += `
                WHERE a.created_by = ? OR JSON_CONTAINS(a.on_site_arborists, CAST(? AS JSON))
            `;
            queryParams.push(userId, JSON.stringify(userId));
        }

        assessmentsQuery += ' ORDER BY a.created_at DESC';

        const [assessments] = await db.query(assessmentsQuery, queryParams);

        const groupedByDate = assessments.reduce((acc, assessment) => {
            const dateKey = moment.utc(assessment.created_at).local().format('YYYY-MM-DD');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push({
                id: assessment.id,
                address: assessment.address,
                created_at: assessment.created_at,
                created_by: assessment.created_by || 'Unknown'
            });
            return acc;
        }, {});

        res.json(groupedByDate);
    } catch (error) {
        console.error('Error fetching assessment history:', error.message);
        res.status(500).json({ error: 'Failed to fetch assessment history.' });
    }
};

const fetchConditionsWithMitigationsForAssessment = async (conditionsList, type) => {
    if (!conditionsList || conditionsList.length === 0) return [];

    const placeholders = conditionsList.map(() => '?').join(',');
    const [rows] = await db.query(
        `
        SELECT c.*, cm.mitigation_id, m.name AS mitigation_name
        FROM conditions c
        LEFT JOIN condition_mitigations cm ON cm.condition_id = c.id
        LEFT JOIN mitigations m ON cm.mitigation_id = m.id
        WHERE c.name IN (${placeholders}) AND c.type = ?
        `,
        [...conditionsList, type]
    );

    // Group by condition ID
    const conditionMap = {};
    for (const row of rows) {
        if (!conditionMap[row.id]) {
            conditionMap[row.id] = {
                id: row.id,
                name: row.name,
                type: row.type,
                mitigations: []
            };
        }
        if (row.mitigation_id) {
            conditionMap[row.id].mitigations.push({
                id: row.mitigation_id,
                name: row.mitigation_name
            });
        }
    }

    return Object.values(conditionMap);
};

// Get today's assessments for the logged-in user
exports.getTodayAssessments = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Fetch today's assessments
        const [assessments] = await db.query(
            `
                SELECT a.*, u1.name AS created_by_name, u2.name AS team_leader_name
                FROM assessments a
                         LEFT JOIN users u1 ON a.created_by = u1.id
                         LEFT JOIN users u2 ON a.team_leader = u2.id
                WHERE (a.created_by = ? OR JSON_CONTAINS(a.on_site_arborists, CAST(? AS JSON)))
                  AND DATE(a.created_at) = CURDATE()
            `,
            [userId, JSON.stringify(userId)]
        );

        // Fetch all users for mapping arborist IDs to names
        const [users] = await db.query('SELECT id, name FROM users');
        const userMap = users.reduce((acc, user) => {
            acc[String(user.id)] = user.name;
            return acc;
        }, {});

        // Map and enrich each assessment
        const enriched = await Promise.all(assessments.map(async (assessment) => {
            // Basic access control
            const isCreator = assessment.created_by === userId;
            const crew = safeParse(assessment.on_site_arborists);
            const isInCrew = crew.includes(userId);

            if (!isAdmin && !isCreator && !isInCrew) {
                return null; // Skip this one
            }

            // Parse and enrich
            const arboristIds = crew;
            assessment.weather_conditions = safeParse(assessment.weather_conditions);
            assessment.methods_of_work = safeParse(assessment.methods_of_work);
            assessment.location_risks = safeParse(assessment.location_risks);
            assessment.tree_risks = safeParse(assessment.tree_risks);

            assessment.on_site_arborists = arboristIds.map(
                (id) => userMap[String(id)] || `Unknown User (ID: ${id})`
            );

            assessment.location_conditions = await fetchConditionsWithMitigationsForAssessment(
                assessment.location_risks,
                'location'
            );
            assessment.tree_conditions = await fetchConditionsWithMitigationsForAssessment(
                assessment.tree_risks,
                'tree'
            );
            assessment.weather_conditions_details = await fetchConditionsWithMitigationsForAssessment(
                assessment.weather_conditions,
                'weather'
            );

            return assessment;
        }));

        // Remove nulls (filtered by access control)
        const filtered = enriched.filter(Boolean);

        res.json(filtered);
    } catch (error) {
        console.error("Error fetching today's assessments:", error.message);
        res.status(500).json({ error: 'Failed to fetch assessments.' });
    }
};


exports.getAssessmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        // Fetch the assessment and related user info
        const query = `
            SELECT a.*, u1.name AS created_by_name, u2.name AS team_leader_name
            FROM assessments a
                     LEFT JOIN users u1 ON a.created_by = u1.id
                     LEFT JOIN users u2 ON a.team_leader = u2.id
            WHERE a.id = ?
        `;
        const [rows] = await db.query(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        const assessment = rows[0];

        // Check access if user is not admin
        if (!isAdmin) {
            const isCreator = assessment.created_by === userId;
            const crew = JSON.parse(assessment.on_site_arborists || '[]');
            const isInCrew = crew.includes(userId);

            if (!isCreator && !isInCrew) {
                return res.status(403).json({ error: 'Access denied: not part of this assessment.' });
            }
        }

        // Parse JSON fields
        const arboristIds = safeParse(assessment.on_site_arborists);
        assessment.weather_conditions = safeParse(assessment.weather_conditions);
        assessment.methods_of_work = safeParse(assessment.methods_of_work);
        assessment.location_risks = safeParse(assessment.location_risks);
        assessment.tree_risks = safeParse(assessment.tree_risks);

        // Map arborist IDs to names
        const [users] = await db.query('SELECT id, name FROM users');
        const userMap = users.reduce((acc, user) => {
            acc[String(user.id)] = user.name;
            return acc;
        }, {});

        assessment.on_site_arborists = arboristIds.map(
            (id) => userMap[String(id)] || `Unknown User (ID: ${id})`
        );

        assessment.location_conditions = await fetchConditionsWithMitigationsForAssessment(
            assessment.location_risks,
            'location'
        );
        assessment.tree_conditions = await fetchConditionsWithMitigationsForAssessment(
            assessment.tree_risks,
            'tree'
        );
        assessment.weather_conditions_details = await fetchConditionsWithMitigationsForAssessment(
            assessment.weather_conditions,
            'weather'
        );


        console.log(JSON.stringify(assessment, null, 2))
        res.json(assessment);
    } catch (error) {
        console.error('Error fetching assessment:', error.message);
        res.status(500).json({ error: 'Failed to fetch assessment.' });
    }
};


exports.deleteTodayAssessment = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch the assessment by ID
        const [rows] = await db.query('SELECT * FROM assessments WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Assessment not found.' });
        }
        const assessment = rows[0];

        // Check that the current user is the creator
        if (parseInt(assessment.created_by) !== parseInt(req.user.id)) {
            return res.status(403).json({ error: 'Not authorized to delete this assessment.' });
        }

        // Check that the assessment was created today
        if (!moment(assessment.created_at).isSame(moment(), 'day')) {
            return res.status(403).json({ error: 'Can only delete assessments for today.' });
        }

        // Delete the assessment
        await db.query('DELETE FROM assessments WHERE id = ?', [id]);
        res.json({ message: 'Assessment deleted successfully.' });
    } catch (error) {
        console.error('Error deleting assessment:', error.stack);
        res.status(500).json({ error: 'Failed to delete assessment.' });
    }
};

exports.getAssessmentPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const tokenUserId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        const [rows] = await db.query(`
            SELECT a.*, u1.name AS created_by_name, u2.name AS team_leader_name
            FROM assessments a
                     LEFT JOIN users u1 ON a.created_by = u1.id
                     LEFT JOIN users u2 ON a.team_leader = u2.id
            WHERE a.id = ?
        `, [id]);

        if (!rows.length) return res.status(404).json({ error: 'Assessment not found' });

        const assessment = rows[0];

        // Safe parse crew
        const crew = safeParse(assessment.on_site_arborists);
        console.log('[PDF DEBUG] Crew:', crew, 'Token User:', tokenUserId);

        // Access control
        if (!isAdmin) {
            const isInCrew = crew.includes(tokenUserId);
            const isCreator = assessment.created_by === tokenUserId;
            if (!isInCrew && !isCreator) {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }

        // Parse JSON fields
        const arboristIds = safeParse(assessment.on_site_arborists);
        assessment.weather_conditions = safeParse(assessment.weather_conditions);
        assessment.methods_of_work = safeParse(assessment.methods_of_work);
        assessment.location_risks = safeParse(assessment.location_risks);
        assessment.tree_risks = safeParse(assessment.tree_risks);

        // 👥 Fetch users and format name + phone
        const [users] = await db.query('SELECT id, name, phone_number FROM users');
        const userMap = users.reduce((acc, user) => {
            acc[String(user.id)] = `${user.name}${user.phone_number ? ` (${user.phone_number})` : ''}`;
            return acc;
        }, {});

        assessment.on_site_arborists = arboristIds.map(
            (id) => userMap[String(id)] || `Unknown User (ID: ${id})`
        );

        // Get full condition data
        assessment.location_conditions = await fetchConditionsWithMitigationsForAssessment(
            assessment.location_risks,
            'location'
        );
        assessment.tree_conditions = await fetchConditionsWithMitigationsForAssessment(
            assessment.tree_risks,
            'tree'
        );
        assessment.weather_conditions_details = await fetchConditionsWithMitigationsForAssessment(
            assessment.weather_conditions,
            'weather'
        );

        console.log('[PDF DEBUG] Final crew display:', assessment.on_site_arborists);

        // Generate and send PDF
        const pdfBuffer = await generateAssessmentPdf(assessment);
        if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
            return res.status(500).json({ error: 'PDF generation failed' });
        }

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=risk-assessment-${id}.pdf`,
        });

        res.send(pdfBuffer);
    } catch (err) {
        console.error('PDF generation failed:', err.message);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
