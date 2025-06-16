// src/components/Admin/AdminTransportationList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdminList.css'; // Common list styles

const AdminTransportationList = ({ onShowDetails }) => {
    // State to hold the flat list of individual transport items from the backend
    const [transportations, setTransportations] = useState([]);
    // State for the list currently being displayed (after filtering)
    const [filteredTransportations, setFilteredTransportations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // State for the currently selected filter type (based on the item's transport_type)
    const [filterType, setFilterType] = useState('All');
    // State to hold the unique transport types for the filter dropdown
    const [transportTypes, setTransportTypes] = useState([]);


    // Effect to fetch transportation data from the backend
    useEffect(() => {
        const fetchTransportations = async () => {
            setLoading(true); // Start loading state
            setError(''); // Clear previous errors
            try {
                // Fetch the flat list of transportation items
                const response = await axios.get('http://localhost:5000/api/transportations');

                // response.data is already the flat array of items - use it directly
                const flatItems = response.data;

                console.log("Fetched flat transportation items:", flatItems); // Log the fetched data
                setTransportations(flatItems); // Store the full flat list
                setFilteredTransportations(flatItems); // Initially, filtered list is the full list

                // Extract unique transport types for the filter dropdown from the flat items
                // Use item.transport_type for filtering as per the flat structure
                const types = ['All', ...new Set(flatItems.map(item => item.transport_type))];
                setTransportTypes(types);


            } catch (error) {
                console.error('Error fetching transportations:', error);
                setError('Failed to load transportations.');
                setTransportations([]); // Clear data on error
                setFilteredTransportations([]);
                setTransportTypes(['All']);
            } finally {
                setLoading(false); // End loading state
            }
        };

        fetchTransportations();
    }, []); // Empty dependency array means this effect runs only once on mount

    // Effect to apply filtering whenever the filterType state changes or the original data changes
    useEffect(() => {
        if (filterType === 'All') {
            setFilteredTransportations(transportations); // If filter is 'All', show the full list
        } else {
            // Filter the flat list based on the 'transport_type' property of each item
            const filtered = transportations.filter(item => item.transport_type === filterType);
            setFilteredTransportations(filtered);
        }
    }, [filterType, transportations]); // Re-run when filterType or transportations data changes


    if (loading) {
        return <div className="admin-list-container">Loading transportations...</div>;
    }

    if (error) {
        return <div className="admin-list-container error-message">{error}</div>;
    }

    // Add a check in case filteredTransportations is not an array unexpectedly
    if (!Array.isArray(filteredTransportations)) {
        return <div className="admin-list-container error-message">Error: Transportation data format is incorrect.</div>;
    }


    return (
        <div className="admin-list-container">
            <h2>Transportation List</h2>

            <div className="filter-controls">
                <label htmlFor="typeFilter">Filter by Type:</label>
                <select
                    id="typeFilter"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    {/* Use transportTypes for the filter options */}
                    {transportTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <ul className="admin-item-list">
                {filteredTransportations.length === 0 ? (
                    <li className="no-items">No transportation items found for the selected filter.</li>
                ) : (
                    // Map directly over the filtered (flat) transportation items
                    filteredTransportations.map(transport => (
                        <li key={transport._id || transport.id} className="admin-list-item">
                            {/* Display details from the flat item */}
                            <img src={transport.image || '/images/placeholder.jpg'} alt={transport.model || 'Transportation'} className="item-image" />
                            <div className="item-info">
                                {/* Display transport_type */}
                                <h3>{transport.model || transport.transport_type} ({transport.transport_type})</h3>
                                <p>Operator: {transport.driver_name}</p>
                                <p>Price Per Day: ₹{transport.price_per_day?.toLocaleString('en-IN')}</p>
                                <p>Rating: {transport.rating}</p>
                                {/* Add other relevant details from the flat item */}
                            </div>
                            {/* --- FIX: Move button into a separate item-actions div --- */}

                                <button onClick={() => {
                                    console.log("AdminTransportationList: View Details clicked for ID:", transport._id || transport.id);
                                    onShowDetails(transport._id || transport.id);
                                }} className="view-details-button">View Details</button>
                                {/* Add Edit/Delete buttons if needed */}

                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default AdminTransportationList;
