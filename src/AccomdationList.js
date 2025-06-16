import React from 'react';
import axios from 'axios';
// Import the CSS file for the provider's accommodation list
import './css/AccommodationList.css';

// Define API URL (base URL of your server)
const API_URL = 'http://localhost:5000/api'; // Assuming this is the API URL for provider actions

// This component is intended for the Service Provider's dashboard
// to list and manage their accommodations.
const AccommodationList = ({ providerId, accommodations, onEdit, onDeleteSuccess, onError, loading, setLoading, setMessage }) => {

    // Handle deletion of an accommodation
    const handleDelete = async (accommodationId) => {
        if (window.confirm('Are you sure you want to delete this accommodation?')) {
            setMessage(''); // Clear previous messages
            onError(null); // Clear previous errors
            setLoading(true); // Start loading indicator (for the list component itself)

            try {
                // Backend endpoint to delete an accommodation, likely requires providerId for authorization
                await axios.delete(`${API_URL}/accommodations/${accommodationId}`, { data: { providerId: providerId } });
                console.log('Accommodation deleted successfully:', accommodationId);
                setMessage('Accommodation deleted successfully!'); // Set success message
                onDeleteSuccess(); // Notify parent component to refresh the list

            } catch (err) {
                console.error('Error deleting accommodation:', err);
                 // Set error message
                 const errorMessage = `Failed to delete accommodation: ${err.response?.data?.error || err.message}`;
                 onError(errorMessage); // Pass error to parent handler
                 setMessage(errorMessage); // Display error message
            } finally {
                setLoading(false); // End loading
            }
        }
    };

    // Helper function to get min/max price from rooms
    const getPriceRange = (rooms) => {
        if (!rooms || rooms.length === 0) return 'N/A';
        const prices = rooms.map(room => room.pricePerNight).filter(price => typeof price === 'number' && !isNaN(price));
        if (prices.length === 0) return 'N/A';
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === max) return `₹${min.toLocaleString('en-IN')}/night`;
        return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}/night`;
    };

    // Helper function to get min/max number of beds from rooms
    const getNumberOfBedsRange = (rooms) => {
        if (!rooms || rooms.length === 0) return 'N/A';
        const beds = rooms.map(room => room.numberOfBeds).filter(b => typeof b === 'number' && !isNaN(b));
        if (beds.length === 0) return 'N/A';
        const min = Math.min(...beds);
        const max = Math.max(...beds);
        if (min === max) return `${min}`;
        return `${min} - ${max}`;
    };


    // Display loading state
    if (loading) {
        // Using a class that exists in the CSS for consistency
        return <div className="service-list-loading">Loading accommodations...</div>;
    }

    // Display empty state
    if (!accommodations || accommodations.length === 0) {
         // Using a class that exists in the CSS for consistency
        return <div className="service-list-empty">No accommodations added yet.</div>;
    }

    // Render the list of accommodations in a table
    return (
        <div className="accommodation-list-container"> {/* Main container class */}
            <h2>My Accommodations</h2>

            {/* Table Container for responsiveness */}
            <div className="accommodation-table-wrapper"> {/* Added wrapper for overflow */}
                <table className="accommodation-table"> {/* Changed table class */}
                    <thead>
                        <tr>
                            <th>Accommodation Name</th>
                            <th>Type</th>
                            <th>Price per Night</th>
                            {/* Removed Guests Allowed header */}
                            <th>Number of Beds</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accommodations.map(acc => (
                            <tr key={acc._id}>
                                <td>{acc.accommodationName || 'N/A'}</td>
                                <td>{acc.accommodationType || 'N/A'}</td>
                                {/* Use helper functions to display ranges from rooms array */}
                                <td>{getPriceRange(acc.rooms)}</td>
                                {/* Removed Guests Allowed data cell */}
                                <td>{getNumberOfBedsRange(acc.rooms)}</td>
                                <td>
                                    <div className="accommodation-actions"> {/* Changed actions class */}
                                        {/* When editing, pass the full accommodation object and its type */}
                                        <button onClick={() => onEdit({...acc, serviceType: 'Accommodation'})} disabled={loading} className="edit-button">Edit</button> {/* Added class */}
                                        <button onClick={() => handleDelete(acc._id)} disabled={loading} className="delete-button">Delete</button> {/* Added class */}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AccommodationList;
