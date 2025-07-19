import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AddUserForm from './components/AddUserForm';
import UserManagement from './components/UserManagement';
import ConditionManagement from './components/ConditionManagement';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import RiskAssessmentForm from './components/RiskAssessmentForm';
import TodayAssessments from './components/TodayAssessments';
import AssessmentHistory from './components/AssessmentHistory';
import AssessmentDetail from './components/AssessmentDetail';

import '../public/styles.css';
import { isAuthenticated } from './utils/auth';


const App = () => {
    const [authChecked, setAuthChecked] = useState(false); // Track if auth check is complete
    const [loggedIn, setLoggedIn] = useState(false); // Track if the user is authenticated

    useEffect(() => {
        const checkAuth = async () => {
            const authStatus = await isAuthenticated();
            setLoggedIn(authStatus);
            setAuthChecked(true); // Indicate that auth check is complete
        };

        checkAuth();
    }, []);

    if (!authChecked) {
        // While checking authentication, display a loading screen or blank page
        return <div>Loading...</div>;
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={loggedIn ? <Navigate to="/today" /> : <Login />}
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/add-user"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <Layout>
                            <AddUserForm />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/user-management"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <Layout>
                            <UserManagement />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/condition-management"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <Layout>
                            <ConditionManagement />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/create-assessment"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <RiskAssessmentForm />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/today"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <TodayAssessments />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/history"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <Layout>
                            <AssessmentHistory />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/assessments/show/:id"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <AssessmentDetail />
                        </Layout>
                    </ProtectedRoute>
                }
            />

            {/* Default Route */}
            <Route
                path="/"
                element={<Navigate to={loggedIn ? '/today' : '/login'} />}
            />
        </Routes>
    );
};

export default App;
