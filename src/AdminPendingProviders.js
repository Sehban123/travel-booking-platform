// src/components/Admin/AdminPendingProviders.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdminPendingProviders.css';

const API_URL = 'http://localhost:5000/api';

const AdminPendingProviders = () => {
    const [pendingProviders, setPendingProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(''); // For success/error messages after action

    // Function to fetch pending provider applications
    const fetchPendingProviders = async () => {
        try {
            setLoading(true);
            setError(null); // Clear previous errors
            setMessage(''); // Clear previous messages
            const response = await axios.get(`${API_URL}/admin/pending-providers`);
            setPendingProviders(response.data);
            console.log("Fetched pending providers:", response.data);
        } catch (err) {
            console.error('Error fetching pending providers:', err);
            setError('Failed to load pending provider applications.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch pending providers on component mount
    useEffect(() => {
        fetchPendingProviders();
    }, []);

    // Function to handle approving a provider
    const handleApprove = async (providerId) => {
        setMessage(''); // Clear previous messages
        setLoading(true); // Disable buttons
        try {
            console.log(`Approving provider with ID: ${providerId}`);
            const response = await axios.post(`${API_URL}/admin/providers/${providerId}/approve`);
            setMessage(response.data.message || 'Provider approved successfully!');
            // Refresh the list after approval
            fetchPendingProviders();
        } catch (error) {
            console.error('Error approving provider:', error);
            // Display specific error message from backend if available
            setMessage(error.response?.data?.error || error.response?.data?.message || 'Failed to approve provider.');
        } finally {
            setLoading(false); // Re-enable buttons
        }
    };

    // Function to handle rejecting a provider
    const handleReject = async (providerId) => {
        setMessage(''); // Clear previous messages
        setLoading(true); // Disable buttons
        try {
            const response = await axios.post(`${API_URL}/admin/providers/${providerId}/reject`);
            setMessage(response.data.message || 'Provider rejected successfully!');
            // Refresh the list after rejection
            fetchPendingProviders();
        } catch (error) {
            console.error('Error rejecting provider:', error);
            setMessage(error.response?.data?.error || error.response?.data?.message || 'Failed to reject provider.');
        } finally {
            setLoading(false); // Re-enable buttons
        }
    };

    return (
        <div className="admin-pending-providers">
            <h2>Pending Service Provider Applications</h2>
            {message && (
                <div className={`message ${message.includes('failed') || message.includes('error') ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}
            {loading && <p>Loading pending applications...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && pendingProviders.length === 0 ? (
                <p>No pending provider applications found.</p>
            ) : (
                <ul className="pending-provider-list">
                    {pendingProviders.map(provider => (
                        <li key={provider._id} className="pending-provider-item">
                            <h3>{provider.businessName}</h3>
                            <p>Owner: {provider.ownerFullName}</p>
                            <p>Email: {provider.email}</p>
                            <p>Mobile: {provider.phoneNumber}</p>
                            <p>Service Type: {provider.serviceType}</p>
                            <p>Application Date: {new Date(provider.applicationDate).toLocaleDateString()}</p>
                            <p>Status: <strong>{provider.status}</strong></p>

                            <div className="actions">
                                {/* Buttons are disabled while loading, preventing multiple submissions */}
                                <button onClick={() => handleApprove(provider._id)} className="approve-button" disabled={loading}>
                                    Approve
                                </button>
                                <button onClick={() => handleReject(provider._id)} className="reject-button" disabled={loading}>
                                    Reject
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminPendingProviders;
