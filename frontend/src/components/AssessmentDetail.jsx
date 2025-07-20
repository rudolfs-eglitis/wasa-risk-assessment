import React, { useEffect, useState } from 'react';
import api from '../utils/api'; // Use the global API instance

import { useParams } from 'react-router-dom';

import { FaMapMarkerAlt, FaPhone, FaClock, FaUser, FaFilePdf } from 'react-icons/fa';

import { Link } from 'react-router-dom';

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
                console.log('Assessment data:', response.data);  // 🔍 Debug line
                setAssessment(response.data);
            } catch (err) {
                console.error('Error fetching assessment:', err.response?.data || err.message);
                setError('Failed to load assessment.');
            }
        };

        fetchAssessment();
    }, [id]);

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


    if (error) return <div>{error}</div>;
    if (!assessment) return <div>Loading...</div>;

    return (
        <div>
            <h2>Assessment Details &nbsp;|&nbsp; ID: {assessment.id}</h2>
            <p>
                <FaClock style={{marginRight: '6px'}}/>
                {new Date(assessment.created_at).toLocaleString('en-GB', {
                    weekday: 'long',    // e.g., "Monday"
                    year: 'numeric',
                    month: 'long',      // e.g., "May"
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false       // ensures 24-hour format
                })}
                &nbsp;|&nbsp;
                <FaUser style={{marginRight: '6px'}}/>
                {assessment.created_by_name || 'Unknown'}
            </p>
            <p>
                <strong>Job Site Address:</strong> {' '}
                <a
                    href={`https://www.google.com/maps?q=${encodeURIComponent(assessment.job_site_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{marginLeft: '10px'}}
                >
                    {assessment.job_site_address}
                </a>
            </p>
            <div style={{marginTop: '1rem'}}>
                <iframe
                    title="Google Maps"
                    width="100%"
                    height="250"
                    frameBorder="0"
                    style={{border: 0}}
                    src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_API_KEY}&q=${encodeURIComponent(
                        assessment.job_site_address
                    )}`}
                    allowFullScreen
                />
            </div>

            {assessment.job_site_lat && assessment.job_site_lng && (
                <p>
                    <strong>GPS Coordinates:</strong>{' '}
                    <a
                        href={`https://www.google.com/maps?q=${assessment.job_site_lat},${assessment.job_site_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View on Map"
                    >
                        {assessment.job_site_lat}, {assessment.job_site_lng} <FaMapMarkerAlt/>
                    </a>
                </p>
            )}
            <p>
                <strong>Nearest Hospital:</strong>
                {assessment.nearest_hospital_address && (
                    <a
                        href={`https://www.google.com/maps?q=${encodeURIComponent(assessment.nearest_hospital_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{marginLeft: '8px'}}
                        title="View on Map"
                    >
                        {assessment.nearest_hospital_name} <FaMapMarkerAlt/>
                    </a>
                )}
                {assessment.nearest_hospital_phone && (
                    <a
                        href={`tel:${assessment.nearest_hospital_phone}`}
                        style={{marginLeft: '8px'}}
                        title="Call Hospital"
                    >
                        <FaPhone/>
                    </a>
                )}
            </p>
            <p>
                <strong>Car Key and First Aid Location:</strong>{' '}
                {assessment.car_key_location || 'Not specified'}
            </p>

            <p>
                <strong>Team Leader:</strong> {assessment.team_leader_name || 'Not specified'}
            </p>
            <p>
                <strong>Crew:</strong> {Array.isArray(assessment.on_site_arborists) ? assessment.on_site_arborists.join(', ') : 'None'}
            </p>


            <p>
                <strong>Methods of Work:</strong>{' '}
                {Array.isArray(assessment.methods_of_work) ? assessment.methods_of_work.join(', ') : 'Not specified'}
            </p>
            {/* Tree Risks and Mitigations */}
            <h3>Tree Risks and Mitigations</h3>
            {assessment.tree_conditions?.length > 0 ? (
                <ul>
                    {assessment.tree_conditions.map((condition) => (
                        <li key={condition.id}>
                            <strong>{condition.name}:</strong>
                            {condition.mitigations?.length > 0 ? (
                                <ul>
                                    {condition.mitigations.map((m) => (
                                        <li key={m.id}>{m.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No mitigations listed.</p>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No tree risks specified.</p>
            )}


            {/* Location Risks and Mitigations */}
            <h3>Location Risks and Mitigations</h3>
            {assessment.location_conditions?.length > 0 ? (
                <ul>
                    {assessment.location_conditions.map((condition) => (
                        <li key={condition.id}>
                            <strong>{condition.name}:</strong>
                            {condition.mitigations?.length > 0 ? (
                                <ul>
                                    {condition.mitigations.map((m) => (
                                        <li key={m.id}>{m.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No mitigations listed.</p>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No location risks specified.</p>
            )}


            {/* Weather Risks and Mitigations */}
            <h3>Weather Risks and Mitigations</h3>
            {assessment.weather_conditions_details?.length > 0 ? (
                <ul>
                    {assessment.weather_conditions_details.map((condition) => (
                        <li key={condition.id}>
                            <strong>{condition.name}:</strong>
                            {condition.mitigations?.length > 0 ? (
                                <ul>
                                    {condition.mitigations.map((m) => (
                                        <li key={m.id}>{m.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No mitigations listed.</p>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No weather risks specified.</p>
            )}

            <h3>Additional Risks:</h3>{' '}
            <p>
                {assessment.additional_risks || 'None'}
            </p>
            <p>
                <strong>All members of the crew is aware of the work plan, has appropriate PPE and work can be carried
                    out safely:</strong> {assessment.safety_confirmation ? 'Yes' : 'No'}
            </p>
            <p>
                <button onClick={() => downloadPdf(assessment.id)}>
                    <FaFilePdf/> Download PDF
                </button>
            </p>
        </div>
    );
};

export default AssessmentDetail;