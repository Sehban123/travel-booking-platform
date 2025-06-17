import React, { useState } from 'react';
import './css/ServiceProviderLogin.css'; // Assuming you have this CSS file for styling
import { useNavigate } from 'react-router-dom'; // ONLY useNavigate is needed here
import axios from 'axios'; // Import axios for API calls

const API_URL = 'https://travel-booking-platform.onrender.com'; // Define API URL

// --- Static Options for Checkboxes/Dropdowns (kept for reference, not used in signup steps) ---
const ROOM_TYPES = ['Single', 'Double', 'Suite', 'Dormitory', 'Family Room', 'Deluxe', 'Standard'];
const ACCOMMODATION_FACILITIES = ['WiFi', 'Parking', 'Breakfast', 'AC', 'Pool', 'Room Service', 'Restaurant', 'Gym', 'Spa', 'Laundry', 'Conference Room'];
const VEHICLE_TYPES = ['Hatchback', 'Sedan', 'SUV', 'Tempo Traveler', 'Bus', 'Luxury Car', 'Motorcycle'];
const ADVENTURE_ACTIVITIES = ['Trekking', 'Paragliding', 'Scuba Diving', 'Zipline', 'Boating', 'Safari', 'Camping', 'River Rafting', 'Rock Climbing', 'Bungee Jumping'];


