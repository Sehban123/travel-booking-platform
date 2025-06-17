// src/components/Admin/AccommodationBookingRequests.js
import React, { useState, useEffect } from 'react'; // Import useEffect
import axios from 'axios';
import './css/AccommodationBookingRequests.css'; // Import the CSS file

const API_URL = 'https://travel-booking-platform.onrender.com';
// FIX: Added filterStatus and setFilterStatus to the props
const AccommodationBookingRequests = ({ providerId, bookingRequests, onAction, onError, loading, setLoading, setMessage, filterStatus, setFilterStatus }) => {

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
            // Ensure request.status is not null or undefined before comparing
            return (request.status || 'Pending') === filterStatus; // Show only requests matching the filter status
        })
        .sort((a, b) => {
            // Sort logic: Pending requests first, then others
            // Use default 'Pending' if status is null/undefined for sorting
            const statusA = a.status || 'Pending';
            const statusB = b.status || 'Pending';

            if (statusA === 'Pending' && statusB !== 'Pending') {
                return -1; // a (Pending) comes before b
            }
            if (statusA !== 'Pending' && statusB === 'Pending') {
                return 1; // b (Pending) comes before a
            }
            // For requests with the same status, sort by booking_datetime descending (most recent first)
            return new Date(b.booking_datetime) - new Date(a.booking_datetime);
        });


    // Display loading state
    if (loading) {
        return <div className="booking-list-loading">Loading booking requests...</div>;
    }

    // Display empty state based on the *original* bookingRequests prop
    // This way, we show "No requests received" if the initial fetch returned nothing,
    // not just if the filter results in an empty list.
    if (!bookingRequests || bookingRequests.length === 0) {
        return <div className="booking-list-empty">No accommodation booking requests received yet.</div>;
    }


    // Render the table of booking requests
    return (
        <div className="accommodation-booking-requests"> {/* Main container class */}
            <h2>Accommodation Booking Requests</h2>

            {/* Filter Dropdown */}
            <div className="booking-filter">
                <label htmlFor="statusFilter">Filter by Status:</label>
                <select
                    id="statusFilter"
                    value={filterStatus} // Use filterStatus prop
                    onChange={(e) => setFilterStatus(e.target.value)} // Use setFilterStatus prop
                >
                    <option value="All">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>

            {/* Table Container */}
            <div className="booking-table-container">
                {filteredAndSortedRequests.length === 0 ? (
                    <div className="booking-list-empty">No {filterStatus.toLowerCase()} booking requests found matching the filter.</div>
                ) : (
                    <table className="booking-table">
                        <thead>
                            <tr>
                                <th>Accommodation</th>
                                <th>User Name</th>
                                <th>User Mobile</th>
                                <th>User Email</th>
                                <th>Check-in Date</th>
                                <th>Check-out Date</th>
                                <th>Guests</th>
                                <th>Total Price</th>
                                <th>Status</th>
                                <th>Booked At</th> {/* Added Booked At column */}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedRequests.map(request => (
                                <tr key={request._id}>
                                    <td>{request.accommodationId?.accommodationName || 'Unknown Accommodation'}</td>
                                    <td>{request.user_name || 'N/A'}</td>
                                    <td>{request.user_mobile || 'N/A'}</td>
                                    <td>{request.user_email || 'N/A'}</td>
                                    <td>{request.check_in_date ? new Date(request.check_in_date).toLocaleDateString() : 'N/A'}</td>
                                    <td>{request.check_out_date ? new Date(request.check_out_date).toLocaleDateString() : 'N/A'}</td>
                                    <td>{request.total_guests !== undefined ? request.total_guests : 'N/A'}</td>
                                    <td>{request.total_price !== undefined ? `₹${request.total_price.toLocaleString('en-IN')}` : 'N/A'}</td>
                                    <td>
                                         <span className={`status-${(request.status || 'Pending').toLowerCase()}`}>
                                            {request.status || 'Pending'}
                                         </span>
                                    </td>
                                     <td>{request.booking_datetime ? new Date(request.booking_datetime).toLocaleString() : 'N/A'}</td> {/* Display Booked At */}
                                    <td>
                                        {request.status === 'Pending' ? (
                                            <div className="booking-actions"> {/* Using booking-actions for buttons */}
                                                <button onClick={() => handleActionClick(request._id, 'approved')} disabled={loading} className="approve-button">Approve</button>
                                                <button onClick={() => handleActionClick(request._id, 'rejected')} disabled={loading} className="reject-button">Reject</button>
                                            </div>
                                        ) : (
                                             <div className="booking-actions">
                                                {/* Display timestamp if approved or rejected */}
                                                {request.status === 'Approved' && request.approvedAt && (
                                                    <p className="action-timestamp">Approved: {new Date(request.approvedAt).toLocaleString()}</p>
                                                )}
                                                {request.status === 'Rejected' && request.rejectedAt && (
                                                     <p className="action-timestamp">Rejected: {new Date(request.rejectedAt).toLocaleString()}</p>
                                                )}
                                             </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AccommodationBookingRequests;
