import React from 'react';
import axios from 'axios';

const API_URL = 'https://travel-booking-backend.onrender.com'; // Define API URL

const TransportationList = ({ providerId, transportations, onEdit, onDeleteSuccess, onError, loading, setLoading, setMessage }) => {

     // Handle deletion of a transportation item
     const handleDelete = async (transportationId) => {
        if (window.confirm('Are you sure you want to delete this transportation item?')) {
            setMessage(''); // Clear previous messages
            onError(null); // Clear previous errors
            setLoading(true); // Start loading

            try {
                // EXPECTED BACKEND ENDPOINT: DELETE /api/transportation/:id (Requires providerId in body for auth)
                 // Or DELETE /api/provider/:providerId/transportations/:id
                 // Using the general endpoint but sending providerId in body for authorization check on backend
                await axios.delete(`${API_URL}/transportation/${transportationId}`, { data: { providerId: providerId } });
                console.log('Transportation deleted successfully:', transportationId);
                setMessage('Transportation deleted successfully!'); // Set success message
                onDeleteSuccess(); // Notify parent to refresh the list

            } catch (err) {
                console.error('Error deleting transportation:', err);
                 // Set error message
                 onError(`Failed to delete transportation: ${err.response?.data?.error || err.message}`);
                 setMessage(`Failed to delete transportation: ${err.response?.data?.error || err.message}`);
            } finally {
                setLoading(false); // End loading
            }
        }
    };

    // Display loading state
    if (loading) {
        return <div className="service-list-loading">Loading transportation items...</div>;
    }

    // Display empty state
    if (!transportations || transportations.length === 0) {
        return <div className="service-list-empty">No transportation items added yet.</div>;
    }

    // Render the list of transportation items
    return (
        <div className="service-list">
            <h2>My Transportation</h2>
            {transportations.map(item => (
                <div key={item._id} className="service-item">
                    <h3>{item.driver_name} - {item.transport_type}</h3>
                    <p>Model: {item.model}</p>
                    <p>Price Per Day: ${item.price_per_day}</p>
                    {/* Add more details you want to display */}
                     <div className="service-actions">
                         {/* When editing, pass the full item object and its type */}
                         <button onClick={() => onEdit({...item, serviceType: 'Transportation'})} disabled={loading}>Edit</button>
                         <button onClick={() => handleDelete(item._id)} disabled={loading}>Delete</button>
                     </div>
                </div>
            ))}
        </div>
    );
};

export default TransportationList;
