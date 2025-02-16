const db = require('../config/database');
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const moment = require('moment');

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

// Get today's assessments for the logged-in user
exports.getTodayAssessments = async (req, res) => {
    try {
        const userId = req.user.id;

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

        // Fetch user data for mapping arborist IDs to names
        const [users] = await db.query('SELECT id, name FROM users');
        const userMap = users.reduce((acc, user) => {
            acc[String(user.id)] = user.name;
            return acc;
        }, {});

        const mappedAssessments = assessments.map((assessment) => ({
            ...assessment,
            on_site_arborists: safeParse(assessment.on_site_arborists).map(
                (id) => userMap[String(id)] || `Unknown User (ID: ${id})`
            ),
            weather_conditions: safeParse(assessment.weather_conditions),
            methods_of_work: safeParse(assessment.methods_of_work),
            location_risks: safeParse(assessment.location_risks),
            tree_risks: safeParse(assessment.tree_risks),
        }));

        res.json(mappedAssessments);
    } catch (error) {
        console.error("Error fetching today's assessments:", error.message);
        res.status(500).json({ error: 'Failed to fetch assessments.' });
    }
};

// Get assessment history grouped by date (address, created_at, id)
exports.getAssessmentHistory = async (req, res) => {
    try {
        // Fetch only required fields from the database.
        const [assessments] = await db.query(`
      SELECT id, job_site_address AS address, created_at
      FROM assessments
      ORDER BY created_at DESC
    `);

        // Group assessments by date (YYYY-MM-DD) using local time
        const groupedByDate = assessments.reduce((acc, assessment) => {
            const dateKey = moment.utc(assessment.created_at).local().format('YYYY-MM-DD');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push({
                id: assessment.id,
                address: assessment.address, // job_site_address is stored as plain string
                created_at: assessment.created_at,
            });
            return acc;
        }, {});

        res.json(groupedByDate);
    } catch (error) {
        console.error('Error fetching assessment history:', error.message);
        res.status(500).json({ error: 'Failed to fetch assessment history.' });
    }
};

// Get a single assessment by ID, including creator and team leader names
exports.getAssessmentById = async (req, res) => {
    try {
        const { id } = req.params;

        // Join the assessments table with the users table for creator and team leader names
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

        // Parse JSON fields
        const arboristIds = safeParse(assessment.on_site_arborists);
        assessment.weather_conditions = safeParse(assessment.weather_conditions);
        assessment.methods_of_work = safeParse(assessment.methods_of_work);
        assessment.location_risks = safeParse(assessment.location_risks);
        assessment.tree_risks = safeParse(assessment.tree_risks);

        // Fetch user data for mapping arborist IDs to names
        const [users] = await db.query('SELECT id, name FROM users');
        const userMap = users.reduce((acc, user) => {
            acc[String(user.id)] = user.name;
            return acc;
        }, {});

        // Map on_site_arborists IDs to names
        assessment.on_site_arborists = arboristIds.map(
            (id) => userMap[String(id)] || `Unknown User (ID: ${id})`
        );

        // Optionally, if you have team leader and created_by names stored via JOIN in your query,
        // they would already be available. Otherwise, you can handle them similarly.

        res.json(assessment);
    } catch (error) {
        console.error('Error fetching assessment:', error.message);
        res.status(500).json({ error: 'Failed to fetch assessment.' });
    }
};