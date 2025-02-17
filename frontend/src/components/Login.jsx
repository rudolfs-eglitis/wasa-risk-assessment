import React, { useState } from 'react';
import api from "../utils/api.js";

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            //alert('Login successful!');
            window.location.href = '/today';
        } catch (err) {
            alert('Invalid email or password');
        }
    };

    return (
        <div className="layout">
            <main>
                <form onSubmit={handleSubmit}>
                    <h2>Login</h2>
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
                    <label>Password:</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required/>
                    <button type="submit">Login</button>
                </form>
            </main>
        </div>
    );
};

export default Login;
