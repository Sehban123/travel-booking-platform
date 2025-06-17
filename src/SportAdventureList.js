import React from 'react';
import axios from 'axios';

const API_URL = 'https://travel-booking-platform.onrender.com'; // Define API URL

const SportAdventureList = ({ providerId, adventures, onEdit, onDeleteSuccess, onError, loading, setLoading, setMessage }) => {

     // Handle deletion of a sport adventure
     const handleDelete = async (adventureId) => {
        if (window.confirm('Are you sure you want to delete this sport adventure?')) {
            setMessage(''); // Clear previous messages
            onError(null); // Clear previous errors
            setLoading(true); // Start loading

            try {
                // EXPECTED BACKEND ENDPOINT: DELETE /api/sports-adventures/:id (Requires providerId in body for auth)
                 // Or DELETE /api/provider/:providerId/sports-adventures/:id
                 // Using the general endpoint but sending providerId in body for authorization check on backend
                await axios.delete(`${API_URL}/api/sports-adventures/${adventureId}`, { data: { providerId: providerId } });
                console.log('Sport adventure deleted successfully:', adventureId);
                setMessage('Sport adventure deleted successfully!'); // Set success message
                onDeleteSuccess(); // Notify parent to refresh the list

            } catch (err) {
                console.error('Error deleting sport adventure:', err);
                 // Set error message
                 onError(`Failed to delete sport adventure: ${err.response?.data?.error || err.message}`);
                 setMessage(`Failed to delete sport adventure: ${err.response?.data?.error || err.message}`);
            } finally {
                setLoading(false); // End loading
            }
        }
    };


    // Display loading state
    if (loading) {
        return <div className="service-list-loading">Loading sport adventures...</div>;
    }

    // Display empty state
    if (!adventures || adventures.length === 0) {
        return <div className="service-list-empty">No sport adventures added yet.</div>;
    }

    // Render the list of sport adventures
    return (
        <div className="service-list">
            <h2>My Sport Adventures</h2>
            {adventures.map(adv => (
                <div key={adv._id} className="service-item">
                    <h3>{adv.name} ({adv.type})</h3>
                    <p>Location: {adv.location}</p>
                    <p>Price: ${adv.price}</p>
                    {/* Add more details you want to display */}
                     <div className="service-actions">
                         {/* When editing, pass the full adventure object and its type */}
                         <button onClick={() => onEdit({...adv, serviceType: 'Sport Adventure'})} disabled={loading}>Edit</button>
                         <button onClick={() => handleDelete(adv._id)} disabled={loading}>Delete</button>
                     </div>
                </div>
            ))}
        </div>
    );
};

export default SportAdventureList;
