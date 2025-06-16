// src/components/Admin/AdminSportAdventureList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdminList.css'; // Common list styles

const AdminSportAdventureList = ({ onShowDetails }) => {
  const [adventures, setAdventures] = useState([]);
  const [filteredAdventures, setFilteredAdventures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Fetch sport adventures on component mount
  useEffect(() => {
    const fetchAdventures = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get('http://localhost:5000/api/sports-adventures');
        setAdventures(response.data);
        setFilteredAdventures(response.data); // Initially show all
      } catch (error) {
        console.error('Error fetching sport adventures:', error);
        setError('Failed to load sport adventures.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdventures();
  }, []);

   // Apply filter when filterType or adventures change
  useEffect(() => {
    if (filterType === 'All') {
      setFilteredAdventures(adventures);
    } else {
      // Filter by the 'type' field from the backend data
      const filtered = adventures.filter(adv => adv.type === filterType);
      setFilteredAdventures(filtered);
    }
  }, [filterType, adventures]);


  // Extract unique adventure types for the filter dropdown
  const adventureTypes = ['All', ...new Set(adventures.map(adv => adv.type))];


  if (loading) {
    return <div className="admin-list-container">Loading sport adventures...</div>;
  }

  if (error) {
    return <div className="admin-list-container error-message">{error}</div>;
  }

  return (
    <div className="admin-list-container">
      <h2>Sport Adventures</h2>

       <div className="filter-controls">
          <label htmlFor="type-filter">Filter by Type:</label>
          <select id="type-filter" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              {adventureTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
              ))}
          </select>
      </div>

      {filteredAdventures.length === 0 ? (
        <p>No sport adventures found {filterType !== 'All' ? `for type "${filterType}"` : ''}.</p>
      ) : (
        <ul className="admin-item-list">
          {filteredAdventures.map(adv => (
            <li key={adv._id} className="admin-list-item">
               <img src={adv.image || '/images/placeholder.jpg'} alt={adv.name} className="admin-item-image" />
              <div className="admin-item-info">
                <h3>{adv.name} ({adv.type})</h3> {/* Display both name and type */}
                <p>Location: {adv.location}</p>
                <p>Price: ₹{adv.price?.toLocaleString('en-IN')}</p>
                <p>Rating: {adv.rating}</p>
              </div>
              <button className="view-details-button" onClick={() => onShowDetails(adv._id)}>View Details</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminSportAdventureList;
