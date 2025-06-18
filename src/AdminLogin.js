import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/AdminLogin.css';

const API_URL = "https://travel-booking-platform.onrender.com";

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(`${API_URL}/api/admin/login`, {
                email: email.trim().toLowerCase(), // normalize email
                password
            });

            if (response.status === 200) {
                console.log('✅ Super Admin login successful:', response.data);
                localStorage.setItem('isAdminAuthenticated', 'true');
                navigate('/admin_dashboard');
            } else {
                console.warn('⚠️ Unexpected login status:', response.status);
                setError('Login failed. Please try again.');
            }
        } catch (err) {
            console.error('❌ Error during Super Admin login:', err);
            if (err.response?.data?.error) {
                setError(`Login failed: ${err.response.data.error}`);
            } else {
                setError('Login failed. Please check your credentials and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="super-admin-login-container">
            <div className="login-form-card">
                <h2>Super Admin Login</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            aria-label="Email address"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            aria-label="Password"
                            autoComplete="current-password"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
