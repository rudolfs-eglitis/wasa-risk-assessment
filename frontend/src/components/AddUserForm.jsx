import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../utils/api.js";

const AddUserForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('user');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response =await api.post('/users',
                { name, email, phone_number: phoneNumber, role },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Display the generated password
            setGeneratedPassword(response.data.generatedPassword);

            // Clear the form fields
            setName('');
            setEmail('');
            setPhoneNumber('');
            setRole('user');
        } catch (err) {
            console.error(err);
            alert('Failed to add user. Please try again.');
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                {generatedPassword && (
                    <div className="message">
                        <h4>User added successfully!</h4>
                        <p>
                            Generated Password: <strong>{generatedPassword}</strong>
                    </p>
                        <button onClick={() => navigate('/user-management')}>Go to user management</button>
                    </div>
                )}
                <h2>Add New User</h2>
                <label>Name:
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label>Email:
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label>Phone Number:
                <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </label>
                <label>Role:
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                </label>
                <button type="submit">Add User</button>
            </form>
        </div>
    );
};

export default AddUserForm;
