import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './css/AccommodationBooking.css'; // Import the CSS file
import axios from 'axios';

// Define API URL (base URL of your server)
const API_URL = "https://travel-booking-platform.onrender.com"; // Ensure this matches your server's address

// Removed ALL_ROOM_TYPES as it will now be dynamic

const AccommodationBooking = () => {
    // Get the accommodationId from the URL parameters
    const { accommodationId } = useParams();
    const navigate = useNavigate(); // Hook for navigation

    // State for fetched accommodation details (including all rooms)
    const [accommodationDetails, setAccommodationDetails] = useState(null);
    // State for the currently selected room for booking
    const [selectedRoom, setSelectedRoom] = useState(null);

    // State for booking form details - Initialize with empty strings as no pre-filled customer data
    const [bookingDetails, setBookingDetails] = useState({
        user_name: '',
        user_mobile: '',
        user_email: '',
        check_in_date: '',
        check_out_date: '',
        total_guests: 1, // Default to 1 guest
        // duration and total_price will be calculated
        // roomId, roomNumber, roomType, pricePerNight will be derived from selectedRoom
    });

    // State for UI control and messages
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(true); // Loading state for initial fetch
    const [submitting, setSubmitting] = useState(false); // State for booking submission

    // State for parsed nearby locations
    const [parsedNearbyLocations, setParsedNearbyLocations] = useState([]);

    // --- NEW STATE FOR ROOM-SPECIFIC FILTERS ---
    const [filteredRooms, setFilteredRooms] = useState([]); // Rooms visible after applying filters
    const [roomFilterType, setRoomFilterType] = useState('');
    const [roomFilterMinBeds, setRoomFilterMinBeds] = useState('');
    // Removed roomFilterMinPrice
    const [roomFilterMaxPrice, setRoomFilterMaxPrice] = useState('');
    const [availableRoomTypesForFilter, setAvailableRoomTypesForFilter] = useState([]); // Stores unique room types for this accommodation


    // --- Effect to Fetch Accommodation Details ---
    useEffect(() => {
        const fetchAccommodation = async () => {
            setLoading(true);
            setError('');
            setSuccessMessage('');
            setAccommodationDetails(null);
            setSelectedRoom(null); // Reset selected room on new fetch
            setRoomFilterType(''); // Reset room filters on new accommodation load
            setRoomFilterMinBeds('');
            // Removed roomFilterMinPrice reset
            setRoomFilterMaxPrice('');
            setAvailableRoomTypesForFilter([]); // Reset available room types

            if (accommodationId) {
                try {
                    const res = await axios.get(`${API_URL}/api/accommodations/${accommodationId}`);
                    setAccommodationDetails(res.data);
                    console.log("Fetched accommodation details:", res.data);

                    // Dynamically get unique room types from fetched rooms
                    if (res.data?.rooms) {
                        const uniqueTypes = [...new Set(res.data.rooms.map(room => room.roomType))];
                        setAvailableRoomTypesForFilter(uniqueTypes);
                    } else {
                        setAvailableRoomTypesForFilter([]);
                    }

                    // Parse nearbyLocations if available
                    if (res.data?.nearbyLocations) {
                        const locationsArray = res.data.nearbyLocations.split(',').map(loc => {
                            const parts = loc.trim().match(/^(.*?) \((.*?)\)$/);
                            if (parts) {
                                return { name: parts[1].trim(), distance: parts[2] };
                            }
                            return { name: loc.trim(), distance: '' };
                        });
                        setParsedNearbyLocations(locationsArray);
                    } else {
                        setParsedNearbyLocations([]);
                    }
                } catch (err) {
                    console.error("Error fetching accommodation details:", err);
                    setError('Accommodation not found or failed to load details.');
                    setAccommodationDetails(null); // Ensure details are null on error
                    setSelectedRoom(null); // Ensure selected room is null on error
                } finally {
                    setLoading(false);
                }
            } else {
                setError("Accommodation ID is missing.");
                setLoading(false);
            }
        };

        fetchAccommodation();
    }, [accommodationId]); // Dependencies for this effect

    // --- EFFECT: Filter rooms based on user criteria ---
    useEffect(() => {
        if (accommodationDetails && accommodationDetails.rooms) {
            let currentRooms = accommodationDetails.rooms;

            // Apply Room Type Filter
            if (roomFilterType) {
                currentRooms = currentRooms.filter(room => room.roomType === roomFilterType);
            }

            // Apply Min Beds Filter
            if (roomFilterMinBeds !== '') {
                currentRooms = currentRooms.filter(room => room.numberOfBeds >= parseInt(roomFilterMinBeds));
            }

            // Removed Min Price Filter
            // if (roomFilterMinPrice !== '') {
            //     currentRooms = currentRooms.filter(room => room.pricePerNight >= parseFloat(roomFilterMinPrice));
            // }

            // Apply Max Price Filter
            if (roomFilterMaxPrice !== '') {
                currentRooms = currentRooms.filter(room => room.pricePerNight <= parseFloat(roomFilterMaxPrice));
            }

            setFilteredRooms(currentRooms);

            // Automatically select the first filtered room, or clear selection if no rooms match
            if (currentRooms.length > 0) {
                // If the previously selected room is still in the filtered list, keep it.
                // Otherwise, select the first one in the filtered list.
                const isSelectedRoomStillValid = selectedRoom && currentRooms.some(r => r._id === selectedRoom._id);
                if (!isSelectedRoomStillValid) {
                    setSelectedRoom(currentRooms[0]);
                }
            } else {
                setSelectedRoom(null); // No rooms match filters
                setError('No rooms found matching your current filter criteria.');
            }
        }
    }, [accommodationDetails, roomFilterType, roomFilterMinBeds, roomFilterMaxPrice]); // Updated dependencies

    // --- Effect to Calculate Duration and Total Price based on SELECTED ROOM ---
    useEffect(() => {
        if (selectedRoom && bookingDetails.check_in_date && bookingDetails.check_out_date) {
            const start = new Date(bookingDetails.check_in_date);
            const end = new Date(bookingDetails.check_out_date);

            // Ensure check-out is after check-in
            if (start >= end) {
                 setBookingDetails(prev => ({ ...prev, duration: 0, total_price: 0 }));
                 setError("Check-out date must be after check-in date.");
                 return;
            }

            const timeDiff = end - start;
            const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            const pricePerNight = selectedRoom.pricePerNight; // Use selected room's price
            const calculatedPrice = (days > 0 && typeof pricePerNight === 'number' && !isNaN(pricePerNight)) ? days * pricePerNight : 0;

            setBookingDetails((prev) => ({
                ...prev,
                duration: days > 0 ? days : 0,
                total_price: calculatedPrice,
            }));
            setError(''); // Clear error if dates are now valid
        } else {
            // Reset duration and price if dates or selected room are not set
            setBookingDetails((prev) => ({
                ...prev,
                duration: 0,
                total_price: 0,
            }));
            // Only clear error if dates are actually missing, not just on initial load
            if (!bookingDetails.check_in_date || !bookingDetails.check_out_date) {
                 setError('');
            }
        }
    }, [bookingDetails.check_in_date, bookingDetails.check_out_date, selectedRoom]); // Dependency on selectedRoom

    // Handle changes in form input fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookingDetails((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
        setSuccessMessage('');
    };

    // Handle change of selected room
    const handleRoomSelectChange = (e) => {
        const roomId = e.target.value;
        const room = filteredRooms.find(r => r._id === roomId); // Find from filtered rooms
        setSelectedRoom(room);
        setError(''); // Clear any previous error on room change
    };

    // Handle changes in the terms and conditions checkbox
    const handleTermsChange = () => {
        setTermsAccepted(!termsAccepted);
        setError('');
        setSuccessMessage('');
    };

    // --- Handlers for Room Filters ---
    const handleRoomFilterChange = (e) => {
        const { name, value } = e.target;
        // Ensure numbers are positive
        let parsedValue = value;
        if (name === 'roomFilterMinBeds' || name === 'roomFilterMaxPrice') { // Removed roomFilterMinPrice
            parsedValue = value === '' ? '' : Math.max(0, parseFloat(value));
        }
        if (name === 'roomFilterMinBeds') setRoomFilterMinBeds(parsedValue);
        // Removed roomFilterMinPrice
        if (name === 'roomFilterMaxPrice') setRoomFilterMaxPrice(parsedValue);
    };

    const handleRoomTypeFilterChange = (e) => {
        setRoomFilterType(e.target.value);
    };

    const handleResetRoomFilters = () => {
        setRoomFilterType('');
        setRoomFilterMinBeds('');
        // Removed roomFilterMinPrice reset
        setRoomFilterMaxPrice('');
        setError(''); // Clear filter-related error message
    };

    // Handle booking form submission
    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccessMessage('');

        const { check_in_date, check_out_date, total_guests, user_name, user_mobile, user_email } = bookingDetails;

        if (!selectedRoom) {
            setError("Please select a room to book.");
            setSubmitting(false);
            return;
        }

        if (!termsAccepted) {
            setError("Please accept the terms and conditions.");
            setSubmitting(false);
            return;
        }

        if (!check_in_date || !check_out_date || !user_name.trim() || !user_mobile.trim() || !user_email.trim() || total_guests < 1) {
            setError("Please fill all required fields and ensure guest count is at least 1.");
            setSubmitting(false);
            return;
        }

        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const duration = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        if (duration <= 0) {
            setError("Check-out must be after check-in.");
            setSubmitting(false);
            return;
        }

        if (typeof selectedRoom.pricePerNight !== 'number' || isNaN(selectedRoom.pricePerNight)) {
            setError("Selected room's price details are missing. Cannot complete booking.");
            console.error("Selected room price missing:", selectedRoom);
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
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(user_email.trim())) {
            setError("Please enter a valid email address.");
            setSubmitting(false);
            return;
        }

        try {
            const bookingPayload = {
                accommodationId: accommodationDetails._id,
                roomId: selectedRoom._id, // Send the selected room's ID
                accommodationName: accommodationDetails.accommodationName,
                roomNumber: selectedRoom.roomNumber, // Send room number for booking record
                roomType: selectedRoom.roomType, // Send room type for booking record
                pricePerNight: selectedRoom.pricePerNight, // Send price per night for booking record
                user_name,
                user_mobile,
                user_email,
                check_in_date,
                check_out_date,
                total_guests,
                duration,
                total_price: bookingDetails.total_price // Use calculated total price
            };

            const response = await axios.post(`${API_URL}/api/accommodation-bookings`, bookingPayload);
            setSuccessMessage('Booking confirmed! Thank you.');
            // Optionally clear form or navigate
            setBookingDetails({
                user_name: '',
                user_mobile: '',
                user_email: '',
                check_in_date: '',
                check_out_date: '',
                total_guests: 1,
            });
            setTermsAccepted(false);
            // navigate('/bookings/confirmation'); // Example navigation
        } catch (err) {
            console.error("Error submitting booking:", err.response ? err.response.data : err);
            setError(err.response?.data?.error || "Failed to confirm booking. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) {
        return <div className="loading-message">Loading accommodation details...</div>;
    }

    if (error && !accommodationDetails) { // Only show error if no accommodation details loaded at all
        return <div className="error-message">{error}</div>;
    }

    // If accommodationDetails is null after loading (e.g., ID not found), display message
    if (!accommodationDetails) {
        return <div className="info-message">No accommodation details available.</div>;
    }


    return (
        <div className="accommodationBookingContainer">
            <h2>Book Your Stay at {accommodationDetails.accommodationName}</h2>

            <div className="accommodationDetailsSection">
                <div className="accommodationImageContainer">
                    {accommodationDetails.image ? (
                        <img
                            src={`${API_URL}/images/${accommodationDetails.image}`}
                            alt={accommodationDetails.accommodationName}
                            className="accommodationImage"
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/500x350?text=Image+Not+Available`; }}
                        />
                    ) : (
                        <img
                            src={`https://placehold.co/500x350?text=No+Image+Available`}
                            alt="No Image Available"
                            className="accommodationImagePlaceholder"
                        />
                    )}
                </div>
                <div className="accommodationTextDetails">
                    <h3>{accommodationDetails.accommodationName} ({accommodationDetails.accommodationID})</h3>
                    <p><strong>Type:</strong> {accommodationDetails.accommodationType}</p>
                    <p><strong>Address:</strong> {accommodationDetails.address}</p>
                    <p><strong>Owner:</strong> {accommodationDetails.ownerName}</p>
                    {accommodationDetails.termsAndConditions && (
                        <div className="termsAndConditionsSection">
                            <h4>Terms & Conditions:</h4>
                            <p>{accommodationDetails.termsAndConditions}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bookingFormContainer">
                <h3>Select Room & Book</h3>

                {/* --- Room Filters Section --- */}
                <div className="filter-section">
                    <h4>Filter Rooms:</h4>
                    <div className="filters-grid">
                        <div className="form-group">
                            <label htmlFor="roomFilterType">Room Type:</label>
                            <select
                                id="roomFilterType"
                                name="roomFilterType"
                                value={roomFilterType}
                                onChange={handleRoomTypeFilterChange}
                                className="filter-dropdown"
                            >
                                <option value="">All Types</option>
                                {availableRoomTypesForFilter.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="roomFilterMinBeds">Min. Beds:</label>
                            <input
                                type="number"
                                id="roomFilterMinBeds"
                                name="roomFilterMinBeds"
                                value={roomFilterMinBeds}
                                onChange={handleRoomFilterChange}
                                min="0"
                                placeholder="Any"
                                className="filter-input"
                            />
                        </div>

                        {/* Removed Min Price Filter */}
                        {/*
                        <div className="form-group">
                            <label htmlFor="roomFilterMinPrice">Min. Price:</label>
                            <input
                                type="number"
                                id="roomFilterMinPrice"
                                name="roomFilterMinPrice"
                                value={roomFilterMinPrice}
                                onChange={handleRoomFilterChange}
                                min="0"
                                placeholder="Any"
                                className="filter-input"
                            />
                        </div>
                        */}

                        <div className="form-group">
                            <label htmlFor="roomFilterMaxPrice">Max. Price:</label>
                            <input
                                type="number"
                                id="roomFilterMaxPrice"
                                name="roomFilterMaxPrice"
                                value={roomFilterMaxPrice}
                                onChange={handleRoomFilterChange}
                                min="0"
                                placeholder="Any"
                                className="filter-input"
                            />
                        </div>
                    </div>
                    <button onClick={handleResetRoomFilters} className="reset-filters-button">
                        Reset Room Filters
                    </button>
                </div>
                {/* --- END Room Filters Section --- */}


                <form onSubmit={handleBookingSubmit} className="bookingForm">
                    <div className="form-group">
                        <label htmlFor="room_id">Select Room:</label>
                        <select
                            id="room_id"
                            name="room_id"
                            value={selectedRoom?._id || ''}
                            onChange={handleRoomSelectChange}
                            required
                            disabled={submitting || filteredRooms.length === 0}
                            className="room-select-dropdown"
                        >
                            <option value="" disabled>{filteredRooms.length === 0 ? "No rooms available with these filters" : "Please select a room"}</option>
                            {filteredRooms.map((room) => (
                                <option key={room._id} value={room._id}>
                                    Room {room.roomNumber} ({room.roomType}) - Beds: {room.numberOfBeds} - ₹{room.pricePerNight?.toLocaleString('en-IN')}/night
                                </option>
                            ))}
                        </select>
                        {selectedRoom && (
                            <div className="roomImagePreview">
                                <strong>Selected Room Details:</strong>
                                <p>Room Type: {selectedRoom.roomType}</p>
                                <p>Number of Beds: {selectedRoom.numberOfBeds}</p>
                                <p>Price per Night: ₹{selectedRoom.pricePerNight?.toLocaleString('en-IN')}</p>
                                <p>Facilities: {selectedRoom.roomFacilities?.join(', ') || 'N/A'}</p>
                                <p>Amenities: {selectedRoom.roomAmenities?.join(', ') || 'N/A'}</p>
                                {selectedRoom.image ? (
                                    <img src={`${API_URL}/images/${selectedRoom.image}`} alt={`Room ${selectedRoom.roomNumber}`} className="smallRoomImage"
                                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x120?text=Room+Image`; }}
                                    />
                                ) : (
                                    <img src={`https://placehold.co/150x120?text=No+Image`} alt="No Room Image" className="smallRoomImage" />
                                )}
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="user_name">Your Name:</label>
                        <input type="text" id="user_name" name="user_name" value={bookingDetails.user_name} onChange={handleChange} required disabled={submitting} autoComplete="name" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="user_mobile">Your Mobile Number:</label>
                        <input type="tel" id="user_mobile" name="user_mobile" value={bookingDetails.user_mobile} onChange={handleChange} required pattern="^\d{10}$" title="Please enter a 10-digit mobile number" disabled={submitting} autoComplete="tel" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="user_email">Your Email:</label>
                        <input type="email" id="user_email" name="user_email" value={bookingDetails.user_email} onChange={handleChange} required disabled={submitting} autoComplete="email" />
                    </div>

                    <div className="form-group">
                        <label htmlFor="check_in_date">Check-in Date:</label>
                        <input type="date" id="check_in_date" name="check_in_date" value={bookingDetails.check_in_date} onChange={handleChange} required disabled={submitting} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="check_out_date">Check-out Date:</label>
                        <input type="date" id="check_out_date" name="check_out_date" value={bookingDetails.check_out_date} onChange={handleChange} required disabled={submitting} />
                    </div>

                    <div className="form-group">
                        <label htmlFor="total_guests">Number of Guests:</label>
                        <input type="number" id="total_guests" name="total_guests" value={bookingDetails.total_guests} onChange={handleChange} min="1" required disabled={submitting} />
                    </div>

                    {selectedRoom && bookingDetails.check_in_date && bookingDetails.check_out_date && bookingDetails.total_price > 0 && (
                        <div className="form-group">
                            <label>Calculated Total Price:</label>
                            <input type="text" value={`₹${bookingDetails.total_price?.toLocaleString('en-IN')}`} readOnly disabled className="calculated-price-input" />
                        </div>
                    )}

                    <div className="termsCheckbox">
                        <input type="checkbox" id="terms" checked={termsAccepted} onChange={handleTermsChange} disabled={submitting} />
                        <label htmlFor="terms">I agree to the terms and conditions</label>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {successMessage && <div className="success-message">{successMessage}</div>}

                    <button type="submit" className="bookButton" disabled={submitting || !selectedRoom || !termsAccepted || !bookingDetails.check_in_date || !bookingDetails.check_out_date || bookingDetails.total_guests < 1 || bookingDetails.total_price <= 0}>
                        {submitting ? 'Booking...' : 'Confirm Booking'}
                    </button>
                </form>
            </div>

            {parsedNearbyLocations.length > 0 && (
                <div className="nearbyAttractionsContainer">
                    <h2>Nearby Attractions</h2>
                    <div className="attractionsGrid">
                        {parsedNearbyLocations.map((location, index) => (
                            <div key={index} className="attractionCard">
                                 <img
                                     src={location.image || `https://placehold.co/200x150?text=${encodeURIComponent(location.name)}`}
                                     alt={location.name}
                                     className="attractionImage"
                                     onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/200x150?text=${encodeURIComponent(location.name)}`; }}
                                 />
                                <div className="attractionDetails">
                                    <h3>{location.name}</h3>
                                    {location.distance && <p><strong>Distance:</strong> {location.distance}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccommodationBooking;
