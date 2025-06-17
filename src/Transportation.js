import React, { useState, useEffect } from 'react';
import './css/Transportation.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Define API URL (base URL of your server)
const API_URL = 'https://travel-booking-backend.onrender.com'; // Base URL

const Transportation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [transportationData, setTransportationData] = useState([]);
  const [groupedTransports, setGroupedTransports] = useState({});
  const [loading, setLoading] = useState(true); // Added loading state
  const [error, setError] = useState(''); // Added error state

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTransportation = async () => {
      setLoading(true); // Start loading
      setError(''); // Clear previous errors
      try {
        // Use API_URL and append the endpoint
        const response = await axios.get(`${API_URL}/api/transportations`); // This is the call
        console.log("Fetched Transportations:", response.data); // Log fetched data

        if (Array.isArray(response.data)) {
          setTransportationData(response.data);
          groupTransportsByType(response.data); // Group data on initial load
        } else {
          console.error("API did not return an array:", response.data);
          setError('Unexpected data format from server.');
          setTransportationData([]);
          setGroupedTransports({});
        }
      } catch (error) {
        console.error('Failed to fetch transportation data:', error);
        setError('Failed to load transportations. Please try again later.');
        setTransportationData([]);
        setGroupedTransports({});
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchTransportation();
  }, [API_URL]); // Added API_URL to dependency array

  const groupTransportsByType = (data) => {
    const grouped = data.reduce((acc, transport) => {
      // Use optional chaining and default to 'Other' if transport_type is null/undefined
      const type = transport.transport_type || 'Other';
      acc[type] = acc[type] || [];
      acc[type].push(transport);
      return acc;
    }, {});
    // Sort categories alphabetically by type for consistent display
    const sortedGrouped = Object.keys(grouped).sort().reduce((acc, key) => {
      acc[key] = grouped[key];
      return acc;
    }, {});
    setGroupedTransports(sortedGrouped);
  };

  const handleSearchChange = (event) => {
    const query = event.target.value;
    setSearchQuery(query);
    // Filter based on the full list of fetched transportation data
    filterTransports(query, transportationData);
  };

  // Function to filter and then regroup the transports based on search query
  const filterTransports = (query, transportsToFilter) => {
    const terms = query.toLowerCase().split(' ').filter(Boolean);

    if (!terms.length) {
      groupTransportsByType(transportsToFilter); // Show original grouping if no search
      return;
    }

    const filtered = transportsToFilter.filter((transport) =>
      terms.every((term) => {
        const termLower = term.toLowerCase();
        // Check if the term is a number for price filtering
        const termPrice = parseFloat(term); // Use parseFloat for potential decimals

        // Search across multiple fields
        return (
          (transport.transport_type?.toLowerCase() || '').includes(termLower) ||
          (transport.model?.toLowerCase() || '').includes(termLower) ||
          (transport.driver_name?.toLowerCase() || '').includes(termLower) ||
          // Optional: Filter by price if the term is a valid number
          (!isNaN(termPrice) && transport.price_per_day !== undefined && parseFloat(transport.price_per_day) <= termPrice) || // Example: filter for price <= entered number, ensure price_per_day is number
          // Search within features array (if it's an array)
          (Array.isArray(transport.features) && transport.features.some(feature => feature.toLowerCase().includes(termLower)))
        );
      })
    );

    // Group only the filtered results
    groupTransportsByType(filtered);
  };


  const handleBook = (transportid) => {
    // Navigate to the booking page, passing the MongoDB _id in the URL
    navigate(`/transportation-booking/${encodeURIComponent(transportid)}`);
  };

  // --- Render Logic ---

  if (loading) {
    return <div className="loading-message">Loading transportations...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Check if there are any categories to display after filtering
  const hasDisplayableCategories = Object.keys(groupedTransports).length > 0;


  return (
    <div className="transportation-container">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by type, model, operator, features..." // Updated placeholder
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input" // Added class name
          aria-label="Search transportation" // Added ARIA label for accessibility
        />
      </div>

      <div className="transportation-list">
        {/* Conditional rendering based on whether there are any categories to display */}
        {hasDisplayableCategories ? (
          Object.keys(groupedTransports).map((type) => (
            <div className="transportation-category" key={type}>
              <h2>{type}</h2> {/* Display the transportation type as a heading */}
              <div className="transportation-items">
                {/* Iterate over the transports within this type */}
                {groupedTransports[type].length > 0 ? (
                  groupedTransports[type].map((transport) => (
                    <div className="transportation-card" key={transport._id}> {/* Use MongoDB _id as key */}
                      <img
                        className="transportation-image"
                        // Corrected image source: Construct the full URL and add onError
                        src={transport.image ? `${API_URL}/images/${transport.image}` : `${API_URL}/images/placeholder.jpg`} // Use API_URL for both image and placeholder
                        alt={transport.model || 'Transportation Image'} // Improved alt text
                        // Add onerror to handle broken images
                        onError={(e) => { e.target.onerror = null; e.target.src = `${API_URL}/images/placeholder.jpg`; }} // Use API_URL for placeholder
                      />
                      <div className="transport-details"> {/* Use a consistent class name */}
                        <h3>{transport.model || 'N/A Model'}</h3> {/* Added fallback for model */}
                        <p><strong>Operator:</strong> {transport.driver_name || 'N/A'}</p>
                        <p><strong>Type:</strong> {transport.transport_type || 'N/A'}</p> {/* Display transport type */}
                        {/* Ensure price is displayed correctly, handling potential non-numeric values */}
                        <p><strong>Price per Day:</strong> ₹{parseFloat(transport.price_per_day)?.toLocaleString('en-IN') || 'N/A'}</p> {/* Format price */}

                        {/* --- FIX for Rating: NaN --- */}
                        {/* Check if rating is a valid number before displaying with star */}
                        <p><strong>Rating:</strong> {transport.rating !== undefined && transport.rating !== null && !isNaN(parseFloat(transport.rating)) ? `${parseFloat(transport.rating)} ★` : 'N/A'}</p>

                        {/* Display Features if available and is an array */}
                        {Array.isArray(transport.features) && transport.features.length > 0 && (
                          <div className="features-list"> {/* Added class for styling */}
                            <strong>Features:</strong>
                            <ul>
                              {transport.features.map((feature, index) => (
                                <li key={index}>{feature || 'N/A'}</li> // Added fallback for feature item
                              ))}
                            </ul>
                          </div>
                        )}


                        {transport.termsAndConditions && typeof transport.termsAndConditions === 'string' && (
                          <p className="terms-text"><strong>Terms:</strong> {transport.termsAndConditions}</p>
                        )}

                        <button
                          className="transport-bookButton" // Use a consistent class name
                          // Pass the MongoDB _id to the handleBook function
                          onClick={() => handleBook(transport._id)}
                          aria-label={`Book ${transport.model || transport.transport_type}`} // Added ARIA label
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  // Message for categories that are empty after filtering
                  searchQuery ? (
                    <p className="no-transportations-message">No vehicles in "{type}" category matching your search.</p>
                  ) : (
                    <p className="no-transportations-message">No vehicles available in "{type}" category.</p>
                  )
                )}
              </div>
            </div>
          ))
        ) : (
          /* Message if no categories are found at all after filtering */
          searchQuery && transportationData.length > 0 && Object.keys(groupedTransports).length === 0 ? (
            <p className="no-transportations-message">No transportations found matching "{searchQuery}".</p>
          ) : (
            !loading && !error && transportationData.length === 0 && (
              <p className="no-transportations-message">No transportations available at the moment.</p>
            )
          )
        )}
      </div>
    </div>
  );
};

export default Transportation;
