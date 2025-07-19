import React, { useState, useEffect } from 'react';
import axios from 'axios';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './AssessmentHistory.css';
import moment from 'moment';
import api from "../utils/api.js";
import { FaClock, FaUser } from 'react-icons/fa';


const AssessmentHistory = () => {
    const [history, setHistory] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [assessmentsForSelectedDate, setAssessmentsForSelectedDate] = useState([]);

    // Fetch history from the backend
    useEffect(() => {
        fetchAssessmentHistory();
    }, []);

    const fetchAssessmentHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/assessments/history', {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('Fetched Assessment History:', response.data); // Debugging
            setHistory(response.data);
        } catch (error) {
            console.error('Error fetching assessment history:', error);
        }
    };

    useEffect(() => {
        // Normalize selectedDate to match backend date format
        const dateKey = moment(selectedDate).format('YYYY-MM-DD'); // Local time for frontend
        console.log('Formatted Selected Date:', dateKey); // Debugging

        if (history[dateKey]) {
            setAssessmentsForSelectedDate(history[dateKey]);
        } else {
            setAssessmentsForSelectedDate([]);
        }
    }, [selectedDate, history]);

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    return (
        <div className="assessment-history">
            <h2>Risk Assessment History</h2>

            {/* Calendar Component */}
            <div className="calendar-container">
                <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    tileClassName={({ date, view }) => {
                        const dateKey = moment(date).utc().format('YYYY-MM-DD');
                        if (view === 'month' && history[dateKey]) {
                            return 'highlight'; // Highlight dates with assessments
                        }
                        return null;
                    }}
                />
            </div>

            {/* List of Assessments */}
                <h3>Assessments for {selectedDate.toDateString()}</h3>
                {assessmentsForSelectedDate.length > 0 ? (
                    <ul>
                        {assessmentsForSelectedDate.map((assessment) => (
                            <li key={assessment.id}>
                                <a href={`/assessments/show/${assessment.id}`} target="_blank"
                                   rel="noopener noreferrer">
                                    {assessment.address}
                                    &nbsp;&nbsp;
                                    <FaClock/> {new Date(assessment.created_at).toLocaleTimeString('sv-SE', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                                    &nbsp;&nbsp;
                                    <FaUser/> {assessment.created_by}
                                </a>
                            </li>
                        ))}
                    </ul>


                ) : (
                    <p>No assessments found for this date.</p>
                )}
        </div>
    );
};

export default AssessmentHistory;
