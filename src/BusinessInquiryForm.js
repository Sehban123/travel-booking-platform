// src/components/BusinessInquiryForm.js
import React, { useState } from 'react';
import axios from 'axios';
import './css/BusinessInquiryForm.css'; // Make sure this CSS file exists
import BusinessInquirySummary from './BusinessInquirySummary'; // Import the new summary component

const eventTypes = [
    'Marketing Event', 'Company Meeting', 'Recreation/Team Outing',
    'Conference', 'Open Event', 'Exhibition', 'Training', 'Other'
];

const services = [
    'Travel (Flights, Train)', 'Accommodation', 'Taxi/Local Transport',
    'Food/Catering', 'Sightseeing', 'Conference Hall Booking',
    'Community Hall Booking', 'Open Ground Booking', 'Event Resource Procurement'
];

const BusinessInquiryForm = () => {
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        contactMobile: '',
        contactEmail: '',
        eventType: '',
        eventDate: '', // Store as string (YYYY-MM-DD)
        numAttendees: 1,
        servicesNeeded: [], // Array of selected services
        // --- ADDED Location Field ---
        location: '', // New state for location
        details: ''
    });

    const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const [submittedData, setSubmittedData] = useState(null); // State to hold data after successful submission

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setErrorMessage(''); // Clear error on input
        setSubmitStatus('idle'); // Reset status
    };

    const handleServiceChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const updatedServices = checked
                ? [...prev.servicesNeeded, value] // Add service
                : prev.servicesNeeded.filter(service => service !== value); // Remove service
            return {
                ...prev,
                servicesNeeded: updatedServices
            };
        });
        setErrorMessage(''); // Clear error on input
        setSubmitStatus('idle'); // Reset status
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitStatus('loading');
        setErrorMessage('');

        // Basic Frontend Validation
        if (!formData.companyName || !formData.contactName || !formData.contactMobile || !formData.location) { // Added location to required fields
            setErrorMessage('Please fill in Company Name, Contact Name, Mobile, and Location.');
            setSubmitStatus('error');
            return;
        }

        if (formData.numAttendees < 1) {
            setErrorMessage('Number of attendees must be at least 1.');
            setSubmitStatus('error');
            return;
        }


        try {
            // The backend schema doesn't have a dedicated 'location' field,
            // but we can send it as part of the general details or if you
            // update the backend schema to include it. For now, we'll just
            // send the existing formData as is. The backend will ignore
            // the 'location' field unless you add it to the schema.
            // The filtering based on location will happen on the frontend summary page.
            const response = await axios.post('https://travel-booking-backend.onrender.com/api/business-inquiries', formData);

            if (response.data && response.data.message) {
                setSubmitStatus('success');
                setErrorMessage(''); // Clear errors on success

                // --- Store submitted data and switch to summary view ---
                // Pass the entire formData including the location to the summary component
                setSubmittedData(formData);
                // Reset form fields after successful submission if desired
                 setFormData({
                     companyName: '',
                     contactName: '',
                     contactMobile: '',
                     contactEmail: '',
                     eventType: '',
                     eventDate: '',
                     numAttendees: 1,
                     servicesNeeded: [],
                     location: '', // Reset location field
                     details: ''
                 });
                // No alert here, the summary component will show success message
            } else {
                setSubmitStatus('error');
                setErrorMessage('Inquiry submission failed. Unexpected response.');
            }

        } catch (error) {
            console.error('Business inquiry submission error:', error);
            setSubmitStatus('error');
            if (error.response && error.response.data && error.response.data.details) {
                setErrorMessage(`Submission failed: ${error.response.data.details}`);
            } else {
                setErrorMessage('Failed to submit inquiry. Please try again.');
            }
        }
    };

    // --- Render Summary Component if submittedData is available ---
    if (submittedData) {
        // Pass the submittedData (which now includes location) to the summary component
        return <BusinessInquirySummary inquiryData={submittedData} onBackToForm={() => setSubmittedData(null)} />;
    }

    // --- Render Form if submittedData is null ---
    return (
        <div className="business-inquiry-container">
            <h2>Submit Your Business Travel Inquiry</h2>
            <p>Please provide details about your corporate event or executive travel needs.</p>

            <form onSubmit={handleSubmit} className="business-inquiry-form">
                <div className="form-group">
                    <label htmlFor="companyName">Company Name:</label>
                    <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="contactName">Contact Person Name:</label>
                    <input
                        type="text"
                        id="contactName"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="contactMobile">Contact Mobile:</label>
                    <input
                        type="tel" // Use tel for mobile numbers
                        id="contactMobile"
                        name="contactMobile"
                        value={formData.contactMobile}
                        onChange={handleInputChange}
                        pattern="^\d{10}$" // Example pattern for 10 digits
                        title="Enter a valid 10-digit mobile number"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="contactEmail">Contact Email:</label>
                    <input
                        type="email"
                        id="contactEmail"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleInputChange}
                    />
                </div>

                {/* --- ADDED Location Input Field --- */}
                <div className="form-group">
                    <label htmlFor="location">Preferred Location/City:</label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        required // Making location required
                    />
                </div>


                <div className="form-group">
                    <label htmlFor="eventType">Type of Event/Travel:</label>
                    <select
                        id="eventType"
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">Select event type</option>
                        {eventTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="eventDate">Preferred Event/Travel Date:</label>
                    <input
                        type="date"
                        id="eventDate"
                        name="eventDate"
                        value={formData.eventDate}
                        onChange={handleInputChange}
                        // required // Making date required might limit flexibility, depends on use case
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="numAttendees">Approximate Number of Attendees:</label>
                    <input
                        type="number"
                        id="numAttendees"
                        name="numAttendees"
                        value={formData.numAttendees}
                        onChange={handleInputChange}
                        min="1"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Services Needed:</label>
                    <div className="services-checkboxes">
                        {services.map(service => (
                            <div key={service} className="checkbox-item">
                                <input
                                    type="checkbox"
                                    id={`service-${service}`}
                                    value={service}
                                    checked={formData.servicesNeeded.includes(service)}
                                    onChange={handleServiceChange}
                                />
                                <label htmlFor={`service-${service}`}>{service}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="details">Additional Details/Requirements:</label>
                    <textarea
                        id="details"
                        name="details"
                        value={formData.details}
                        onChange={handleInputChange}
                        rows="4"
                    ></textarea>
                </div>

                {errorMessage && <p className="error-message">{errorMessage}</p>}
                {/* Success message moved to summary component */}

                <button type="submit" disabled={submitStatus === 'loading'}>
                    {submitStatus === 'loading' ? 'Submitting...' : 'Submit Inquiry'}
                </button>
            </form>
        </div>
    );
};

export default BusinessInquiryForm;
