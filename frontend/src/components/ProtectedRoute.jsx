import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
    const token = localStorage.getItem('token');
    if (!token) {
        return <Navigate to="/login" />;
    }

    let payload = null;
    try {
        payload = JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error('Error decoding token:', error);
        return <Navigate to="/login" />;
    }

    // If a required role is specified and the user's role doesn't match, redirect.
    if (requiredRole && payload.role !== requiredRole) {
        return <Navigate to="/today" />;
    }

    return children;
};

export default ProtectedRoute;
