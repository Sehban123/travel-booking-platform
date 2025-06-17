// src/components/Admin/AdminTransportationDetails.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdminDetails.css'; // Common details styles
const API_URL = 'https://travel-booking-platform.onrender.com';
const AdminTransportationDetails = ({ transportationId, onBackToList }) => {
    // transportationId here is the _id of the specific FLAT Transportation document
    const [transportItem, setTransportItem] = useState(null);
    const [bookings, setBookings] = useState([]); // State for bookings, initialize as empty array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch the specific transport item and its bookings
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // --- Fetch the specific flat transportation item by its _id ---
                console.log("AdminTransportationDetails: Attempting to fetch item with ID:", transportationId);
                const itemResponse = await axios.get(`${API_URL}/api/transportation/${transportationId}`);
                setTransportItem(itemResponse.data);
                console.log("AdminTransportationDetails: Fetched item data:", itemResponse.data);


                // --- Fetch bookings for this SPECIFIC TRANSPORT ITEM ---
                console.log("AdminTransportationDetails: Attempting to fetch bookings for item ID:", transportationId);
                const bookingsResponse = await axios.get(`${API_URL}/api/transportation/${transportationId}/bookings`);

                // --- FIX: Check if bookingsResponse.data is an array before setting state ---
                if (Array.isArray(bookingsResponse.data)) {
                    setBookings(bookingsResponse.data);
                    console.log("AdminTransportationDetails: Fetched bookings data:", bookingsResponse.data);
                } else {
                    console.error("AdminTransportationDetails: Bookings response data is not an array:", bookingsResponse.data);
                    setBookings([]); // Set to empty array if not an array
                    setError('Failed to load bookings: Unexpected data format.');
                }


            } catch (error) {
                console.error('AdminTransportationDetails: Error fetching transportation item details or bookings:', error);
                // More specific error messages based on response
                if (error.response && error.response.status === 404) {
                    setError('Transportation item or bookings not found.');
                } else if (error.response && error.response.data && error.response.data.details) {
                     setError(`Failed to load details or bookings: ${error.response.data.details}`);
                }
                else {
                    setError('Failed to load details or bookings.');
                }

                setTransportItem(null);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch if transportationId is available
        if (transportationId) {
            fetchData();
        } else {
            setLoading(false);
            setError('No Transportation Item ID provided to details component.');
             console.log("AdminTransportationDetails: No transportationId prop received.");
        }
    }, [transportationId]); // Re-run effect if transportationId changes

    if (loading) {
        return <div className="admin-details-container">Loading transportation details...</div>;
    }

    if (error) {
        return <div className="admin-details-container error-message">{error}</div>;
    }

    // If not loading and no error, but transportItem is null, it means the item wasn't found
    if (!transportItem) {
        return <div className="admin-details-container">Transportation item not found.</div>;
    }

    return (
        <div className="admin-details-container">
            <button className="back-button" onClick={onBackToList}>Back to List</button>
            {/* Display item name/model in the heading */}
            <h2>Transportation Details: {transportItem.model || transportItem.transport_type}</h2>

            <div className="details-section">
                <img src={transportItem.image || '/images/placeholder.jpg'} alt={transportItem.model || 'Transportation'} className="details-image" />
                <div className="details-info">
                    {/* Display details directly from the flat item object */}
                    <p><strong>Type:</strong> {transportItem.transport_type || 'N/A'}</p>
                    <p><strong>Model:</strong> {transportItem.model || 'N/A'}</p>
                    <p><strong>Operator:</strong> {transportItem.driver_name || 'N/A'}</p>
                    <p><strong>Price Per Day:</strong> ₹{transportItem.price_per_day?.toLocaleString('en-IN') || 'N/A'}</p>
                    <p><strong>Rating:</strong> {transportItem.rating || 'N/A'}</p>
                    <p><strong>Features:</strong> {transportItem.features?.join(', ') || 'N/A'}</p>
                    <p><strong>Terms:</strong> {transportItem.termsAndConditions || 'N/A'}</p>
                </div>
            </div>

             <div className="bookings-section">
                {/* Bookings are associated with this specific flat item ID */}
                <h3>Bookings for this Item ({bookings.length})</h3>
                {/* Check if bookings is an array before mapping */}
                {Array.isArray(bookings) && bookings.length === 0 ? (
                  <p>No bookings found for this transportation item.</p>
                ) : Array.isArray(bookings) ? ( // Ensure bookings is an array here too
                  <ul className="bookings-list">
                    {bookings.map(booking => (
                      <li key={booking._id} className="booking-item">
                        <p><strong>Booking ID:</strong> {booking._id}</p>
                        <p><strong>User:</strong> {booking.user_name} ({booking.user_mobile})</p>
                        <p><strong>Date:</strong> {new Date(booking.date_of_travel).toLocaleDateString()}</p>
                        <p><strong>Passengers:</strong> {booking.total_passengers}</p>
                        <p><strong>Total Price:</strong> ₹{booking.total_price?.toLocaleString('en-IN')}</p>
                        <p><strong>Purpose:</strong> {booking.purposeOfTravel}</p>
                        <p><strong>Booked On:</strong> {new Date(booking.booking_datetime).toLocaleString()}</p>
                        {/* Display other booking details as needed */}
                      </li>
                    ))}
                  </ul>
                ) : (
                    // Fallback if bookings is not an array even after the check (shouldn't happen with the fix)
                    <p className="error-message">Error displaying bookings.</p>
                )}
            </div>
        </div>
    );
};

export default AdminTransportationDetails;
