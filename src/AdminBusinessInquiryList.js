// src/components/Admin/AdminBusinessInquiryList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AdminList.css'; // Common list styles
import './css/AdminDetails.css'; // Common details styles (for inquiry item display)

const API_URL = 'https://travel-booking-backend.onrender.com';
const AdminBusinessInquiryList = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch business inquiries on component mount
  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_URL}/api/business-inquiries`);
        // Sort inquiries by date, newest first
        const sortedInquiries = response.data.sort((a, b) => new Date(b.inquiryDate) - new Date(a.inquiryDate));
        setInquiries(sortedInquiries);
      } catch (error) {
        console.error('Error fetching business inquiries:', error);
        setError('Failed to load business inquiries.');
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, []); // Empty dependency array means this effect runs only once on mount

  if (loading) {
    return <div className="admin-list-container">Loading business inquiries...</div>;
  }

  if (error) {
    return <div className="admin-list-container error-message">{error}</div>;
  }

  return (
    <div className="admin-list-container">
      <h2>Business Inquiries</h2>

      {inquiries.length === 0 ? (
        <p>No business inquiries found.</p>
      ) : (
        <ul className="admin-item-list">
          {inquiries.map(inquiry => (
            <li key={inquiry._id} className="admin-list-item inquiry-item"> {/* Added inquiry-item class */}
              <div className="admin-item-info">
                {/* Display key inquiry details directly in the list */}
                <h3>Inquiry from: {inquiry.companyName}</h3>
                <p><strong>Contact:</strong> {inquiry.contactName} ({inquiry.contactMobile})</p>
                {inquiry.contactEmail && <p><strong>Email:</strong> {inquiry.contactEmail}</p>}
                <p><strong>Event Type:</strong> {inquiry.eventType || 'N/A'}</p>
                {inquiry.eventDate && <p><strong>Preferred Date:</strong> {new Date(inquiry.eventDate).toLocaleDateString()}</p>}
                <p><strong>Attendees:</strong> {inquiry.numAttendees || 'N/A'}</p>
                <p><strong>Services:</strong> {inquiry.servicesNeeded?.join(', ') || 'N/A'}</p>
                <p><strong>Details:</strong> {inquiry.details || 'N/A'}</p>
                <p><strong>Submitted On:</strong> {new Date(inquiry.inquiryDate).toLocaleString()}</p>
                {/* No separate details page needed for now, all info shown here */}
              </div>
              {/* No "View Details" button needed as all info is in the list item */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminBusinessInquiryList;
