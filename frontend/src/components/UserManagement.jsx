import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaToggleOn, FaToggleOff, FaRedo } from 'react-icons/fa';  // Import icons


import api from "../utils/api.js";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();


    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const resetPassword = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.post(
                `/users/${userId}/reset-password`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMessage(`Password reset successfully! New Password: ${res.data.generatedPassword}`);
            fetchUsers(); // Refresh the user list
        } catch (err) {
            console.error('Error resetting password:', err);
            setMessage('Failed to reset password.');
        }
    };

    // Toggle user activation status
    const handleToggleActivation = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await api.patch(`/users/${userId}/toggle-activation`, {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert('User role changed successfully!.');
            fetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Error toggling user role:', error.response?.data || error.message);
            alert('Failed to toggle user activation.');
        }
    };

    return (
        <div>
            <h2>User Management </h2>
            <button onClick={() => navigate('/add-user')} style={{marginBottom: '20px'}}>
                Create New User
            </button>
            {message && <p>{message}</p>}
            <table border="0" cellPadding="10">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {users.map((user) => (
                    <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.phone_number || '-'}</td>
                        <td>
                            <button
                                onClick={() => resetPassword(user.id)}
                                title="Reset Password"
                            >
                                <FaRedo/>
                            </button>
                            {user.id !== 1 && user.id !== 2 && (
                                <button
                                onClick={() => handleToggleActivation(user.id, user.role)}
                            title={user.role === 'inactive' ? 'Activate User' : 'Deactivate User'}
                            style={{ color: user.role === 'inactive' ? 'darkgreen' : 'darkred' }}
                        >
                            {user.role === 'inactive' ? <FaToggleOff /> : <FaToggleOn />}
                        </button>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagement;
