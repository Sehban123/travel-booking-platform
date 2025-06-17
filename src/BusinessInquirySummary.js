// src/components/BusinessInquirySummary.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/BusinessInquirySummary.css'; // Make sure this CSS file exists
const API_URL = 'https://travel-booking-backend.onrender.com';
const BusinessInquirySummary = ({ inquiryData, onBackToForm }) => {
    const [accommodations, setAccommodations] = useState([]);
    const [transportations, setTransportations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                // Fetch all accommodations
                const accResponse = await axios.get(`${API_URL}/api/accommodations`);
                const allAccommodations = accResponse.data;
                console.log("Fetched all accommodations:", allAccommodations);

                // Fetch all transportation options (assuming a flat list endpoint)
                const transResponse = await axios.get(`${API_URL}/api/transportations`);
                const allTransportations = transResponse.data;
                 console.log("Fetched all transportations:", allTransportations);

                // Get the requested location from inquiryData, convert to lowercase for case-insensitive comparison
                const requestedLocation = inquiryData.location ? inquiryData.location.toLowerCase() : '';
                console.log("Filtering results for requested location:", requestedLocation);

                // --- Filter Accommodations based on Services Needed AND Location ---
                const filteredAccommodations = allAccommodations.filter(acc => {
                    // Check if any of the requested services match the accommodation's facilities
                    const servicesMatch = inquiryData.servicesNeeded.some(service =>
                        acc.facilities.includes(service) ||
                        (service === 'Accommodation' && acc.accommodationType) ||
                        (service === 'Conference Hall Booking' && acc.facilities.includes('Meeting Rooms / Conference Facilities')) ||
                        (service === 'Community Hall Booking' && acc.facilities.includes('Community Hall Booking (nearby)')) ||
                        (service === 'Open Ground Booking' && acc.facilities.includes('Open Ground Booking (nearby)')) ||
                        (service === 'Food/Catering' && acc.facilities.includes('Restaurant') || acc.facilities.includes('Food/Catering') || acc.facilities.includes('Private Chef (Optional)') || acc.amenities.includes('Complimentary Breakfast') || acc.amenities.includes('Organic Meals Available'))
                         // Add more mappings as needed
                    );

                    // Check if the accommodation's address or nearby locations contain the requested location string
                    const locationMatch = requestedLocation === '' || // If no location requested, all locations match
                                          (acc.address && acc.address.toLowerCase().includes(requestedLocation)) ||
                                          (acc.nearbyLocations && acc.nearbyLocations.toLowerCase().includes(requestedLocation));

                    // Return true only if both services AND location match
                    return servicesMatch && locationMatch;
                });

                // --- Filter Transportation based on Services Needed AND Location ---
                 const filteredTransportations = allTransportations.filter(trans => {
                     // Filter transportation if 'Travel' or 'Taxi/Local Transport' is requested
                     const servicesMatch = inquiryData.servicesNeeded.includes('Travel (Flights, Train)') ||
                                            inquiryData.servicesNeeded.includes('Taxi/Local Transport');

                     // Check if the transportation's relevant location info contains the requested location string
                     // Assuming transportation items might have location info in model, features, or terms/conditions
                     // You might need to adjust these fields based on your actual transportation data structure
                     const locationMatch = requestedLocation === '' || // If no location requested, all locations match
                                           (trans.model && trans.model.toLowerCase().includes(requestedLocation)) ||
                                           (trans.features && trans.features.some(feature => feature.toLowerCase().includes(requestedLocation))) ||
                                           (trans.termsAndConditions && trans.termsAndConditions.toLowerCase().includes(requestedLocation));
                                           // Add more relevant transportation fields if they contain location info

                     // Return true only if both services AND location match
                     return servicesMatch && locationMatch;
                 });


                setAccommodations(filteredAccommodations);
                setTransportations(filteredTransportations);

            } catch (err) {
                console.error('Error fetching data for summary:', err);
                setError('Failed to load relevant options.');
                setAccommodations([]);
                setTransportations([]);
            } finally {
                setLoading(false);
            }
        };

        if (inquiryData) {
            fetchData();
        } else {
             setLoading(false);
             setError('No inquiry data provided.');
        }
    }, [inquiryData]); // Re-run when inquiryData changes

    if (loading) {
        return <div className="summary-container">Loading relevant options...</div>;
    }

    if (error) {
        return <div className="summary-container error-message">{error}</div>;
    }

    return (
        <div className="summary-container">
            <h2>Business Inquiry Summary</h2>

            <div className="inquiry-details">
                <h3>Your Inquiry Details</h3>
                <p><strong>Company Name:</strong> {inquiryData.companyName}</p>
                <p><strong>Contact Person:</strong> {inquiryData.contactName}</p>
                <p><strong>Contact Mobile:</strong> {inquiryData.contactMobile}</p>
                {inquiryData.contactEmail && <p><strong>Contact Email:</strong> {inquiryData.contactEmail}</p>}
                {/* --- DISPLAY LOCATION --- */}
                <p><strong>Preferred Location:</strong> {inquiryData.location}</p>
                <p><strong>Event/Travel Type:</strong> {inquiryData.eventType}</p>
                {inquiryData.eventDate && <p><strong>Preferred Date:</strong> {new Date(inquiryData.eventDate).toLocaleDateString()}</p>}
                <p><strong>Approximate Attendees:</strong> {inquiryData.numAttendees}</p>
                <p><strong>Services Needed:</strong> {inquiryData.servicesNeeded.join(', ') || 'None specified'}</p>
                {inquiryData.details && <p><strong>Additional Details:</strong> {inquiryData.details}</p>}
            </div>

            <div className="relevant-options">
                <h3>Relevant Accommodation Options in {inquiryData.location}</h3>
                {accommodations.length === 0 ? (
                    <p>No accommodations found matching your requested services in {inquiryData.location}.</p>
                ) : (
                    <ul className="options-list">
                        {accommodations.map(acc => (
                            <li key={acc._id || acc.accommodationID} className="option-item">
                                <img src={acc.image || '/images/placeholder.jpg'} alt={acc.accommodationName} className="option-image"/>
                                <div className="option-info">
                                    <h4>{acc.accommodationName} ({acc.accommodationType})</h4>
                                    <p><strong>Room Type:</strong> {acc.roomType}</p>
                                    <p><strong>Price Per Night:</strong> ₹{acc.pricePerNight?.toLocaleString('en-IN')}</p>
                                    <p><strong>Rating:</strong> {acc.rating}</p>
                                    <p><strong>Address:</strong> {acc.address}</p> {/* Display address */}
                                     {acc.nearbyLocations && <p><strong>Nearby:</strong> {acc.nearbyLocations}</p>} {/* Display nearby */}
                                    <p><strong>Facilities:</strong> {acc.facilities.join(', ') || 'N/A'}</p>
                                    {/* Add more details as needed */}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                 <h3>Relevant Transportation Options for {inquiryData.location}</h3>
                 {transportations.length === 0 ? (
                     <p>No transportation options found matching your requested services for {inquiryData.location}.</p>
                 ) : (
                     <ul className="options-list">
                         {transportations.map(trans => (
                             <li key={trans._id || trans.id} className="option-item">
                                 <img src={trans.image || '/images/placeholder.jpg'} alt={trans.model || 'Transportation'} className="option-image"/>
                                 <div className="option-info">
                                     <h4>{trans.model || trans.transport_type} ({trans.transport_type})</h4>
                                     <p><strong>Operator:</strong> {trans.driver_name}</p>
                                     <p><strong>Price Per Day:</strong> ₹{trans.price_per_day?.toLocaleString('en-IN')}</p>
                                     <p><strong>Rating:</strong> {trans.rating}</p>
                                     {/* Add more details that might indicate location relevance if available */}
                                     {/* <p><strong>Features:</strong> {trans.features?.join(', ') || 'N/A'}</p> */}
                                 </div>
                             </li>
                         ))}
                     </ul>
                 )}
            </div>

            <button onClick={onBackToForm} className="back-button">Submit Another Inquiry</button>
        </div>
    );
};

export default BusinessInquirySummary;
