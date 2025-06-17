// src/components/Admin/AdminAccommodationDetails.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdminDetails.css'; // Common details styles

const API_URL = "https://travel-booking-platform.onrender.com"; // Ensure this matches your server's base URL

const AdminAccommodationDetails = ({ accommodationId, onBackToList }) => {
  const [accommodation, setAccommodation] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch accommodation details and bookings on component mount or when ID changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch accommodation details, ensuring rooms are populated (backend responsibility)
        const accResponse = await axios.get(`${API_URL}/api/accommodations/${accommodationId}`);
        setAccommodation(accResponse.data);
        console.log("Frontend received accommodation data:", accResponse.data); // NEW LOG

        // Fetch bookings for this accommodation
        const bookingsResponse = await axios.get(`${API_URL}/api/accommodations/${accommodationId}/bookings`);
        setBookings(bookingsResponse.data);
        console.log("Frontend received bookings data:", bookingsResponse.data); // NEW LOG

      } catch (error) {
        console.error('Error fetching accommodation details or bookings:', error);
        setError('Failed to load details or bookings. Please check console for more info.');
        setAccommodation(null);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (accommodationId) {
      fetchData();
    } else {
        setLoading(false);
        setError('No Accommodation ID provided.');
    }
  }, [accommodationId]); // Re-run effect if accommodationId changes

  // Helper function to render image with fallback
  const renderImage = (imagePath, altText, isRoomImage = false) => {
    // Construct the correct URL for the image
    const imageUrl = imagePath ? `${API_URL}/images/${imagePath}` : (
        isRoomImage
            ? `https://placehold.co/150x100?text=No+Room+Image`
            : `https://placehold.co/300x200?text=No+Image`
    );
    const className = isRoomImage ? "room-card-image" : "details-image";

    return (
      <img
        src={imageUrl}
        alt={altText}
        className={className}
        onError={(e) => { e.target.onerror = null; e.target.src = isRoomImage ? `https://placehold.co/150x100?text=Error` : `https://placehold.co/300x200?text=Error`; }}
      />
    );
  };


  if (loading) {
    return <div className="admin-details-container">Loading accommodation details...</div>;
  }

  if (error) {
    return <div className="admin-details-container error-message">{error}</div>;
  }

  if (!accommodation) {
      return <div className="admin-details-container">Accommodation not found.</div>;
  }

  return (
    <div className="admin-details-container">
      <button className="back-button" onClick={onBackToList}>Back to List</button>
      <h2>Accommodation Details: {accommodation.accommodationName || 'N/A'}</h2>

      <div className="details-section">
        {renderImage(accommodation.image, accommodation.accommodationName)}
        <div className="details-info">
          <p><strong>Accommodation ID:</strong> {accommodation.accommodationID || 'N/A'}</p>
          <p><strong>Type:</strong> {accommodation.accommodationType || 'N/A'}</p>
          <p><strong>Owner:</strong> {accommodation.ownerName || 'N/A'}</p>
          <p><strong>Address:</strong> {accommodation.address || 'N/A'}</p>
          <p><strong>Rating:</strong> {accommodation.rating || 'N/A'} ★</p>
          <p><strong>Amenities:</strong> {accommodation.amenities?.join(', ') || 'N/A'}</p>
          <p><strong>Facilities:</strong> {accommodation.facilities?.join(', ') || 'N/A'}</p>
          <p><strong>Nearby Locations:</strong> {accommodation.nearbyLocations || 'N/A'}</p>
          <p><strong>Terms:</strong> {accommodation.termsAndConditions || 'N/A'}</p>
        </div>
      </div>

      {/* Display individual Room Details */}
      <div className="rooms-section">
          <h3>Rooms Available ({accommodation.rooms?.length || 0})</h3>
          {accommodation.rooms && accommodation.rooms.length > 0 ? (
              <div className="rooms-grid">
                  {accommodation.rooms.map(room => (
                      <div key={room._id} className="room-card">
                          {renderImage(room.image, `Room ${room.roomNumber}`, true)} {/* Pass true for isRoomImage */}
                          <div className="room-card-info">
                              <h4>Room No: {room.roomNumber || 'N/A'}</h4>
                              <p><strong>Type:</strong> {room.roomType || 'N/A'}</p>
                              <p><strong>Price:</strong> ₹{room.pricePerNight?.toLocaleString('en-IN') || 'N/A'}/night</p>
                              <p><strong>Beds:</strong> {room.numberOfBeds || 'N/A'}</p>
                              <p><strong>Guests:</strong> {room.guestsAllowed || 'N/A'}</p>
                              <p><strong>Amenities:</strong> {room.roomAmenities?.join(', ') || 'N/A'}</p>
                              <p><strong>Facilities:</strong> {room.roomFacilities?.join(', ') || 'N/A'}</p>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <p>No individual rooms added for this accommodation yet.</p>
          )}
      </div>

      <div className="bookings-section">
        <h3>Bookings for this Accommodation ({bookings.length})</h3>
        {bookings.length === 0 ? (
          <p>No bookings found for this accommodation.</p>
        ) : (
          <ul className="bookings-list">
            {bookings.map(booking => (
              <li key={booking._id} className="booking-item">
                <p><strong>Booking ID:</strong> {booking._id || 'N/A'}</p>
                <p><strong>Room Booked:</strong> Room {booking.roomNumber || 'N/A'} ({booking.roomType || 'N/A'})</p>
                <p><strong>User:</strong> {booking.user_name || 'N/A'} ({booking.user_mobile || 'N/A'})</p>
                <p><strong>Dates:</strong> {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString() : 'N/A'} - {booking.check_out_date ? new Date(booking.check_out_date).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Guests:</strong> {booking.total_guests || 'N/A'}</p>
                <p><strong>Total Price:</strong> ₹{booking.total_price?.toLocaleString('en-IN') || 'N/A'}</p>
                <p><strong>Purpose:</strong> {booking.purposeOfTravel || 'N/A'}</p>
                <p><strong>Booked On:</strong> {booking.booking_datetime ? new Date(booking.booking_datetime).toLocaleString() : 'N/A'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminAccommodationDetails;
