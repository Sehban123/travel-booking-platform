// File: src/components/ServiceProviderAuth.js

import React, { useState } from 'react';
import './css/ServiceProviderAuth.css';
import axios from 'axios';
// You might also need useNavigate if you intend to redirect after login/signup
// import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5000/api';

const ServiceProviderAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for registration
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false); // Add a loading state

  // If you are using React Router for navigation after successful auth
  // const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading
    setMessage(''); // Clear previous messages

    try {
      let url;
      let payload;

      if (isLogin) {
        url = `${API_URL}/provider/login`;
        payload = { email, password };
      } else {
        // Use the correct registration endpoint as defined in Server.js
        url = `${API_URL}/service-provider-applications`;
        // For registration, you might need more fields than just name, email, password
        // This payload assumes the basic fields required by the /service-provider-applications endpoint
        payload = {
          ownerFullName: name, // Map to ownerFullName for service-provider-applications
          email,
          password // This password will be hashed on the server if approved
          // You might need to add other required fields like businessName, contactNumber, etc.
          // For now, assuming only name, email, password for a basic registration attempt
          // If the backend requires other fields, you'll need to add state for them here
          // e.g., businessName: 'Default Business Name', contactNumber: '1234567890'
        };
      }

      const res = await axios.post(url, payload, { withCredentials: true });
      setMessage(res.data.message || 'Operation successful!');

      // If login is successful, you'd typically handle tokens/cookies and redirect
      if (isLogin && res.data.providerId) {
          // Assuming the backend sends providerId and provider details upon successful login
          localStorage.setItem('providerId', res.data.providerId);
          localStorage.setItem('serviceType', res.data.provider.serviceType); // Ensure serviceType is returned from backend
          localStorage.setItem('userRole', 'serviceProvider');
          // navigate(`/provider-dashboard/${res.data.providerId}`); // Uncomment and use navigate
      }
      // For registration, typically you'd just show a success message
      // and maybe advise the user to wait for approval.

    } catch (error) {
      console.error('Authentication error:', error);
      // More specific error message based on server response
      setMessage(error.response?.data?.error || error.response?.data?.message || 'Something went wrong during authentication.');
    } finally {
      setLoading(false); // End loading
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-toggle">
        <button onClick={() => { setIsLogin(true); setMessage(''); setName(''); setPassword(''); setEmail(''); }} className={isLogin ? 'active' : ''}>Login</button>
        <button onClick={() => { setIsLogin(false); setMessage(''); setName(''); setPassword(''); setEmail(''); }} className={!isLogin ? 'active' : ''}>Register</button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            disabled={loading} // Disable while loading
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading} // Disable while loading
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          disabled={loading} // Disable while loading
        />
        <button type="submit" disabled={loading}>
          {loading ? (isLogin ? 'Logging In...' : 'Registering...') : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
      {message && <p className="auth-message">{message}</p>}
    </div>
  );
};

export default ServiceProviderAuth;