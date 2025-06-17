import React, { useState } from 'react';
import axios from 'axios';

const API_URL = "https://travel-booking-backend.onrender.com";

const ChangePassword = ({ providerId, onSuccess, onError, loading, setLoading, setMessage }) => {
    // State for password form data
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    // State for OTP input
    const [otp, setOtp] = useState('');

    // State to manage the current step in the password change process
    const [step, setStep] = useState('enter_passwords'); // 'enter_passwords' or 'enter_otp'

    // State for displaying messages within the component (in addition to parent messages)
    const [localMessage, setLocalMessage] = useState('');


    // Handle input changes in the forms
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleOtpChange = (e) => {
        setOtp(e.target.value);
    };

    // Handle the first step submission (sending passwords to request OTP)
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous parent messages
        onError(null); // Clear previous parent errors
        setLocalMessage(''); // Clear local messages
        setLoading(true); // Start loading

        // Client-side validation for new password length
        if (formData.newPassword.length < 8) {
            setLocalMessage('New password length must be at least 8 characters.');
            setLoading(false);
            return;
        }

        // Basic validation for password match
        if (formData.newPassword !== formData.confirmNewPassword) {
            setLocalMessage('New password and confirm password do not match.');
            setLoading(false);
            return;
        }


        try {
            // Call the backend endpoint to send OTP
            // EXPECTED BACKEND ENDPOINT: POST /api/providers/:providerId/send-otp-password-change
            const response = await axios.post(`${API_URL}/api/providers/${providerId}/send-otp-password-change`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword // Send new password for backend validation
            });

            console.log('OTP request successful:', response.data);
            // Set parent message to indicate OTP sent
            setMessage(response.data.message || 'OTP sent to your email.');
            setLocalMessage(''); // Clear local message on success

            // Move to the next step (enter OTP)
            setStep('enter_otp');

        } catch (err) {
            console.error('Error requesting OTP:', err);
             // Set parent error message
             const errorMessage = err.response?.data?.error || err.message;
             onError(`Failed to send OTP: ${errorMessage}`);
             // Set local message for display within the component
             setLocalMessage(`Failed to send OTP: ${errorMessage}`);
        } finally {
            setLoading(false); // End loading
        }
    };

    // Handle the second step submission (verifying OTP and changing password)
    const handleVerifyOtpAndChangePassword = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous parent messages
        onError(null); // Clear previous parent errors
        setLocalMessage(''); // Clear local messages
        setLoading(true); // Start loading

        // Basic validation for OTP
        if (!otp) {
            setLocalMessage('Please enter the OTP.');
            setLoading(false);
            return;
        }

        try {
            // Call the backend endpoint to verify OTP and change password
            // EXPECTED BACKEND ENDPOINT: PUT /api/providers/:providerId/verify-otp-and-change-password
            const response = await axios.put(`${API_URL}/api/providers/${providerId}/verify-otp-and-change-password`, {
                otp: otp,
                newPassword: formData.newPassword // Send the new password again
            });

            console.log('Password change successful:', response.data);
            // Set parent message for success
            setMessage(response.data.message || 'Password changed successfully!');
            setLocalMessage(''); // Clear local message on success

            // Clear the form and reset step on success
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            });
            setOtp('');
            setStep('enter_passwords'); // Go back to the first step

            onSuccess(); // Notify parent component of success

        } catch (err) {
            console.error('Error verifying OTP and changing password:', err);
             // Set parent error message
             const errorMessage = err.response?.data?.error || err.message;
             onError(`Failed to change password: ${errorMessage}`);
             // Set local message for display within the component
            setLocalMessage(`Failed to change password: ${errorMessage}`);
        } finally {
            setLoading(false); // End loading
        }
    };


    // Render different form based on the current step
    const renderForm = () => {
        if (step === 'enter_passwords') {
            return (
                <form onSubmit={handleRequestOtp}> {/* Submit to handleRequestOtp */}
                    <label>
                        Current Password:
                        <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                    </label>
                    <label>
                        New Password:
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleInputChange}
                            required
                            minLength="8" // Client-side validation
                            disabled={loading}
                        />
                    </label>
                    <label>
                        Confirm New Password:
                        <input
                            type="password"
                            name="confirmNewPassword"
                            value={formData.confirmNewPassword}
                            onChange={handleInputChange}
                            required
                            minLength="8" // Client-side validation
                            disabled={loading}
                        />
                    </label>
                    <button type="submit" disabled={loading}>Send OTP for Password Change</button>
                </form>
            );
        } else if (step === 'enter_otp') {
            return (
                <form onSubmit={handleVerifyOtpAndChangePassword}> {/* Submit to handleVerifyOtpAndChangePassword */}
                    <p>An OTP has been sent to your registered email address. Please enter it below to change your password.</p>
                    <label>
                        Enter OTP:
                        <input
                            type="text" // OTP is typically text or number input
                            name="otp"
                            value={otp}
                            onChange={handleOtpChange}
                            required
                            disabled={loading}
                        />
                    </label>
                     {/* You might want a "Resend OTP" button here */}
                     {/* <button type="button" onClick={handleResendOtp} disabled={loading}>Resend OTP</button> */}
                    <button type="submit" disabled={loading}>Verify OTP and Change Password</button>
                     {/* Option to go back if needed */}
                     <button type="button" onClick={() => { setStep('enter_passwords'); setLocalMessage(''); }} disabled={loading}>Back</button>
                </form>
            );
        }
        return null; // Should not happen
    };


    return (
        <div className="change-password-form">
            <h2>Change Password</h2>
             {/* Local message display */}
             {localMessage && (
                <div className={`form-message ${localMessage.includes('Failed') || localMessage.includes('match') || localMessage.includes('Invalid') || localMessage.includes('expired') || localMessage.includes('length') ? 'error' : 'success'}`}>
                    {localMessage}
                </div>
            )}
            {/* Parent message display is also active */}
            {loading && <div className="form-loading">Processing...</div>} {/* Generic loading message */}

            {renderForm()} {/* Render the appropriate form based on the step */}
        </div>
    );
};

export default ChangePassword;
