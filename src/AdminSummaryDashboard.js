// src/components/Admin/AdminSummaryDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdminSummaryDashboard.css'; // Create this CSS file

const API_URL = "https://travel-booking-backend.onrender.com";

const AdminSummaryDashboard = () => {
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSummaryData = async () => {
            try {
                setLoading(true);
                setError(null);
                // Fetch summary counts from the new backend endpoint
                const response = await axios.get(`${API_URL}/api/admin/summary-counts`);
                setSummaryData(response.data);
                console.log("Fetched admin summary data:", response.data);
            } catch (err) {
                console.error('Error fetching admin summary data:', err);
                setError('Failed to load summary data.');
            } finally {
                setLoading(false);
            }
        };

        fetchSummaryData();
    }, []); // Empty dependency array means this effect runs once on mount


    if (loading) {
        return <div className="loading-message">Loading summary data...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!summaryData) {
        return <div className="info-message">No summary data available.</div>;
    }

    // Destructure data for easier access
    const {
        providers,
        accommodations,
        transportations,
        sportAdventures,
        businessInquiries,
        bookings,
        transportationBookings,
        sportAdventureBookings
    } = summaryData;


    return (
        <div className="admin-summary-dashboard">
            <h2>Admin Dashboard Summary</h2>

            <div className="summary-tiles-grid"> {/* Use a grid for tiles */}

                {/* Service Provider Tiles */}
                <div className="summary-tile provider-tile total-providers-tile">
                    <h3>Service Providers</h3>
                    <p className="count">{providers.Total}</p>
                    <p className="details">Total Registered</p>
                </div>
                 <div className="summary-tile provider-tile pending-tile">
                    <h3>Providers (Pending)</h3>
                    <p className="count">{providers.Pending}</p>
                    <p className="details">Applications Pending</p>
                </div>
                <div className="summary-tile provider-tile approved-tile">
                    <h3>Providers (Approved)</h3>
                    <p className="count">{providers.Approved}</p>
                    <p className="details">Currently Approved</p>
                </div>
                 <div className="summary-tile provider-tile rejected-tile">
                    <h3>Providers (Rejected)</h3>
                    <p className="count">{providers.Rejected}</p>
                    <p className="details">Applications Rejected</p>
                </div>


                {/* Service Listing Tiles */}
                 <div className="summary-tile service-tile accommodation-tile">
                    <h3>Accommodations</h3>
                    <p className="count">{accommodations.Total}</p>
                    <p className="details">Total Listings</p>
                </div>
                <div className="summary-tile service-tile transportation-tile">
                    <h3>Transportations</h3>
                    <p className="count">{transportations.Total}</p>
                    <p className="details">Total Listings</p>
                </div>
                 <div className="summary-tile service-tile sport-adventure-tile">
                    <h3>Sport Adventures</h3>
                    <p className="count">{sportAdventures.Total}</p>
                    <p className="details">Total Listings</p>
                </div>

                {/* Booking Tiles */}
                 <div className="summary-tile booking-tile accommodation-booking-tile">
                    <h3>Accommodation Bookings</h3>
                    <p className="count">{bookings.Total}</p>
                    <p className="details">Total Bookings</p>
                </div>
                <div className="summary-tile booking-tile transportation-booking-tile">
                    <h3>Transportation Bookings</h3>
                    <p className="count">{transportationBookings.Total}</p>
                    <p className="details">Total Bookings</p>
                </div>
                 <div className="summary-tile booking-tile sport-adventure-booking-tile">
                    <h3>Sport Adventure Bookings</h3>
                    <p className="count">{sportAdventureBookings.Total}</p>
                    <p className="details">Total Bookings</p>
                </div>


                {/* Business Inquiry Tile */}
                 <div className="summary-tile inquiry-tile">
                    <h3>Business Inquiries</h3>
                    <p className="count">{businessInquiries.Total}</p>
                    <p className="details">Total Received</p>
                </div>


            </div>
        </div>
    );
};

export default AdminSummaryDashboard;
