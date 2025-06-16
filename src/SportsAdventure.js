import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/SportsAdventure.css';

const API_URL = 'http://localhost:5000';

const SportsAdventure = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sportAdventures, setSportAdventures] = useState([]);
  const [groupedAdventures, setGroupedAdventures] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdventures = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/api/sports-adventures`);
        if (Array.isArray(response.data)) {
          setSportAdventures(response.data);
          groupAdventuresByType(response.data);
        } else {
          setError('Unexpected data format from server.');
          setSportAdventures([]);
          setGroupedAdventures({});
        }
      } catch (error) {
        console.error('Failed to fetch sport adventure data:', error);
        setError('Failed to load adventures. Please try again later.');
        setSportAdventures([]);
        setGroupedAdventures({});
      } finally {
        setLoading(false);
      }
    };

    fetchAdventures();
  }, []);

  const groupAdventuresByType = (adventures) => {
    const grouped = adventures.reduce((acc, adventure) => {
      const type = adventure.type || 'Other';
      acc[type] = acc[type] || [];
      acc[type].push(adventure);
      return acc;
    }, {});
    const sortedGrouped = Object.keys(grouped).sort().reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {});
    setGroupedAdventures(sortedGrouped);
  };

  const filterAndGroupAdventures = (query, adventuresToFilter) => {
    const terms = query.toLowerCase().split(' ').filter(Boolean);
    if (!terms.length) {
      groupAdventuresByType(adventuresToFilter);
      return;
    }

    const filtered = adventuresToFilter.filter((adventure) =>
      terms.every((term) => {
        const termLower = term.toLowerCase();
        const termPrice = parseFloat(term);

        return (
          (adventure.type?.toLowerCase() || '').includes(termLower) ||
          (adventure.description?.toLowerCase() || '').includes(termLower) ||
          (adventure.location?.toLowerCase() || '').includes(termLower) ||
          (adventure.name?.toLowerCase() || '').includes(termLower) ||
          (!isNaN(termPrice) &&
            adventure.price !== undefined &&
            parseFloat(adventure.price) <= termPrice) ||
          (typeof adventure.termsAndConditions === 'string' &&
            adventure.termsAndConditions.toLowerCase().includes(termLower)) ||
          (Array.isArray(adventure.features) &&
            adventure.features.some((feature) =>
              feature.toLowerCase().includes(termLower)
            ))
        );
      })
    );

    groupAdventuresByType(filtered);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    filterAndGroupAdventures(query, sportAdventures);
  };

  const handleBook = (adventureId) => {
    navigate(`/sports-booking/${encodeURIComponent(adventureId)}`);
  };

  if (loading) {
    return <div className="loading-message">Loading sport adventures...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  const hasDisplayableCategories = Object.keys(groupedAdventures).length > 0;

  return (
    <div className="sportadventure-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by type, location, description, name, terms..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          aria-label="Search sport adventures"
        />
      </div>

      <div className="sportadventurelist">
        {hasDisplayableCategories ? (
          Object.keys(groupedAdventures).map((type) => (
            <div className="sportadventure-category" key={type}>
              <h2>{type}</h2>
              <div className="sportadventureitems">
                {groupedAdventures[type].length > 0 ? (
                  groupedAdventures[type].map((adventure) => (
                    <div className="sportadventurecard" key={adventure._id}>
                      <img
                        className="sportadventureimage"
                        src={
                          adventure.image
                            ? `${API_URL}/images/${adventure.image}`
                            : `${API_URL}/images/placeholder.jpg`
                        }
                        alt={adventure.name || 'Adventure Image'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${API_URL}/images/placeholder.jpg`;
                        }}
                      />
                      <div className="activity-details">
                        <p>
                          <strong>Name:</strong>{' '}
                          {adventure.name || 'N/A Name'}
                        </p>
                        <p>
                          <strong>Description:</strong>{' '}
                          {adventure.description || 'N/A Description'}
                        </p>
                        <p>
                          <strong>Location:</strong>{' '}
                          {adventure.location || 'N/A Location'}
                        </p>
                        <p>
                          <strong>Minimum Age:</strong>{' '}
                          {adventure.minimumAge !== undefined &&
                          !isNaN(parseInt(adventure.minimumAge))
                            ? adventure.minimumAge
                            : 'N/A'}
                        </p>
                        <p>
                          <strong>Price:</strong> ₹
                          {adventure.price !== undefined &&
                          !isNaN(parseFloat(adventure.price))
                            ? parseFloat(adventure.price).toLocaleString(
                                'en-IN'
                              )
                            : 'N/A'}
                        </p>

                        {Array.isArray(adventure.features) &&
                          adventure.features.length > 0 && (
                            <div className="features-list">
                              <strong>Features:</strong>
                              <ul>
                                {adventure.features.map((feature, index) => (
                                  <li key={index}>{feature || 'N/A'}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {adventure.termsAndConditions &&
                          typeof adventure.termsAndConditions === 'string' && (
                            <p className="terms-text">
                              <strong>Terms:</strong>{' '}
                              {adventure.termsAndConditions}
                            </p>
                          )}

                        <button
                          className="sportadventure-bookButton"
                          onClick={() => handleBook(adventure._id)}
                          aria-label={`Book ${adventure.name || 'this adventure'}`}
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-sportadventures-message">
                    <p>
                      {searchQuery
                        ? `No activities in "${type}" category matching your search.`
                        : `No activities available in "${type}" category.`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : !loading && !error && (searchQuery || sportAdventures.length === 0) ? (
          <p className="no-sportadventures-message">
            {searchQuery
              ? `No sport adventures found matching "${searchQuery}".`
              : 'No sport adventures available at the moment.'}
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default SportsAdventure;
