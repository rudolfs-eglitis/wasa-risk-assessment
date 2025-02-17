import React, { useState } from 'react';
import api from '../utils/api'; // Global API instance

const AddUserForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user', // default value
        phone_number: '',
    });
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Basic validation for required fields.
        if (!formData.name || !formData.email || !formData.role || !formData.phone_number) {
            setError('Please fill out all fields.');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            // POST to /users/create (as defined in your backend routes)
            const response = await api.post('/users/create', formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSuccessMessage(response.data.message);
            setGeneratedPassword(response.data.generatedPassword);
            setError('');
            // Optionally reset the form
            setFormData({ name: '', email: '', role: 'user', phone_number: '' });
        } catch (err) {
            console.error('Error creating user:', err.response?.data || err.message);
            setError(err.response?.data?.error || 'Failed to create user.');
            setSuccessMessage('');
        }
    };

    return (
        <div className="add-user-form">
            <h2>Add New User</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            <form onSubmit={handleSubmit} method="POST">
                <div>
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                    />
                </div>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                    />
                </div>
                <div>
                    <label>Phone number:</label>
                    <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                    />
                </div>
                <div>
                    <label>Role:</label>
                    <select name="role" value={formData.role} onChange={handleChange}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <button type="submit">Add User</button>
            </form>
            {generatedPassword && (
                <div style={{ marginTop: '20px' }}>
                    <h3>User Created</h3>
                    <p>
                        <strong>Generated Password:</strong> {generatedPassword}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AddUserForm;
