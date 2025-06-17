import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assuming axios is used for API calls
// Import the CSS file for styling
import './css/TransportationBookingRequests.css';

// Define API URL (base URL of your server)
const API_URL = 'https://travel-booking-platform.onrender.com'; // Ensure this matches your backend API URL

// This component is intended for the Service Provider's dashboard
// to list and manage their Transportation booking requests.
const TransportationBookingRequests = ({ providerId, bookingRequests, onAction, onError, loading, setLoading, setMessage }) => {

    // State to manage the selected filter status
    const [filterStatus, setFilterStatus] = useState('All'); // Default filter is 'All'

    // Handle approval or rejection of a booking request
    // bookingId: The ID of the booking request
    // action: The desired action ('approved' or 'rejected')
    const handleActionClick = (bookingId, action) => {
        // Confirm action with the user
        if (window.confirm(`Are you sure you want to ${action} this booking request?`)) {
            // Capitalize the first letter of the action string before sending it
            const capitalizedAction = action.charAt(0).toUpperCase() + action.slice(1);
            // Call the parent handler function (likely in ProviderDashboard)
            // Pass bookingId, the capitalized action, and the providerId
            onAction(bookingId, capitalizedAction, providerId);
        }
    };

    // Filter and sort booking requests based on selected status and pending priority
    // This is a derived state, recalculated whenever bookingRequests or filterStatus changes.
    const filteredAndSortedRequests = bookingRequests
        .filter(request => {
            // If filterStatus is 'All', include all requests
            if (filterStatus === 'All') {
                return true;
            }
            // Otherwise, include only requests whose status matches the filterStatus
            // Use optional chaining and default to 'Pending' if status is missing for filtering purposes
            return (request.status || 'Pending') === filterStatus;
        })
        .sort((a, b) => {
            // Sort logic: Pending requests first
            if ((a.status || 'Pending') === 'Pending' && (b.status || 'Pending') !== 'Pending') {
                return -1; // a (Pending) comes before b
            }
            if ((a.status || 'Pending') !== 'Pending' && (b.status || 'Pending') === 'Pending') {
                return 1; // b (Pending) comes before a
            }
            // For requests with the same status, sort by booking_datetime descending (most recent first)
            // Ensure booking_datetime exists before comparing
            const dateA = new Date(a.booking_datetime);
            const dateB = new Date(b.booking_datetime);
            // Handle invalid dates by falling back to 0 (maintains relative order of invalid dates)
            return (isNaN(dateB.getTime()) ? 0 : dateB.getTime()) - (isNaN(dateA.getTime()) ? 0 : dateA.getTime());
        });


    // --- Render Logic ---

    // Display loading state (controlled by parent component)
    if (loading) {
        return <div className="service-list-loading">Loading booking requests...</div>;
    }

    // Display empty state if there are no booking requests at all (controlled by parent)
    // This check uses the original bookingRequests prop
    if (!bookingRequests || bookingRequests.length === 0) {
        return <div className="service-list-empty">No transportation booking requests received yet.</div>;
    }

    // Display empty state if filtering results in no requests
    // This check uses the filteredAndSortedRequests array
    if (filteredAndSortedRequests.length === 0) {
        return <div className="service-list-empty">No {filterStatus.toLowerCase()} booking requests found.</div>;
    }


    // Render the list of booking requests
    return (
        <div className="service-list"> {/* Main container class for styling */}
            <h2>Transportation Booking Requests</h2>

            {/* Filter Dropdown */}
            <div className="booking-filter"> {/* Container for filter */}
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

            {/* List of filtered and sorted booking requests */}
            {filteredAndSortedRequests.map(request => (
                <div key={request._id} className={`service-item status-${(request.status || 'Pending').toLowerCase()}`}> {/* Add status class for styling */}
                    {/* Display booking details */}
                    {/* Assuming transportationId is populated with transportation details (model, type, etc.) */}
                    {/* Use optional chaining in case transportationId is null or not fully populated */}
                    <h3>Booking for {request.transportationId?.model || request.transportationId?.transport_type || request.transportationName || 'Unknown Transportation'}</h3> {/* Use populated data or name from request */}
                    <p><strong>User:</strong> {request.user_name || 'N/A'}</p>
                    <p><strong>Mobile:</strong> {request.user_mobile || 'N/A'}</p>
                    {/* Added Email display */}
                     <p><strong>Email:</strong> {request.user_email || 'N/A'}</p>
                    {/* Display date of travel with formatting */}
                    <p><strong>Date of Travel:</strong> {request.date_of_travel ? new Date(request.date_of_travel).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Passengers:</strong> {request.total_passengers !== undefined ? request.total_passengers : 'N/A'}</p>
                    {/* Display total price with formatting */}
                    <p><strong>Total Price:</strong> ₹{request.total_price !== undefined ? request.total_price.toLocaleString('en-IN') : 'N/A'}</p>
                     {/* Display booking date/time */}
                     <p><strong>Booked On:</strong> {request.booking_datetime ? new Date(request.booking_datetime).toLocaleString() : 'N/A'}</p>
                     {/* Display purpose of travel if it exists */}
                    {request.purposeOfTravel && <p><strong>Purpose:</strong> {request.purposeOfTravel}</p>}

                    {/* Display current status with styling */}
                    <p className={`booking-status status-${(request.status || 'Pending').toLowerCase()}`}>
                         <strong>Status:</strong> {request.status || 'Pending'}
                    </p>

                    {/* Action buttons (only show if status is pending) */}
                    {/* Disable buttons if loading is true (parent component is performing an action) */}
                    {(request.status === 'Pending' || !request.status) && ( // Also show if status is undefined
                        <div className="service-actions"> {/* Container for action buttons */}
                            {/* Call handleActionClick with bookingId and action string */}
                            <button onClick={() => handleActionClick(request._id, 'approved')} disabled={loading} className="approve-button">Approve</button>
                            <button onClick={() => handleActionClick(request._id, 'rejected')} disabled={loading} className="reject-button">Reject</button>
                        </div>
                    )}
                    {/* Message when request is not pending */}
                    {(request.status === 'Approved' || request.status === 'Rejected') && (
                        <div className="service-actions">
                            {/* The status is already displayed above, this div can be empty or contain other info */}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default TransportationBookingRequests;
