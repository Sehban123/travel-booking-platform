// src/components/Admin/AdminAccommodationList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdminList.css'; // Common list styles
const API_URL = "https://travel-booking-platform.onrender.com"; // Ensure this matches your server's address

const AdminAccommodationList = ({ onShowDetails }) => {
  const [accommodations, setAccommodations] = useState([]);
  const [filteredAccommodations, setFilteredAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Fetch accommodations on component mount
  useEffect(() => {
    const fetchAccommodations = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/api/accommodations`);
        setAccommodations(response.data);
        setFilteredAccommodations(response.data); // Initially show all
      } catch (error) {
        console.error('Error fetching accommodations:', error);
        setError('Failed to load accommodations.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccommodations();
  }, []);

  // Apply filter when filterType or accommodations change
  useEffect(() => {
    if (filterType === 'All') {
      setFilteredAccommodations(accommodations);
    } else {
      const filtered = accommodations.filter(acc => acc.accommodationType === filterType);
      setFilteredAccommodations(filtered);
    }
  }, [filterType, accommodations]);


  // Extract unique accommodation types for the filter dropdown
  const accommodationTypes = ['All', ...new Set(accommodations.map(acc => acc.accommodationType))];

  if (loading) {
    return <div className="admin-list-container">Loading accommodations...</div>;
  }

  if (error) {
    return <div className="admin-list-container error-message">{error}</div>;
  }

  return (
    <div className="admin-list-container">
      <h2>Accommodations</h2>

      <div className="filter-controls">
          <label htmlFor="type-filter">Filter by Type:</label>
          <select id="type-filter" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              {accommodationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
              ))}
          </select>
      </div>


      {filteredAccommodations.length === 0 ? (
        <p>No accommodations found {filterType !== 'All' ? `for type "${filterType}"` : ''}.</p>
      ) : (
        <ul className="admin-item-list">
          {filteredAccommodations.map(acc => (
            <li key={acc._id} className="admin-list-item">
              <img src={acc.image || '/images/placeholder.jpg'} alt={acc.accommodationName} className="admin-item-image" />
              <div className="admin-item-info">
                <h3>{acc.accommodationName} ({acc.accommodationType})</h3>
                <p>Location: {acc.address}</p>
                <p>Price: ₹{acc.pricePerNight?.toLocaleString('en-IN')}</p>
                <p>Rating: {acc.rating} ★</p>
              </div>
              <button className="view-details-button" onClick={() => onShowDetails(acc._id)}>View Details</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminAccommodationList;
