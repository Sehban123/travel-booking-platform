// src/components/TransportationBooking.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/TransportationBooking.css'; // Make sure this CSS file exists

// Define API URL (base URL of your server) - Make sure this matches your server's address
const API_URL = 'https://travel-booking-backend.onrender.com'; // Changed to base URL

// Configure axios globally in App.js. Removed axios.defaults.withCredentials = true here.

const TransportationBooking = () => {
    // Get the transportId from the URL parameters
    const { transportId } = useParams();
    const navigate = useNavigate(); // Hook for navigation

    const [transportDetails, setTransportDetails] = useState(null);
    const [bookingDetails, setBookingDetails] = useState({
        user_name: '', // Initialize as empty string (no pre-filled customer data)
        user_mobile: '',
        user_email: '', // Initialize as empty string (no pre-filled customer data)
        date_of_travel: '',
        total_passengers: 1,
        total_price: 0, // Initialize total_price
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Removed states for isCustomerLoggedIn and customerData as authentication is removed.


    // --- Effect to Fetch Transportation Details ---
    useEffect(() => {
        const fetchTransportation = async () => {
            setLoading(true);
            setError('');
            setSuccessMessage('');
            setTransportDetails(null);

            if (!transportId) {
                setLoading(false);
                setError('No Transportation ID provided in the URL.');
                return;
            }

            try {
                const res = await axios.get(`${API_URL}/api/transportation/${transportId}`);
                setTransportDetails(res.data);
                setError(''); // Clear any previous error on successful fetch
            } catch (err) {
                console.error("Error fetching transportation details:", err);
                setError('Transportation not found or failed to load details.');
                setTransportDetails(null);
            } finally {
                setLoading(false);
            }
        };

        fetchTransportation();
    }, [transportId]);


    // Effect to calculate total price when passengers or transport details change
    useEffect(() => {
        if (transportDetails && bookingDetails.total_passengers > 0) {
            const pricePerDay = parseFloat(transportDetails.price_per_day);
            if (!isNaN(pricePerDay)) {
                 const calculatedPrice = pricePerDay * parseInt(bookingDetails.total_passengers, 10);
                 setBookingDetails(prev => ({
                     ...prev,
                     total_price: calculatedPrice
                 }));
            } else {
                 console.error("Invalid price_per_day received:", transportDetails.price_per_day);
                 setBookingDetails(prev => ({
                     ...prev,
                     total_price: 0
                 }));
            }
        } else {
            setBookingDetails(prev => ({
                ...prev,
                total_price: 0
            }));
        }
    }, [bookingDetails.total_passengers, transportDetails]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
        setSuccessMessage('');
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccessMessage('');

        const { date_of_travel, total_passengers, user_name, user_mobile, user_email } = bookingDetails;

        // Basic client-side validation
        if (!date_of_travel || !user_name.trim() || !user_mobile.trim() || !user_email.trim() || total_passengers < 1) {
            setError("Please fill all required fields (Name, Mobile, Email, Date, Passengers) and ensure passenger count is at least 1.");
            setSubmitting(false);
            return;
        }

        // Validate mobile number format
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(user_mobile.trim())) {
            setError("Please enter a valid 10-digit mobile number.");
            setSubmitting(false);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user_email.trim())) {
            setError("Please enter a valid email address.");
            setSubmitting(false);
            return;
        }

        const pricePerDay = parseFloat(transportDetails?.price_per_day);
        const calculated_total_price = !isNaN(pricePerDay) ? pricePerDay * parseInt(total_passengers, 10) : 0;


        if (calculated_total_price <= 0) {
            setError("Cannot book with zero price. Check price per day and passengers.");
            setSubmitting(false);
            return;
        }

        const payload = {
            transportationId: transportDetails?._id,
            transportationName: transportDetails?.model || transportDetails?.transport_type || 'Unknown Transportation',
            user_name: user_name.trim(),
            user_mobile: user_mobile.trim(),
            user_email: user_email.trim(),
            date_of_travel,
            total_passengers,
            total_price: calculated_total_price,
            // Removed purposeOfTravel field if it's no longer relevant or collected
        };

        console.log("Transportation booking payload being sent:", payload);

        try {
            const response = await axios.post(`${API_URL}/api/transportation-bookings`, payload);
            console.log("Transportation booking successful:", response.data);

            setSuccessMessage("Booking request sent successfully! You will receive an email regarding approval or rejection.");
            setError('');

            // Reset form fields after successful submission
            setBookingDetails({
                user_name: '', // Reset to empty
                user_mobile: '',
                user_email: '', // Reset to empty
                date_of_travel: '',
                total_passengers: 1,
                total_price: 0, // Reset total price
            });

        } catch (err) {
            console.error("Transportation booking submission error:", err);
            if (err.response && err.response.data && err.response.data.error) {
                setError(`Booking failed: ${err.response.data.error}`);
            } else {
                setError("Booking failed. An unexpected error occurred.");
            }
            setSuccessMessage('');
        } finally {
            setSubmitting(false);
        }
    };


    // --- Render Logic ---
    if (loading) {
        return <div className="transportationBookingContainer loading-message">Loading transportation details...</div>;
    }

    // If error exists AND transportDetails is null (meaning initial fetch failed), show error.
    if (error && !transportDetails) {
        return <div className="transportationBookingContainer error-message">{error}</div>;
    }

    if (!transportDetails) {
        return <div className="transportationBookingContainer info-message">Transportation details not available.</div>;
    }

    return (
        <div className="transportationBookingContainer">
            <h2>Book Your Ride with {transportDetails.model || transportDetails.transport_type || 'Selected Transportation'}</h2>

            {/* ROW 1: Image and Transportation Details */}
            <div className="transportDetailsSection">
                <div className="transportationImageContainer"> {/* Added container for image to control its width */}
                    {transportDetails.image && (
                         <img
                             src={`${API_URL}/images/${transportDetails.image}`}
                             alt={`Image of ${transportDetails.model || transportDetails.transport_type || 'Transportation'}`}
                             className="transportationImage"
                             onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Image+Not+Available'; }}
                         />
                    )}
                    {!transportDetails.image && (
                         <div className="transportationImagePlaceholder">No Image Available</div>
                    )}
                </div>

                <div className="transportTextDetails"> {/* Renamed from transportText for consistency */}
                     <h3>Details:</h3>
                    <p><strong>Driver:</strong> {transportDetails.driver_name || 'N/A'}</p>
                    <p><strong>Transport Type:</strong> {transportDetails.transport_type || 'N/A'}</p>
                    <p><strong>Model:</strong> {transportDetails.model || 'N/A'}</p>
                    <p><strong>Price per Day:</strong> ₹{parseFloat(transportDetails.price_per_day)?.toLocaleString('en-IN') || 'N/A'}</p>
                    <p><strong>Features:</strong> {transportDetails.features?.join(', ') || 'N/A'}</p>
                    <p><strong>Rating:</strong> {transportDetails.rating || 'N/A'}</p> {/* Display rating */}


                     <div className="termsAndConditionsSection">
                        <p><strong>Terms and Conditions:</strong></p>
                        {transportDetails.termsAndConditions
                            ? (typeof transportDetails.termsAndConditions === 'string'
                                ? transportDetails.termsAndConditions.split('.').map((sentence, index) => sentence.trim() ? <p key={index} className="term-sentence">{sentence.trim()}.</p> : null)
                                : <p className="term-sentence">{JSON.stringify(transportDetails.termsAndConditions)}</p>
                              )
                            : <p className="term-sentence">N/A</p>
                        }
                     </div>
                </div>
            </div>

            {/* FORM SECTION */}
            <div className="transport-bookingFormContainer full-width-section"> {/* Added full-width-section class */}
                 <h3>Booking Information:</h3>
                <form onSubmit={handleBookingSubmit} className="transport-bookingForm">
                    <div className="form-group">
                        <label htmlFor="user_name">Name:</label>
                        <input type="text" id="user_name" name="user_name" value={bookingDetails.user_name} onChange={handleChange} required disabled={submitting} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="user_mobile">Mobile:</label>
                        <input type="tel" id="user_mobile" name="user_mobile" value={bookingDetails.user_mobile} onChange={handleChange} required disabled={submitting} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="user_email">Email:</label>
                        <input type="email" id="user_email" name="user_email" value={bookingDetails.user_email} onChange={handleChange} required disabled={submitting} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="date_of_travel">Date of Travel:</label>
                        <input type="date" id="date_of_travel" name="date_of_travel" value={bookingDetails.date_of_travel} onChange={handleChange} required disabled={submitting} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="total_passengers">Total Passengers:</label>
                        <input type="number" id="total_passengers" name="total_passengers" value={bookingDetails.total_passengers} onChange={handleChange} min="1" required disabled={submitting} />
                    </div>

                    {transportDetails?.price_per_day > 0 && bookingDetails.total_passengers > 0 && bookingDetails.total_price > 0 && (
                        <div className="form-group">
                            <label>Calculated Price:</label>
                            <input type="text" value={`₹${bookingDetails.total_price?.toLocaleString('en-IN')}`} readOnly disabled className="calculated-price-input"/>
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}
                    {successMessage && <div className="success-message">{successMessage}</div>}

                    <button type="submit" className="transport-bookButton" disabled={submitting || !transportDetails || bookingDetails.total_passengers < 1 || !bookingDetails.date_of_travel || bookingDetails.total_price <= 0}>
                        {submitting ? 'Booking...' : 'Confirm Booking'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TransportationBooking;
