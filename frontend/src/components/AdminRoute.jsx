import React from 'react';
import { Navigate } from 'react-router-dom';

// Helper function to decode JWT (assuming it's a simple base64 decode of the payload)
const getTokenPayload = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');

    // If no token is found, redirect to login
    if (!token) {
        return <Navigate to="/login" />;
    }

    const payload = getTokenPayload(token);

    // If user is not admin, redirect to a default page (for example, /today)
    if (!payload || payload.role !== 'admin') {
        return <Navigate to="/today" />;
    }

    // Otherwise, render the children components (the protected component)
    return children;
};

export default ProtectedRoute;
