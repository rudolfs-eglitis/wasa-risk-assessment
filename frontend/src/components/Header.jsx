import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from "../utils/api.js";


const handleLogout = async () => {
    try {
        const token = localStorage.getItem('token');

        // Make a logout request to the backend
        await api.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${token}` },
        });

        // Clear the token from localStorage
        localStorage.removeItem('token');

        // Redirect the user to the login page
        navigate('/login');
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

// A helper function to decode JWT and return its payload
const getTokenPayload = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};


const Header = () => {
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    if (!token) return null; // If there's no token, don't show the header

    const payload = getTokenPayload(token);
    const isAdmin = payload && payload.role === 'admin';

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token');

        alert('You have been logged out!');
        window.location.href = '/login';
    };

    return (
        <header style={headerStyle}>
            <h1 style={{margin: 0}}><Link to="/" style={styles.link}>Wasa Trädfällning</Link></h1>
            <nav>
                <ul>
                    <li><Link to="/today">Today</Link></li>
                    <li><Link to="/create-assessment">New</Link></li>
                    {isAdmin && (
                        <>
                            <li><Link to="/history">History</Link></li>
                            <li><Link to="/user-management">Users</Link></li>
                        </>
                    )}
                </ul>
            </nav>
            <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
        </header>
    );
};

const styles = {
    header: {
        backgroundColor: '#4CAF50',
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
    },
    nav: {
        display: 'flex',
        gap: '20px',
    },
    link: {
        textDecoration: 'none',
        fontWeight: 'bold',
    },
    logoutButton: {
        border: 'none',
        padding: '8px 12px',
        borderRadius: '5px',
        cursor: 'pointer',
    },
};


const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    color: '#fff',
};

const buttonStyle = {
    backgroundColor: '#fff',
    color: '#007bff',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
};

export default Header;
