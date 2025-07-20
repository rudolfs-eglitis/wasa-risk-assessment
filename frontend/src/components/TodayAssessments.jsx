import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import moment from 'moment';
import Layout from './Layout';
import { Link } from 'react-router-dom';
import {
    FaMapMarkerAlt,
    FaPhone,
    FaClock,
    FaUser,
    FaFilePdf
} from 'react-icons/fa';

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
            fetchTodayAssessments();
        } catch (error) {
            console.error("Error deleting assessment:", error.response?.data || error.message);
            alert("Failed to delete assessment.");
        }
    };

    const downloadPdf = async (id) => {
        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`/assessments/pdf/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('PDF download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `wasa-risk-assessment-${id}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Could not download PDF');
            console.error(err);
        }
    };


    return (
        <div className="assessment-today">
            <h2>Today's Risk Assessments</h2>

            {latestAssessment ? (
                <div className="assessment-detail">
                    <p>
                        <FaClock style={{ marginRight: '6px' }} />
                        {new Date(latestAssessment.created_at).toLocaleString('en-GB', {
                            hour: '2-digit', minute: '2-digit', hour12: false
                        })}
                        &nbsp;|&nbsp;
                        <FaUser style={{ marginRight: '6px' }} />
                        {latestAssessment.created_by_name || 'Unknown'}
                    </p>
                    <p>
                        <strong>Job Site Address:</strong>{' '}
                        <a
                            href={`https://www.google.com/maps?q=${encodeURIComponent(latestAssessment.job_site_address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ marginLeft: '10px' }}
                        >
                            {latestAssessment.job_site_address}
                        </a>
                    </p>
                    <div style={{ marginTop: '1rem' }}>
                        <iframe
                            title="Google Maps"
                            width="100%"
                            height="250"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_API_KEY}&q=${encodeURIComponent(latestAssessment.job_site_address)}`}
                            allowFullScreen
                        />
                    </div>

                    {latestAssessment.job_site_lat && latestAssessment.job_site_lng && (
                        <p>
                            <strong>GPS Coordinates:</strong>{' '}
                            <a
                                href={`https://www.google.com/maps?q=${latestAssessment.job_site_lat},${latestAssessment.job_site_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="View on Map"
                            >
                                {latestAssessment.job_site_lat}, {latestAssessment.job_site_lng} <FaMapMarkerAlt />
                            </a>
                        </p>
                    )}

                    <p>
                        <strong>Nearest Hospital:</strong>
                        {latestAssessment.nearest_hospital_address && (
                            <a
                                href={`https://www.google.com/maps?q=${encodeURIComponent(latestAssessment.nearest_hospital_address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginLeft: '8px' }}
                                title="View on Map"
                            >
                                {latestAssessment.nearest_hospital_name} <FaMapMarkerAlt />
                            </a>
                        )}
                        {latestAssessment.nearest_hospital_phone && (
                            <a
                                href={`tel:${latestAssessment.nearest_hospital_phone}`}
                                style={{ marginLeft: '8px' }}
                                title="Call Hospital"
                            >
                                <FaPhone />
                            </a>
                        )}
                    </p>

                    <p><strong>Car Key and First Aid Location:</strong> {latestAssessment.car_key_location || 'Not specified'}</p>
                    <p><strong>Team Leader:</strong> {latestAssessment.team_leader_name || 'Not specified'}</p>
                    <p><strong>Crew:</strong> {latestAssessment.on_site_arborists.join(', ')}</p>
                    <p><strong>Methods of Work:</strong> {latestAssessment.methods_of_work.join(', ')}</p>

                    <h3>Tree Risks and Mitigations</h3>
                    {latestAssessment.tree_conditions?.length > 0 ? (
                        <ul>
                            {latestAssessment.tree_conditions.map((condition) => (
                                <li key={condition.id}>
                                    <strong>{condition.name}:</strong>{' '}
                                    {condition.mitigations?.length > 0
                                        ? condition.mitigations.map((m) => m.name).join(', ')
                                        : 'No mitigations listed.'}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No tree risks specified.</p>
                    )}

                    <h3>Location Risks and Mitigations</h3>
                    {latestAssessment.location_conditions?.length > 0 ? (
                        <ul>
                            {latestAssessment.location_conditions.map((condition) => (
                                <li key={condition.id}>
                                    <strong>{condition.name}:</strong>{' '}
                                    {condition.mitigations?.length > 0
                                        ? condition.mitigations.map((m) => m.name).join(', ')
                                        : 'No mitigations listed.'}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No location risks specified.</p>
                    )}

                    <h3>Weather Risks and Mitigations</h3>
                    {latestAssessment.weather_conditions_details?.length > 0 ? (
                        <ul>
                            {latestAssessment.weather_conditions_details.map((condition) => (
                                <li key={condition.id}>
                                    <strong>{condition.name}:</strong>{' '}
                                    {condition.mitigations?.length > 0
                                        ? condition.mitigations.map((m) => m.name).join(', ')
                                        : 'No mitigations listed.'}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No weather risks specified.</p>
                    )}
                    <h3>Additional Risks:</h3>
                    <p>{latestAssessment.additional_risks || 'None'}</p>

                    <p>
                        <strong>All members of the crew is aware of the work plan, has appropriate PPE and work can be
                            carried out safely:</strong> {latestAssessment.safety_confirmation ? 'Yes' : 'No'}
                    </p>
                    <p>
                         <button onClick={() => downloadPdf(assessment.id)}>
                            <FaFilePdf/> Download PDF
                        </button>
                        {parseInt(latestAssessment.created_by) === parseInt(currentUser) && (
                            <button onClick={() => handleDelete(latestAssessment.id)} style={{marginLeft: '10px'}}>
                                Delete
                            </button>
                        )}
                    </p>
                </div>
            ) : (
                <p>No assessments found for today.</p>
            )}

            {otherAssessments.length > 0 && (
                <div className="other-assessments">
                    <h3>Earlier</h3>
                    <ul>
                        {otherAssessments.map((assessment) => {
                            const isToday = moment(assessment.created_at).isSame(moment(), 'day');
                            const canDelete = isToday && parseInt(assessment.created_by) === parseInt(currentUser);
                            return (
                                <li key={assessment.id} style={{marginBottom: '10px'}}>
                                    <Link to={`/assessments/show/${assessment.id}`}>
                                        {assessment.job_site_address.split(',')[0]}
                                    </Link>
                                    <span style={{marginLeft: '10px', fontSize: '0.9em', color: '#555'}}>
                                        <FaClock style={{marginRight: '4px'}}/>
                                        {new Date(assessment.created_at).toLocaleTimeString('en-GB', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        })}
                                    </span>
                                    <span style={{marginLeft: '10px', fontSize: '0.9em', color: '#555'}}>
                                        <FaUser style={{marginRight: '4px'}}/>
                                        {assessment.created_by_name || 'Unknown'}
                                    </span>

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
