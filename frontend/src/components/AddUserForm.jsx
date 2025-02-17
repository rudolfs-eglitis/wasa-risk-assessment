import React, { useState } from 'react';
import api from '../utils/api';

const AddUserForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
        phone_number: '',
    });
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log(`Field ${name} changed to: ${value}`);
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submission initiated with data:', formData);

        // Basic front-end validation
        if (!formData.name || !formData.email || !formData.role || !formData.phone_number) {
            setError('Please fill out all fields.');
            return;
        }

        // Clear previous messages
        setError('');
        setSuccessMessage('');
        setGeneratedPassword('');

        try {
            const token = localStorage.getItem('token');
            const response = await api.post('/users/create', formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('User creation response:', response.data);
            setSuccessMessage(response.data.message);
            setGeneratedPassword(response.data.generatedPassword);
            // Optionally clear form fields here
            setFormData({ name: '', email: '', role: 'user', phone_number: '' });
            // Do not redirect immediately so we can see the success message
        } catch (err) {
            console.error('Error creating user:', err.response?.data || err.message);
            setError(err.response?.data?.error || 'Failed to create user.');
        }
    };

    return (
        <div className="add-user-form">
            <h2>Add New User</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            {generatedPassword && (
                <div style={{ marginTop: '20px' }}>
                    <h3>User Created</h3>
                    <p><strong>Generated Password:</strong> {generatedPassword}</p>
                    <p>Please share this password with the user and advise them to change it on first login.</p>
                </div>
            )}
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
                    <label>Phone Number:</label>
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
                    </select>
                </div>
                <button type="submit">Add User</button>
            </form>
        </div>
    );
};

export default AddUserForm;
