import React, { useEffect, useState } from 'react';
import api from '../utils/api'; // Use the global API instance
import moment from 'moment';
import Layout from './Layout';
import {Link} from "react-router-dom";


const TodayAssessments = () => {
    const [assessments, setAssessments] = useState([]);
    const [latestAssessment, setLatestAssessment] = useState(null);
    const [otherAssessments, setOtherAssessments] = useState([]);

    useEffect(() => {
        fetchTodayAssessments();
    }, []);

    const fetchTodayAssessments = async () => {
        try {
            // Using the global API instance instead of axios directly
            const token = localStorage.getItem('token');
            const response = await api.get('/assessments/today', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.length > 0) {
                const sortedAssessments = response.data.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                setLatestAssessment(sortedAssessments[0]);
                setOtherAssessments(sortedAssessments.slice(1));
            }
        } catch (error) {
            console.error('Error fetching today\'s assessments:', error);
        }
    };

    return (
        <div className="assessment-today">
            <h2>Today's Risk Assessments</h2>

            {latestAssessment ? (
                <div className="assessment-detail">
                    <h3>Latest Assessment</h3>
                    <p><strong>ID:</strong> {latestAssessment.id}</p>
                    <p>
                        <strong>Job Site Address:</strong>{' '}
                        <a
                            href={`https://www.google.com/maps?q=${encodeURIComponent(
                                latestAssessment.job_site_address
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {latestAssessment.job_site_address}
                        </a>
                    </p>
                    <p><strong>Created At:</strong> {new Date(latestAssessment.created_at).toLocaleString()}</p>
                    <p><strong>Team Leader:</strong> {latestAssessment.team_leader_name || 'Not specified'}</p>
                    <p><strong>Created By:</strong> {latestAssessment.created_by_name || 'Unknown'}</p>
                    <p>
                        <strong>Crew:</strong> {latestAssessment.on_site_arborists.join(', ')}
                    </p>
                    <p><strong>Car Key Location:</strong> {latestAssessment.car_key_location}</p>
                    <p>
                        <strong>Nearest Hospital:</strong> {latestAssessment.nearest_hospital_name}{' '}
                        {latestAssessment.nearest_hospital_address && (
                            <a
                                href={`https://www.google.com/maps?q=${encodeURIComponent(latestAssessment.nearest_hospital_address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                (View on Map)
                            </a>
                        )}
                        {latestAssessment.nearest_hospital_phone && (
                            <>
                                {' '}<a href={`tel:${latestAssessment.nearest_hospital_phone}`}>Call</a>
                            </>
                        )}
                    </p>
                    <p><strong>Weather Conditions:</strong> {latestAssessment.weather_conditions.join(', ')}</p>
                    <p><strong>Methods of Work:</strong> {latestAssessment.methods_of_work.join(', ')}</p>
                    <p><strong>Location Risks:</strong> {latestAssessment.location_risks.join(', ')}</p>
                    <p><strong>Tree Risks:</strong> {latestAssessment.tree_risks.join(', ')}</p>
                    <p><strong>Additional Risks:</strong> {latestAssessment.additional_risks || 'None'}</p>
                    <p>
                        <strong>All members of the crew is aware of the work plan, has appropriate PPE and work can be
                            carried out safely:</strong> {latestAssessment.safety_confirmation ? 'Yes' : 'No'}
                    </p>
                </div>
            ) : (
                <p>No assessments found for today.</p>
            )}

            {/* Display links for other assessments */}
            {otherAssessments.length > 0 && (
                <div className="other-assessments">
                    <h3>Earlier</h3>
                    <ul>
                        {otherAssessments.map((assessment) => (
                            <li key={assessment.id}>
                                <a href={`/assessments/${assessment.id}`}>
                                    {assessment.job_site_address} - {new Date(assessment.created_at).toLocaleTimeString()}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TodayAssessments;
