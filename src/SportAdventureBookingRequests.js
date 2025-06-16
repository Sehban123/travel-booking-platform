import React, { useState, useEffect } from 'react'; // Import useEffect
import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Define API URL

// FIX: Added providerId to the props
const SportAdventureBookingRequests = ({ providerId, bookingRequests, onAction, onError, loading, setLoading, setMessage }) => {

    // State to manage the selected filter status
    const [filterStatus, setFilterStatus] = useState('All'); // Default filter is 'All'

     // Handle approval or rejection of a booking request
    const handleActionClick = (bookingId, action) => { // action is 'approved' or 'rejected' from the button
         // Replaced window.confirm with a direct call to onAction.
         // In a production app, you might implement a custom modal for confirmation here.
         console.log(`Action triggered: ${action} for booking ID: ${bookingId}`);
         // Capitalize the first letter of the action string before sending it
         const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);
         // FIX: Pass providerId when calling onAction
         onAction(bookingId, capitalizedAction, providerId); // Call the parent handler with capitalized action and providerId
     };

    // Filter and sort booking requests based on selected status and pending priority
    const filteredAndSortedRequests = bookingRequests
        .filter(request => {
            if (filterStatus === 'All') {
                return true; // Show all requests
            }
            return request.status === filterStatus; // Show only requests matching the filter status
        })
        .sort((a, b) => {
            // Sort logic: Pending requests first, then others
            if (a.status === 'Pending' && b.status !== 'Pending') {
                return -1; // a (Pending) comes before b
            }
            if (a.status !== 'Pending' && b.status === 'Pending') {
                return 1; // b (Pending) comes before a
            }
            // For requests with the same status, maintain original order or sort by date if available
            // Sorting by booking_datetime descending (most recent first)
            return new Date(b.booking_datetime) - new Date(a.booking_datetime);
        });


    // Display loading state
    if (loading) {
        return <div className="service-list-loading">Loading booking requests...</div>;
    }

    // Display empty state based on the *original* bookingRequests prop
    if (!bookingRequests || bookingRequests.length === 0) {
        return <div className="service-list-empty">No booking requests received yet.</div>;
    }

    // Display empty state if filtering results in no requests
    if (filteredAndSortedRequests.length === 0) {
        return <div className="service-list-empty">No {filterStatus.toLowerCase()} booking requests found.</div>;
    }


    // Render the list of booking requests
    return (
        <div className="service-list">
            <h2>Sport Adventure Booking Requests</h2>

             {/* Filter Dropdown */}
             <div className="booking-filter">
                 <label htmlFor="statusFilter">Filter by Status:</label>
                 <select
                     id="statusFilter"
                     value={filterStatus}
                     onChange={(e) => setFilterStatus(e.target.value)}
                 >
                     <option value="All">All</option>
                     <option value="Pending">Pending</option>
                     <option value="Approved">Approved</option>
                     <option value="Rejected">Rejected</option>
                 </select>
             </div>

            {filteredAndSortedRequests.map(request => (
                <div key={request._id} className="service-item">
                    {/* Display booking details */}
                    {/* Assuming sportAdventureId is populated with adventure details */}
                    <h3>Booking for {request.sportAdventureId?.name || 'Unknown Sport Adventure'}</h3>
                    <p><strong>User:</strong> {request.user_name}</p>
                    <p><strong>Mobile:</strong> {request.user_mobile}</p>
                    <p><strong>Date of Activity:</strong> {new Date(request.date_of_activity).toLocaleDateString()}</p>
                    <p><strong>Participants:</strong> {request.total_participants}</p>
                    {/* You might want to display participant details here too */}
                    <p><strong>Total Price:</strong> ${request.total_price}</p>
                    <p><strong>Status:</strong> {request.status || 'Pending'}</p> {/* Display current status */}

                    {/* Action buttons (only show if status is pending) */}
                    {request.status === 'Pending' && (
                        <div className="service-actions">
                             {/* FIX: Call handleActionClick with bookingId and action */}
                            <button onClick={() => handleActionClick(request._id, 'approved')} disabled={loading}>Approve</button>
                            <button onClick={() => handleActionClick(request._id, 'rejected')} disabled={loading}>Reject</button>
                        </div>
                    )}
                     {request.status !== 'Pending' && (
                         <div className="service-actions">
                             <p>Request is {request.status}.</p>
                         </div>
                     )}
                </div>
            ))}
        </div>
    );
};

export default SportAdventureBookingRequests;