const ServiceProviderLoginPage = () => {
    // State to manage which form is currently active: 'login', 'signup'
    const [formType, setFormType] = useState('login');
    const [message, setMessage] = useState(''); // State to display messages to the user (success or error)
    const [loading, setLoading] = useState(false); // State to indicate loading/submission in progress

    // State for login form
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    // State for password visibility (only for login form now)
    const [showPassword, setShowPassword] = useState(false);

    // State for signup form (multi-step)
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4; // Total steps for the signup form

    const [signupData, setSignupData] = useState({
        businessName: '',
        ownerFullName: '',
        email: '',
        phoneNumber: '', // Used for phoneNumber in payload
        fullBusinessAddress: '',
        businessRegistrationNumber: '',
        whatsappNumber: '', // Optional
        state: '',
        city: '',
        pinCode: '',
        websiteSocialMediaLink: '', // Optional
        preferredModeOfContact: '',
        serviceType: '', // Accommodation, Transportation, Sport Adventure

        // Document uploads - will store File objects temporarily
        businessRegistrationCertificate: null,
        aadharPanCard: null,
        bankAccountDetails: null,
        gstNumber: null, // Optional
        servicePhotos: [], // Array of File objects for multiple photos

        declarationConsent: false,
        termsAccepted: false
    });

    const navigate = useNavigate();

    // --- Handlers for Toggling Forms ---
    const showLoginForm = () => {
        setFormType('login');
        setMessage(''); // Clear messages on form switch
        setLoginData({ email: '', password: '' }); // Reset login form
        setShowPassword(false); // Reset password visibility
    };

    const showSignupForm = () => {
        setFormType('signup');
        setMessage(''); // Clear messages on form switch
        setCurrentStep(1); // Reset to first step of signup form
        // Reset signup data to initial empty state
        setSignupData({
            businessName: '', ownerFullName: '', email: '', phoneNumber: '', fullBusinessAddress: '',

            businessRegistrationNumber: '', whatsappNumber: '',
            state: '', city: '', pinCode: '', websiteSocialMediaLink: '', preferredModeOfContact: '',
            serviceType: '',
            businessRegistrationCertificate: null, aadharPanCard: null, bankAccountDetails: null, gstNumber: null,
            servicePhotos: [],
            declarationConsent: false, termsAccepted: false
        });
    };

    // --- Login Form Handlers ---
    const handleLoginChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            console.log('Attempting Service Provider Login:', loginData);
            const response = await axios.post(`${API_URL}/api/provider/login`, loginData);
            console.log('Full Login response data:', response.data);

            const providerId = response.data.providerId;
            const serviceType = response.data.serviceType;

            if (providerId) {
                console.log('Extracted Provider ID for navigation:', providerId);
                console.log('Extracted Service Type for navigation:', serviceType);

                localStorage.setItem('providerId', providerId);
                localStorage.setItem('serviceType', serviceType);
                setMessage(response.data.message);

                if (response.data.paymentRequired) {
                    setMessage("Login successful, but payment is pending. Please complete your payment.");
                } else {
                    navigate(`/provider-dashboard/${providerId}`);
                }
            } else {
                console.error('Login successful, but provider ID or service type missing from response:', response.data);
                setMessage('Login successful, but could not determine dashboard. Please contact support.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage(error.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    // --- Signup Form Handlers ---
    const handleSignupChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        if (type === 'checkbox') {
            setSignupData(prevData => ({ ...prevData, [name]: checked }));
        } else if (type === 'file') {
            setSignupData(prevData => ({
                ...prevData,
                [name]: name === 'servicePhotos' ? Array.from(files) : files[0]
            }));
        } else {
            setSignupData(prevData => ({ ...prevData, [name]: value }));
        }
    };


    const handleNextStep = () => {
        setMessage(''); // Clear message at the start of next step attempt
        console.log(`Attempting to move from Step ${currentStep}`);

        // Basic validation before moving to next step
        if (currentStep === 1) {
            if (!signupData.businessName.trim() || !signupData.ownerFullName.trim() || !signupData.email.trim() || !signupData.phoneNumber.trim()) {
                setMessage('Please fill all required fields in Step 1: Business Name, Owner Full Name, Email, and Phone Number.');
                return;
            }
            if (!/\S+@\S+\.\S+/.test(signupData.email)) {
                setMessage('Please enter a valid email address.');
                return;
            }
            if (!/^\d{10}$/.test(signupData.phoneNumber.trim())) {
                setMessage('Please enter a valid 10-digit phone number.');
                return;
            }

        } else if (currentStep === 2) {
            if (!signupData.fullBusinessAddress.trim() || !signupData.state.trim() || !signupData.city.trim() || !signupData.pinCode.trim() || !signupData.serviceType || !signupData.preferredModeOfContact) {
                setMessage('Please fill all required fields in Step 2: Address, State, City, Pincode, Service Type, and Preferred Contact Mode.');
                return;
            }
            // Add more specific validations for address, state, city, pincode if needed
        } else if (currentStep === 3) {
            if (!signupData.businessRegistrationCertificate || !signupData.aadharPanCard || !signupData.bankAccountDetails) {
                setMessage('Please upload Business Registration Certificate, Aadhar/PAN Card, and Bank Account Details.');
                return;
            }
            if (signupData.servicePhotos.length < 1) {
                setMessage('Please upload at least 1 Service Photo.');
                return;
            }
        }
        // If all validation passes for the current step, proceed to the next
        setCurrentStep(prevStep => prevStep + 1);
        console.log(`Moved to Step ${currentStep + 1}`);
    };

    const handlePreviousStep = () => {
        setCurrentStep(prevStep => prevStep - 1);
        setMessage(''); // Clear message on step change
        console.log(`Moved back to Step ${currentStep - 1}`);
    };

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Final validation for the last step (Step 4)
        if (currentStep === totalSteps) {
            if (!signupData.declarationConsent || !signupData.termsAccepted) {
                setMessage('Please agree to the Declaration and Terms & Conditions.');
                setLoading(false);
                return;
            }
        } else {
            // This case should ideally not be hit if navigation buttons are used
            // but as a safeguard.
            setMessage('Please complete all steps before submitting.');
            setLoading(false);
            return;
        }

        try {
            const formData = new FormData();

            // Append all non-file, non-object fields directly
            formData.append('businessName', signupData.businessName);
            formData.append('ownerFullName', signupData.ownerFullName);
            formData.append('email', signupData.email);
            // Renamed 'phoneNumber' to 'phoneNumber' to match backend schema
            formData.append('phoneNumber', signupData.phoneNumber);
            formData.append('fullBusinessAddress', signupData.fullBusinessAddress);
            formData.append('businessRegistrationNumber', signupData.businessRegistrationNumber);
            formData.append('whatsappNumber', signupData.whatsappNumber);
            formData.append('state', signupData.state);
            formData.append('city', signupData.city);
            formData.append('pinCode', signupData.pinCode);
            formData.append('websiteSocialMediaLink', signupData.websiteSocialMediaLink);
            formData.append('preferredModeOfContact', signupData.preferredModeOfContact);
            formData.append('serviceType', signupData.serviceType);

            // Append file fields
            if (signupData.businessRegistrationCertificate) {
                formData.append('businessRegistrationCertificate', signupData.businessRegistrationCertificate);
            }
            if (signupData.aadharPanCard) {
                formData.append('aadharPanCard', signupData.aadharPanCard);
            }
            if (signupData.bankAccountDetails) {
                formData.append('bankAccountDetails', signupData.bankAccountDetails);
            }
            if (signupData.gstNumber) {
                formData.append('gstNumber', signupData.gstNumber);
            }
            // Append multiple service photos
            signupData.servicePhotos.forEach((file) => {
                formData.append('servicePhotos', file);
            });

            console.log('Sending signup data:', Object.fromEntries(formData.entries()));

            // CHANGE THE ENDPOINT HERE TO THE MULTER-ENABLED ONE
            const response = await axios.post(`${API_URL}/api/become-provider`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage(response.data.message);
            setFormType('login'); // Switch to login form after successful signup
            // Reset signup data
            setSignupData({
                businessName: '', ownerFullName: '', email: '', phoneNumber: '', address: '',
                businessRegistrationNumber: '', whatsappNumber: '',
                state: '', city: '', pinCode: '', websiteSocialMediaLink: '', preferredModeOfContact: '',
                serviceType: '',
                businessRegistrationCertificate: null, aadharPanCard: null, bankAccountDetails: null, gstNumber: null,
                servicePhotos: [],
                declarationConsent: false, termsAccepted: false
            });
            setCurrentStep(1); // Reset to first step
        } catch (error) {
            console.error('Signup error:', error);
            setMessage(error.response?.data?.error || 'Signup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper for password visibility toggle (only for login form)
    const togglePasswordVisibility = () => {
        setShowPassword(prevShowPassword => !prevShowPassword);
    };

    // This helper now only provides info, as service-specific details are post-approval
    const renderServiceDetailsFields = () => {
        if (signupData.serviceType) {
            return (
                <p className="info-message">Specific {signupData.serviceType} details (like room types, vehicle types, activities) will be configured in your dashboard after your application is approved.</p>
            );
        }
        return null;
    };


    return (
        <div className="page-wrapper">
            <div className="service-provider-login-container">
                {/* --- Form Switcher --- */}
                <div className="form-switcher">
                    <button
                        className={formType === 'login' ? 'active' : ''}
                        onClick={showLoginForm}
                        disabled={loading}
                    >
                        Login
                    </button>
                    <button
                        className={formType === 'signup' ? 'active' : ''}
                        onClick={showSignupForm}
                        disabled={loading}
                    >
                        Sign Up
                    </button>
                </div>

                <div className="form-area">
                    {formType === 'login' && (
                        <form onSubmit={handleLoginSubmit}>
                            <h2>Service Provider Login</h2>
                            <label htmlFor="login-email">Email:</label>
                            <input
                                type="email"
                                id="login-email"
                                placeholder="Your Email"
                                name="email"
                                value={loginData.email}
                                onChange={handleLoginChange}
                                required
                                autoComplete="email"
                                disabled={loading}
                            />
                            <label htmlFor="login-password">Password:</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="login-password"
                                    placeholder="Password"
                                    name="password"
                                    value={loginData.password}
                                    onChange={handleLoginChange}
                                    required
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
                                <span className="password-toggle-icon" onClick={togglePasswordVisibility}>
                                    {showPassword ? '👁️‍🗨️' : '👁️'}
                                </span>
                            </div>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Logging In...' : 'Login'}
                            </button>
                        </form>
                    )}

                    {formType === 'signup' && (
                        <form onSubmit={handleSignupSubmit} className="signup-form">
                            <h2>Service Provider Sign Up (Step {currentStep}/{totalSteps})</h2>

                            {/* Progress Bar/Indicators */}
                            <div className="progress-bar-container">
                                <div className="progress-line">
                                    <div className="progress-fill" style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}></div>
                                </div>
                                {Array.from({ length: totalSteps }).map((_, index) => (
                                    <div
                                        key={index}
                                        className={`step ${index + 1 < currentStep ? 'completed' : ''} ${index + 1 === currentStep ? 'active' : ''}`}
                                    >
                                        <span className="step-number">
                                            {index + 1 < currentStep ? '✔' : index + 1}
                                        </span>
                                        <span className="step-label">Step {index + 1}</span>
                                    </div>
                                ))}
                            </div>


                            {/* --- Step 1: Basic Information --- */}
                            {currentStep === 1 && (
                                <div className="form-step">
                                    <h3>Basic Information</h3>
                                    <label htmlFor="businessName">Business Name:</label>
                                    <input
                                        type="text"
                                        id="businessName"
                                        placeholder="Your Business Name"
                                        name="businessName"
                                        value={signupData.businessName}
                                        onChange={handleSignupChange}
                                        required
                                        disabled={loading}
                                    />
                                    <label htmlFor="ownerFullName">Owner Full Name:</label>
                                    <input
                                        type="text"
                                        id="ownerFullName"
                                        placeholder="Owner's Full Name"
                                        name="ownerFullName"
                                        value={signupData.ownerFullName}
                                        onChange={handleSignupChange}
                                        required
                                        disabled={loading}
                                    />
                                    <label htmlFor="email">Email:</label>
                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="Your Business Email"
                                        name="email"
                                        value={signupData.email}
                                        onChange={handleSignupChange}
                                        required
                                        autoComplete="new-email"
                                        disabled={loading}
                                    />
                                    <label htmlFor="phoneNumber">Phone Number:</label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={signupData.phoneNumber}
                                        onChange={handleSignupChange}
                                        placeholder="Enter your phone number"
                                        required
                                    />

                                </div>
                            )}

                            {/* --- Step 2: Business & Service Details --- */}
                            {currentStep === 2 && (
                                <div className="form-step">
                                    <h3>Business & Service Details</h3>
                                    <label htmlFor="fullBusinessAddress">Full Business Address:</label>
                                    <textarea
                                        id="fullBusinessAddress"
                                        placeholder="Street, Building, Area"
                                        name="fullBusinessAddress"
                                        value={signupData.fullBusinessAddress}
                                        onChange={handleSignupChange}
                                        required
                                        disabled={loading}
                                    />


                                    <label htmlFor="state">State:</label>
                                    <input
                                        type="text"
                                        id="state"
                                        placeholder="State"
                                        name="state"
                                        value={signupData.state}
                                        onChange={handleSignupChange}
                                        required
                                        disabled={loading}
                                    />
                                    <label htmlFor="city">City:</label>
                                    <input
                                        type="text"
                                        id="city"
                                        placeholder="City"
                                        name="city"
                                        value={signupData.city}
                                        onChange={handleSignupChange}
                                        required
                                        disabled={loading}
                                    />
                                    <label htmlFor="pinCode">Pincode:</label>
                                    <input
                                        type="text"
                                        id="pinCode"
                                        placeholder="Pincode"
                                        name="pinCode"
                                        value={signupData.pinCode}
                                        onChange={handleSignupChange}
                                        required
                                        disabled={loading}
                                    />

                                    <label htmlFor="businessRegistrationNumber">Business Registration Number (Optional):</label>
                                    <input
                                        type="text"
                                        id="businessRegistrationNumber"
                                        placeholder="Optional"
                                        name="businessRegistrationNumber"
                                        value={signupData.businessRegistrationNumber}
                                        onChange={handleSignupChange}
                                        disabled={loading}
                                    />

                                    <label htmlFor="whatsappNumber">WhatsApp Number (Optional):</label>
                                    <input
                                        type="tel"
                                        id="whatsappNumber"
                                        placeholder="Optional"
                                        name="whatsappNumber"
                                        value={signupData.whatsappNumber}
                                        onChange={handleSignupChange}
                                        disabled={loading}
                                    />

                                    <label htmlFor="websiteSocialMediaLink">Website/Social Media Link (Optional):</label>
                                    <input
                                        type="text"
                                        id="websiteSocialMediaLink"
                                        placeholder="Optional"
                                        name="websiteSocialMediaLink"
                                        value={signupData.websiteSocialMediaLink}
                                        onChange={handleSignupChange}
                                        disabled={loading}
                                    />

                                    <label htmlFor="serviceType">Service Type:</label>
                                    <select
                                        id="serviceType"
                                        name="serviceType"
                                        value={signupData.serviceType}
                                        onChange={handleSignupChange}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">Select Service Type</option>
                                        <option value="Accommodation">Accommodation</option>
                                        <option value="Transportation">Transportation</option>
                                        <option value="Sport Adventure">Sport Adventure</option>
                                    </select>

                                    <label htmlFor="preferredModeOfContact">Preferred Mode of Contact:</label>
                                    <select
                                        id="preferredModeOfContact"
                                        name="preferredModeOfContact"
                                        value={signupData.preferredModeOfContact}
                                        onChange={handleSignupChange}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">Select Preferred Mode</option>
                                        <option value="Phone">Phone</option>
                                        <option value="Email">Email</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                    </select>
                                    {renderServiceDetailsFields()}
                                </div>
                            )}

                            {/* --- Step 3: Document Uploads --- */}
                            {currentStep === 3 && (
                                <div className="form-step">
                                    <h3>Document Uploads</h3>
                                    <p className="info-message">Please upload clear scanned copies of the following documents. These are essential for verification.</p>

                                    <label htmlFor="aadharPanCard" className="file-upload-label">
                                        Aadhar Card / PAN Card (PDF/Image)*
                                        <input
                                            type="file"
                                            id="aadharPanCard"
                                            name="aadharPanCard"
                                            onChange={handleSignupChange}
                                            required
                                            disabled={loading}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        {signupData.aadharPanCard && <span className="file-name">{signupData.aadharPanCard.name}</span>}
                                    </label>

                                    <label htmlFor="businessRegistrationCertificate" className="file-upload-label">
                                        Business Registration Certificate (PDF/Image) (Optional)
                                        <input
                                            type="file"
                                            id="businessRegistrationCertificate"
                                            name="businessRegistrationCertificate"
                                            onChange={handleSignupChange}
                                            disabled={loading}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        {signupData.businessRegistrationCertificate && <span className="file-name">{signupData.businessRegistrationCertificate.name}</span>}
                                    </label>

                                    <label htmlFor="bankAccountDetails" className="file-upload-label">
                                        Bank Account Details (e.g., Canceled Cheque, Passbook First Page) (PDF/Image)*
                                        <input
                                            type="file"
                                            id="bankAccountDetails"
                                            name="bankAccountDetails"
                                            onChange={handleSignupChange}
                                            required
                                            disabled={loading}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        {signupData.bankAccountDetails && <span className="file-name">{signupData.bankAccountDetails.name}</span>}
                                    </label>

                                    <label htmlFor="gstNumber" className="file-upload-label">
                                        GST Number Certificate (Optional)
                                        <input
                                            type="file"
                                            id="gstNumber"
                                            name="gstNumber"
                                            onChange={handleSignupChange}
                                            disabled={loading}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        {signupData.gstNumber && <span className="file-name">{signupData.gstNumber.name}</span>}
                                    </label>

                                    <label htmlFor="servicePhotos" className="file-upload-label">
                                        Service Photos (Minimum 1, Maximum 5) (Images)*
                                        <input
                                            type="file"
                                            id="servicePhotos"
                                            name="servicePhotos"
                                            onChange={handleSignupChange}
                                            multiple // Allow multiple file selection
                                            required // Ensure at least one is uploaded
                                            disabled={loading}
                                            accept="image/*"
                                        />
                                        {signupData.servicePhotos.length > 0 && (
                                            <span className="file-name">
                                                {signupData.servicePhotos.map(file => file.name).join(', ')}
                                            </span>
                                        )}
                                    </label>
                                </div>
                            )}

                            {/* --- Step 4: Declaration and Terms --- */}
                            {currentStep === 4 && (
                                <div className="form-step">
                                    <h3>Declaration & Terms and Conditions</h3>
                                    <div className="declaration-consent">
                                        <input
                                            type="checkbox"
                                            id="declarationConsent"
                                            name="declarationConsent"
                                            checked={signupData.declarationConsent}
                                            onChange={handleSignupChange}
                                            required
                                            disabled={loading}
                                        />
                                        <label htmlFor="declarationConsent">
                                            I hereby declare that the information provided above is true and accurate to the best of my knowledge and belief.
                                        </label>
                                    </div>
                                    <div className="declaration-consent">
                                        <input
                                            type="checkbox"
                                            id="termsAccepted"
                                            name="termsAccepted"
                                            checked={signupData.termsAccepted}
                                            onChange={handleSignupChange}
                                            required
                                            disabled={loading}
                                        />
                                        <label htmlFor="termsAccepted">
                                            I agree to the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">Terms and Conditions</a> of service.
                                        </label>
                                    </div>
                                </div>
                            )}


                            {/* --- Navigation Buttons --- */}
                            <div className="form-navigation-buttons">
                                {currentStep > 1 && (
                                    <button type="button" onClick={handlePreviousStep} disabled={loading}>
                                        Previous
                                    </button>
                                )}
                                {currentStep < totalSteps ? (
                                    <button type="button" onClick={handleNextStep} disabled={loading}>
                                        Next
                                    </button>
                                ) : (
                                    <button type="submit" disabled={loading || !signupData.termsAccepted || !signupData.declarationConsent}>
                                        {loading ? 'Submitting Application...' : 'Submit Application'}
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* --- Message Display --- */}
                    {message && (
                        <div className={`message ${message.includes('failed') || message.includes('error') ? 'error' : 'success'}`}>
                            {message}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceProviderLoginPage;
