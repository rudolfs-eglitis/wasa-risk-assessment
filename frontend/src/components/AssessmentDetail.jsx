import React, { useEffect, useState } from 'react';
import api from '../utils/api'; // Use the global API instance

import { useParams } from 'react-router-dom';

const AssessmentDetail = () => {
    const { id } = useParams();
    const [assessment, setAssessment] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAssessment = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await api.get(`assessments/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAssessment(response.data);
            } catch (err) {
                console.error('Error fetching assessment:', err.response?.data || err.message);
                setError('Failed to load assessment.');
            }
        };

        fetchAssessment();
    }, [id]);

    if (error) return <div>{error}</div>;
    if (!assessment) return <div>Loading...</div>;

    return (
        <div>
            <h2>Assessment Details</h2>
            <p><strong>ID:</strong> {assessment.id}</p>
            <p><strong>Job Site Address:</strong> {assessment.job_site_address}</p>
            <p><strong>Created At:</strong> {new Date(assessment.created_at).toLocaleString()}</p>
            <p>
                <strong>Team Leader:</strong> {assessment.team_leader_name || 'Not specified'}
            </p>
            <p>
                <strong>Created By:</strong> {assessment.created_by_name || 'Unknown'}
            </p>
            <p>
                <strong>Crew:</strong> {(assessment.on_site_arborists || []).join(', ')}
            </p>
            <p>
                <strong>Nearest Hospital:</strong> {assessment.nearest_hospital_name} &nbsp;
                {assessment.nearest_hospital_address && (
                    <a
                        href={`https://www.google.com/maps?q=${encodeURIComponent(assessment.nearest_hospital_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        (View on Map)
                    </a>
                )}
                {assessment.nearest_hospital_phone && (
                    <>
                        &nbsp;<a href={`tel:${assessment.nearest_hospital_phone}`}>Call</a>
                    </>
                )}
            </p>
            <p>
                <strong>Car Key and First Aid Location:</strong> {assessment.car_key_location}
            </p>
            <p>
                <strong>Weather Conditions:</strong> {assessment.weather_conditions.join(', ')}
            </p>
            <p>
                <strong>Methods of Work:</strong> {assessment.methods_of_work.join(', ')}
            </p>
            <p>
                <strong>Location Risks:</strong> {assessment.location_risks.join(', ')}
            </p>
            <p>
                <strong>Tree Risks:</strong> {assessment.tree_risks.join(', ')}
            </p>
            <p>
                <strong>Additional Risks:</strong> {assessment.additional_risks || 'None'}
            </p>
            <p>
                <strong>All members of the crew is aware of the work plan, has appropriate PPE and work can be carried out safely:</strong> {assessment.safety_confirmation ? 'Yes' : 'No'}
            </p>
        </div>
    );
};

export default AssessmentDetail;