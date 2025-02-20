import React, { useEffect, useState } from 'react';
import api from '../utils/api'; // Use the global API instance
import moment from 'moment';
import Layout from './Layout';
import {Link} from "react-router-dom";


const TodayAssessments = () => {
    const [assessments, setAssessments] = useState([]);
    const [latestAssessment, setLatestAssessment] = useState(null);
    const [otherAssessments, setOtherAssessments] = useState([]);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);


    useEffect(() => {
        fetchTodayAssessments();
    }, []);

    const fetchTodayAssessments = async () => {
        try {
            const token = localStorage.getItem('token');
            const decoded = JSON.parse(atob(token.split('.')[1]));
            setCurrentUser(decoded.id);

            const response = await api.get('/assessments/today', {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("Response data:", response.data);

            // Check if response.data is an array
            if (!Array.isArray(response.data)) {
                console.error("Expected an array but got:", response.data);
                // Optionally, handle this case by wrapping it in an array:
                setAssessments(response.data);
            } else {
                setError('Unexpected response format.');
            }

            const data = Array.isArray(response.data) ? response.data : [];
            if (data.length > 0) {
                const sorted = data.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                setLatestAssessment(sorted[0]);
                setOtherAssessments(sorted.slice(1));
            }
        } catch (error) {
            console.error("Error fetching today's assessments:", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/assessments/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('Assessment deleted successfully.');
            fetchTodayAssessments(); // Refresh the list
        } catch (error) {
            console.error("Error deleting assessment:", error.response?.data || error.message);
            alert("Failed to delete assessment.");
        }
    };

    return (
        <div className="assessment-today">
            <h2>Today's Risk Assessments</h2>

            {latestAssessment ? (
                <div className="assessment-detail">
                    <h3><Link to={`/assessments/${latestAssessment.id}`}>
                        Latest Assessment
                    </Link></h3>
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
                    {parseInt(latestAssessment.created_by) === parseInt(currentUser) && (
                        <button onClick={() => handleDelete(latestAssessment.id)} style={{marginLeft: '10px'}}>
                            Delete
                        </button>
                    )}
                </div>
            ) : (
                <p>No assessments found for today.</p>
            )}

            {/* Display links for other assessments */}
            {otherAssessments.length > 0 && (
                <div className="other-assessments">
                    <h3>Earlier</h3>
                    <ul>
                        {otherAssessments.map((assessment) => {
                            // Determine if deletion is allowed:
                            // It is allowed if the assessment was created today and by the current user.
                            const isToday = moment(assessment.created_at).isSame(moment(), 'day');
                            const canDelete = isToday && parseInt(assessment.created_by) === parseInt(currentUser);
                            return (
                                <li key={assessment.id}>
                                    <Link to={`/assessments/${assessment.id}`}>
                                        {assessment.job_site_address.split(',')[0]} - {new Date(assessment.created_at).toLocaleTimeString()}
                                        {assessment.created_by_name && ` - Created By: ${assessment.created_by_name}`}
                                    </Link>
                                    {canDelete && (
                                        <button onClick={() => handleDelete(assessment.id)}
                                                style={{marginLeft: '10px'}}>
                                            Delete
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default TodayAssessments;
