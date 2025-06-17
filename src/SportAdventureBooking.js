// src/components/SportAdventureBooking.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import axios from 'axios';
import './css/SportAdventureBooking.css'; // Make sure this CSS file exists

// Configure axios globally in App.js. Removed axios.defaults.withCredentials = true here.
const API_URL = 'https://travel-booking-backend.onrender.com/api'; // Ensure this matches your server's address

const SportAdventureBooking = () => {
    // activityId from useParams is the MongoDB _id of the SportAdventure document
    const { activityId } = useParams();
    const navigate = useNavigate(); // Hook for navigation

    // State for fetched adventure details (includes name and type)
    const [adventureDetails, setAdventureDetails] = useState(null);

    // State for booking form details
    const [bookingDetails, setBookingDetails] = useState({
        user_name: '', // Initialized to empty as no customer data to pre-fill
        user_mobile: '',
        user_email: '', // Initialized to empty as no customer data to pre-fill
        bookingDate: '', // Map to date_of_activity for backend
        participants: 1, // Map to total_participants for backend
        purposeOfTravel: 'leisure',
    });

    // State for individual participant details
    const [participantsInfo, setParticipantsInfo] = useState([
        { name: '', age: '' }
    ]);

    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(true); // Add loading state for fetch
    const [submitting, setSubmitting] = useState(false); // Add loading state for submission
    const [successMessage, setSuccessMessage] = useState(''); // Added state for success message

    // Removed isCustomerLoggedIn and customerData states. Authentication logic is entirely removed.


    // --- Effect to Fetch Adventure Details ---
    useEffect(() => {
        const fetchAdventure = async () => {
            setLoading(true);
            setErrorMessage('');
            setSuccessMessage('');
            setAdventureDetails(null);

            if (!activityId || activityId.length < 1) {
                console.log("Activity ID is missing or invalid:", activityId, "Skipping fetch.");
                setLoading(false);
                setErrorMessage('Invalid adventure ID provided.');
                return;
            }

            console.log("Attempting to fetch adventure details for ID:", activityId);
            try {
                const response = await axios.get(`http://localhost:5000/api/sports-adventures/${activityId}`);

                if (response.data) {
                    console.log("Fetched adventure data:", response.data);
                    setAdventureDetails(response.data);
                } else {
                    console.log("Fetch returned no data for ID:", activityId);
                    setAdventureDetails(null);
                    setErrorMessage('Adventure not found!');
                }
            } catch (error) {
                console.error('Error fetching adventure details:', error);
                setAdventureDetails(null);
                if (error.response && error.response.data && error.response.data.error) {
                    setErrorMessage(`Error loading details: ${error.response.data.error}`);
                } else {
                    setErrorMessage('Failed to load adventure details.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAdventure();
    }, [activityId]);


    // --- Update participantsInfo array when number of participants changes ---
    useEffect(() => {
        if (typeof bookingDetails.participants !== 'number' || bookingDetails.participants < 1) {
            setParticipantsInfo([]);
            return;
        }
        const count = bookingDetails.participants;
        setParticipantsInfo(prev => {
            // Create a new array based on the count, preserving existing data if available
            const updated = Array.from({ length: count }, (_, i) =>
                prev[i] || { name: '', age: '' }
            );
            return updated.slice(0, count); // Ensure it doesn't exceed the new count
        });
    }, [bookingDetails.participants]);


    // --- Handlers ---
    const handleBookingDetailsChange = (e) => {
        const { name, value } = e.target;
        setBookingDetails(prev => ({
            ...prev,
            [name]: name === 'participants' ? parseInt(value, 10) : value
        }));
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleParticipantInfoChange = (index, e) => {
        const { name, value } = e.target;
        const updated = [...participantsInfo];
        updated[index][name] = value;
        setParticipantsInfo(updated);

        if (name === 'age') setErrorMessage(''); // Clear age-related errors on change
        setSuccessMessage(''); // Clear success message on any participant info change
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setSubmitting(true);

        const { user_name, user_mobile, user_email, bookingDate, participants } = bookingDetails;

        // Basic client-side validation
        if (!user_name.trim() || !user_mobile.trim() || !user_email.trim() || !bookingDate || participants <= 0) {
            setErrorMessage("Please fill in all required contact details and specify at least 1 participant.");
            setSubmitting(false);
            return;
        }

        if (!adventureDetails) {
            setErrorMessage("Adventure details not loaded. Cannot submit booking.");
            setSubmitting(false);
            return;
        }

        // Validate mobile number format
        const mobileRegex = /^\d{10}$/;
        if (!mobileRegex.test(user_mobile.trim())) {
            setErrorMessage("Please enter a valid 10-digit mobile number.");
            setSubmitting(false);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(user_email.trim())) {
            setErrorMessage("Please enter a valid email address.");
            setSubmitting(false);
            return;
        }

        // Ensure participant details match the count
        if (participantsInfo.length !== participants) {
            setErrorMessage("Mismatch between number of participants specified and participant details provided. Please fill out all participant details.");
            console.error("Participants count mismatch:", participants, participantsInfo.length);
            setSubmitting(false);
            return;
        }

        // Validate individual participant details
        for (let i = 0; i < participantsInfo.length; i++) {
            const participant = participantsInfo[i];
            const age = parseInt(participant.age, 10);

            if (!participant.name.trim()) {
                setErrorMessage(`Participant ${i + 1} name is required.`);
                setSubmitting(false);
                return;
            }

            if (isNaN(age) || age <= 0) {
                setErrorMessage(`Participant ${i + 1} age is required and must be a positive number.`);
                setSubmitting(false);
                return;
            }

            // Check against adventure's minimum age if provided
            if (adventureDetails.minimumAge !== undefined && age < adventureDetails.minimumAge) {
                setErrorMessage(
                    `Participant "${participant.name}" (Age ${age}) does not meet the minimum age requirement of ${adventureDetails.minimumAge} years.`
                );
                setSubmitting(false);
                return;
            }
        }

        // Validate adventure price
        if (typeof adventureDetails.price !== 'number' || adventureDetails.price < 0) {
            setErrorMessage("Adventure price is invalid. Cannot book.");
            console.error("Invalid adventure price:", adventureDetails.price);
            setSubmitting(false);
            return;
        }

        // Calculate total price
        const totalCalculatedPrice = adventureDetails.price * participants;
        if (totalCalculatedPrice <= 0) {
            setErrorMessage("Total price is zero or negative. Cannot book.");
            console.error("Calculated total price is zero:", totalCalculatedPrice);
            setSubmitting(false);
            return;
        }


        const bookingPayload = {
            sportAdventureId: adventureDetails._id,
            sportAdventureName: adventureDetails.name, // Ensure name is passed
            user_name: user_name,
            user_mobile: user_mobile,
            user_email: user_email,
            date_of_activity: bookingDate,
            total_participants: participants,
            total_price: totalCalculatedPrice,
            participantsDetails: participantsInfo,
            purposeOfTravel: bookingDetails.purposeOfTravel // Ensure purposeOfTravel is included
        };

        console.log("Booking payload being sent:", bookingPayload);

        try {
            // Using a relative path for the API endpoint if the frontend and backend are on the same domain/port
            // Or use the full API_URL from top of the file
            const response = await axios.post(`${API_URL}/api/sport-adventure-bookings`, bookingPayload);

            if (response.data && response.data.message) {
                setSuccessMessage("Booking request sent successfully! You will receive an email regarding approval or rejection.");
                setErrorMessage('');
                // Reset form fields after successful submission
                setBookingDetails({
                    user_name: '', // Reset to empty
                    user_mobile: '',
                    user_email: '', // Reset to empty
                    bookingDate: '',
                    participants: 1,
                    purposeOfTravel: 'leisure',
                });
                setParticipantsInfo([{ name: '', age: '' }]); // Reset participant details
            } else {
                setErrorMessage('Booking failed. Unexpected server response.');
                setSuccessMessage('');
            }
        } catch (error) {
            console.error('Sport adventure booking submission error:', error);
            if (error.response && error.response.data && error.response.data.details) {
                setErrorMessage(`Booking failed: ${error.response.data.details}`);
            } else {
                setErrorMessage('Failed to submit booking. Please try again.');
            }
            setSuccessMessage('');
        } finally {
            setSubmitting(false);
        }
    };


    // --- Render Logic ---
    if (loading) {
        return <div className="loading-message">Loading adventure details...</div>;
    }

    // Removed authentication redirect logic for a no-auth setup.
    // If errorMessage exists AND no adventureDetails (meaning fetch failed), show error.
    if (errorMessage && !adventureDetails) {
        return <div className="error-message">{errorMessage}</div>;
    }

    // If no adventure details and no error, show a general info message.
    if (!adventureDetails) {
        return <div className="info-message">Adventure not found.</div>;
    }

    return (
        <div className="sportBookingContainer">
            <h2>Book Your Adventure: {adventureDetails.name}</h2>

            {/* ROW 1: Image and Accommodation Details */}
            <div className="sportDetailsSection">
                <div className="sportImageContainer"> {/* Added container for image */}
                    <img
                        className="sport-booking-image"
                        src={adventureDetails.image ? `${API_URL}/images/${adventureDetails.image}` : 'https://placehold.co/400x300?text=Image+Not+Available'}
                        alt={adventureDetails.name}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Image+Not+Available'; }}
                    />
                </div>
                <div className="sportTextDetails"> {/* Renamed from sportText for consistency with AccommodationBooking */}
                    <h3>Details:</h3>
                    <p><strong>Type:</strong> {adventureDetails.type || 'N/A'}</p>
                    <p><strong>Description:</strong> {adventureDetails.description || 'N/A'}</p>
                    <p><strong>Location:</strong> {adventureDetails.location || 'N/A'}</p>
                    <p><strong>Price per person:</strong> ₹{adventureDetails.price?.toLocaleString('en-IN') || 'N/A'}</p>
                    <p><strong>Rating:</strong> {adventureDetails.rating || 'N/A'}</p>
                    <p><strong>Minimum Age:</strong> {adventureDetails.minimumAge !== undefined ? adventureDetails.minimumAge : 'N/A'}</p>
                    {adventureDetails.features && adventureDetails.features.length > 0 && (
                         <p>
                             <strong>Features:</strong>{" "}
                             {Array.isArray(adventureDetails.features) ? adventureDetails.features.join(', ') : adventureDetails.features}
                         </p>
                    )}
                    {adventureDetails.termsAndConditions && (
                        <div className="termsAndConditionsSection">
                            <p><strong>Terms and Conditions:</strong></p>
                            {/* Assuming termsAndConditions can be a string or array, split if string */}
                            {Array.isArray(adventureDetails.termsAndConditions)
                                ? <ul>{adventureDetails.termsAndConditions.map((term, index) => <li key={index}>{term}</li>)}</ul>
                                : <p className="term-sentence">{adventureDetails.termsAndConditions}</p>
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* FORM SECTION */}
            <div className="sportbookingFormContainer full-width-section"> {/* Added full-width-section class */}
                <h3>Booking Information:</h3>
                <form onSubmit={handleBookingSubmit} className="sport-booking-form">
                    <div className="form-group">
                        <label htmlFor="user_name">Your Name:</label>
                        <input
                            type="text"
                            id="user_name"
                            name="user_name"
                            value={bookingDetails.user_name}
                            onChange={handleBookingDetailsChange}
                            required
                            disabled={submitting} // Disable during submission only
                            autoComplete="name"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="user_mobile">Your Mobile:</label>
                        <input
                            type="tel"
                            id="user_mobile"
                            name="user_mobile"
                            value={bookingDetails.user_mobile}
                            onChange={handleBookingDetailsChange}
                            pattern="^\d{10}$"
                            title="Enter a valid 10-digit mobile number"
                            required
                            disabled={submitting} // Disable during submission only
                            autoComplete="tel"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="user_email">Your Email:</label>
                        <input
                            type="email"
                            id="user_email"
                            name="user_email"
                            value={bookingDetails.user_email}
                            onChange={handleBookingDetailsChange}
                            required
                            disabled={submitting} // Disable during submission only
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="bookingDate">Booking Date:</label>
                        <input
                            type="date"
                            id="bookingDate"
                            name="bookingDate"
                            value={bookingDetails.bookingDate}
                            onChange={handleBookingDetailsChange}
                            required
                            disabled={submitting} // Disable during submission only
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="participants">Number of Participants:</label>
                        <input
                            type="number"
                            id="participants"
                            name="participants"
                            min="1"
                            value={bookingDetails.participants}
                            onChange={handleBookingDetailsChange}
                            required
                            disabled={submitting} // Disable during submission only
                        />
                    </div>

                    {adventureDetails?.price > 0 && bookingDetails.participants > 0 && (
                        <div className="form-group">
                            <label>Calculated Total Price:</label>
                            <input
                                type="text"
                                value={`₹${(adventureDetails.price * bookingDetails.participants)?.toLocaleString('en-IN')}`}
                                readOnly
                                disabled
                                className="calculated-price-input"
                            />
                        </div>
                    )}
                    {/* Purpose of Travel is a static field, can be removed if not needed */}
                    {/*
                    <div className="form-group">
                        <label htmlFor="purposeOfTravel">Purpose of Travel:</label>
                        <select
                            id="purposeOfTravel"
                            name="purposeOfTravel"
                            value={bookingDetails.purposeOfTravel}
                            onChange={handleBookingDetailsChange}
                            disabled={submitting}
                        >
                            <option value="leisure">Leisure</option>
                            <option value="business">Business</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    */}

                    {bookingDetails.participants > 0 && (
                        <div className="participant-details-section"> {/* Added a wrapper for participant details */}
                            <h3>Participant Details</h3>
                            {participantsInfo.map((participant, index) => (
                                <div key={index} className="participant-form-group"> {/* Changed class from participantForm */}
                                    <h4>Participant {index + 1}</h4>
                                    <div className="form-group">
                                        <label htmlFor={`participant-name-${index}`}>Name:</label>
                                        <input
                                            type="text"
                                            id={`participant-name-${index}`}
                                            name="name"
                                            value={participant.name}
                                            onChange={(e) => handleParticipantInfoChange(index, e)}
                                            required
                                            disabled={submitting}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor={`participant-age-${index}`}>Age:</label>
                                        <input
                                            type="number"
                                            id={`participant-age-${index}`}
                                            name="age"
                                            value={participant.age}
                                            onChange={(e) => handleParticipantInfoChange(index, e)}
                                            required
                                            min="1"
                                            disabled={submitting}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <button type="submit" className="submitButton" disabled={loading || submitting || !adventureDetails || bookingDetails.participants <= 0 || (adventureDetails.price * bookingDetails.participants) <= 0}>
                        {submitting ? 'Booking...' : 'Confirm Booking'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SportAdventureBooking;
