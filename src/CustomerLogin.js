import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Ensure Font Awesome is linked in your public/index.html or installed as a React package
// For example, in public/index.html: <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
import './css/CustomerLogin.css'; // Reusing the AuthForm.css for consistent styling

const API_URL = 'http://localhost:5000/api'; // Base URL for your backend API

// Configure axios to send cookies with every request
axios.defaults.withCredentials = true;

const CustomerLogin = () => {
    const [formType, setFormType] = useState('login'); // 'login' or 'register'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // For password visibility toggle

    const navigate = useNavigate();

    // Clear messages when switching form type
    useEffect(() => {
        setMessage('');
        setError('');
        setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
        setShowPassword(false);
    }, [formType]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_URL}/customer/register`, {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            setMessage(response.data.message);
            // After successful registration, switch to login form
            setTimeout(() => {
                setFormType('login');
            }, 1500);
        } catch (err) {
            console.error('Error during customer registration:', err);
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/customer/login`, {
                email: formData.email,
                password: formData.password
            });
            setMessage(response.data.message);
            // Store customer info (excluding sensitive data) in local storage
            localStorage.setItem('customerInfo', JSON.stringify(response.data.customer));
            localStorage.setItem('userRole', 'customer'); // Store user role

            setTimeout(() => {
                navigate('/customer/dashboard'); // Redirect to customer dashboard
            }, 1000);
        } catch (err) {
            console.error('Error during customer login:', err);
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <div className="form-switcher">
                    <button
                        className={formType === 'login' ? 'active' : ''}
                        onClick={() => setFormType('login')}
                        disabled={loading}
                    >
                        Customer Login
                    </button>
                    <button
                        className={formType === 'register' ? 'active' : ''}
                        onClick={() => setFormType('register')}
                        disabled={loading}
                    >
                        Customer Register
                    </button>
                </div>

                {message && <div className="auth-message success">{message}</div>}
                {error && <div className="auth-message error">{error}</div>}
                {loading && <div className="auth-loading">Loading...</div>}

                {formType === 'login' ? (
                    <form onSubmit={handleLoginSubmit}>
                        <h2>Customer Login</h2>
                        <div className="form-group">
                            <label htmlFor="login-email">Email:</label>
                            <input
                                type="email"
                                id="login-email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-password">Password:</label>
                            <div className="password-toggle-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="login-password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
                                    <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                </span>
                            </div>
                        </div>
                        <button type="submit" disabled={loading}>Login</button>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit}>
                        <h2>Customer Registration</h2>
                        <div className="form-group">
                            <label htmlFor="register-name">Name:</label>
                            <input
                                type="text"
                                id="register-name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                autoComplete="name"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="register-email">Email:</label>
                            <input
                                type="email"
                                id="register-email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="register-password">Password:</label>
                            <div className="password-toggle-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="register-password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                                <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
                                    <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                                </span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="register-confirm-password">Confirm Password:</label>
                            <input
                                type="password"
                                id="register-confirm-password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                                autoComplete="new-password"
                            />
                        </div>
                        <button type="submit" disabled={loading}>Register</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CustomerLogin;
