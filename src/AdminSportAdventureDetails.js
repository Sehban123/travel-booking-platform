// src/components/Admin/AdminSportAdventureDetails.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdminDetails.css'; // Common details styles

const API_URL = 'https://travel-booking-platform.onrender.com';
const AdminSportAdventureDetails = ({ adventureId, onBackToList }) => {
  const [adventure, setAdventure] = useState(null);
  const [bookings, setBookings] = useState([]); // State for bookings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch adventure details and bookings on component mount or when ID changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch adventure details
        const advResponse = await axios.get(`${API_URL}/api/sports-adventures/${adventureId}`);
        setAdventure(advResponse.data);

        // Fetch bookings for this adventure
        const bookingsResponse = await axios.get(`${API_URL}/api/sports-adventures/${adventureId}/bookings`);
        setBookings(bookingsResponse.data);

      } catch (error) {
        console.error('Error fetching sport adventure details or bookings:', error);
        setError('Failed to load details or bookings.');
        setAdventure(null);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (adventureId) {
      fetchData();
    } else {
      setLoading(false);
      setError('No Sport Adventure ID provided.');
    }
  }, [adventureId]);

  if (loading) {
    return <div className="admin-details-container">Loading sport adventure details...</div>;
  }

  if (error) {
    return <div className="admin-details-container error-message">{error}</div>;
  }

  if (!adventure) {
    return <div className="admin-details-container">Sport Adventure not found.</div>;
  }

  return (
    <div className="admin-details-container">
      <button className="back-button" onClick={onBackToList}>Back to List</button>
      <h2>Sport Adventure Details: {adventure.name}</h2> {/* Use adventure.name */}

      <div className="details-section">
        <img src={adventure.image || '/images/placeholder.jpg'} alt={adventure.name} className="details-image" />
        <div className="details-info">
          <p><strong>Type:</strong> {adventure.type}</p> {/* Display adventure.type */}
          <p><strong>Description:</strong> {adventure.description}</p>
          <p><strong>Location:</strong> {adventure.location}</p>
          <p><strong>Price:</strong> ₹{adventure.price?.toLocaleString('en-IN')}</p>
          <p><strong>Rating:</strong> {adventure.rating}</p>
          <p><strong>Minimum Age:</strong> {adventure.minimumAge}</p>
          <p><strong>Terms:</strong></p>
          <ul>
            {adventure.termsAndConditions?.map((term, index) => <li key={index}>{term}</li>) || <li>N/A</li>}
          </ul>
        </div>
      </div>

      <div className="bookings-section">
        <h3>Bookings for this Adventure ({bookings.length})</h3>
        {bookings.length === 0 ? (
          <p>No bookings found for this sport adventure.</p>
        ) : (
          <ul className="bookings-list">
            {bookings.map(booking => (
              <li key={booking._id} className="booking-item">
                <p><strong>Booking ID:</strong> {booking._id}</p>
                <p><strong>User:</strong> {booking.user_name} ({booking.user_mobile})</p>
                <p><strong>Date:</strong> {new Date(booking.date_of_activity).toLocaleDateString()}</p>
                <p><strong>Participants:</strong> {booking.total_participants}</p>
                <p><strong>Total Price:</strong> ₹{booking.total_price?.toLocaleString('en-IN')}</p>
                <p><strong>Purpose:</strong> {booking.purposeOfTravel}</p>
                <p><strong>Booked On:</strong> {new Date(booking.booking_datetime).toLocaleString()}</p>
                {/* Display participant details if available */}
                {booking.participantsDetails && booking.participantsDetails.length > 0 && (
                  <div>
                    <strong>Participant Details:</strong>
                    <ul>
                      {booking.participantsDetails.map((p, idx) => (
                        <li key={idx}>{p.name} (Age: {p.age})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminSportAdventureDetails;
