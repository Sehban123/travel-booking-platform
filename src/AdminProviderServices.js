// src/components/Admin/AdminProviderServices.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate

import './css/AdminProviderServices.css';
const API_URL = "https://travel-booking-platform.onrender.com"; // Base URL for your backend API
const AdminProviderServices = () => {
    // Get the providerId from the URL parameters
    const { providerId } = useParams();
    const navigate = useNavigate(); // Initialize useNavigate hook

    const [provider, setProvider] = useState(null); // To store provider details
    const [accommodations, setAccommodations] = useState([]);
    const [transportations, setTransportations] = useState([]);
    const [sportAdventures, setSportAdventures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProviderAndServices = async () => {
            if (!providerId) {
                setError("Provider ID is missing.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null); // Clear previous errors

                // 1. Fetch provider details
                const providerResponse = await axios.get(`${API_URL}/api/providers/${providerId}`);
                setProvider(providerResponse.data);
                console.log("AdminProviderServices: Fetched provider details:", providerResponse.data); // Log fetched provider data

                // 2. Fetch services for this provider, regardless of declared serviceType
                // We will attempt to fetch all service types.
                // The backend endpoints /api/provider/:providerId/:serviceType still have
                // a check for matching serviceType, but the Admin context should bypass this.
                // Since we temporarily removed the 'Approved' status check, the remaining check
                // is the serviceType mismatch. We need to ensure the backend allows Admin
                // to bypass the serviceType check as well for these GET endpoints.
                // For now, let's try fetching all, assuming the backend will be updated
                // to allow Admin to fetch any type.

                // Fetch Accommodations for this provider
                // The backend GET /api/provider/:providerId/accommodations still checks provider.serviceType === 'Accommodation'
                // This needs to be removed or bypassed for the Admin role in the backend.
                const accResponse = await axios.get(`${API_URL}/api/provider/${providerId}/accommodations`).catch(err => {
                    console.warn(`AdminProviderServices: Could not fetch accommodations for provider ${providerId}. Backend might be restricting by serviceType.`, err);
                    return { data: [] }; // Return empty array on error to prevent breaking
                });
                setAccommodations(accResponse.data);
                console.log("AdminProviderServices: Fetched accommodations:", accResponse.data);


                // Fetch Transportation for this provider
                // The backend GET /api/provider/:providerId/transportations still checks provider.serviceType === 'Transportation'
                // This needs to be removed or bypassed for the Admin role in the backend.
                 const transResponse = await axios.get(`${API_URL}/api/provider/${providerId}/transportations`).catch(err => {
                     console.warn(`AdminProviderServices: Could not fetch transportations for provider ${providerId}. Backend might be restricting by serviceType.`, err);
                     return { data: [] }; // Return empty array on error
                 });
                setTransportations(transResponse.data);
                console.log("AdminProviderServices: Fetched transportations:", transResponse.data);


                // Fetch Sport Adventures for this provider
                // The backend GET /api/provider/:providerId/sports-adventures still checks provider.serviceType === 'Sport Adventure'
                // This needs to be removed or bypassed for the Admin role in the backend.
                 const sportResponse = await axios.get(`${API_URL}/api/provider/${providerId}/sports-adventures`).catch(err => {
                     console.warn(`AdminProviderServices: Could not fetch sport adventures for provider ${providerId}. Backend might be restricting by serviceType.`, err);
                     return { data: [] }; // Return empty array on error
                 });
                setSportAdventures(sportResponse.data);
                console.log("AdminProviderServices: Fetched sport adventures:", sportResponse.data);


            } catch (err) {
                console.error('Error fetching provider or services:', err);
                setError('Failed to load provider services.');
            } finally {
                setLoading(false);
            }
        };

        fetchProviderAndServices();
    }, [providerId]); // Re-run effect if providerId changes

    const handleBackToList = () => {
        // Navigate back to the Admin Provider List page
        // Use the correct path as defined in App.js and handled by AdminDashboard
        navigate('/admin_dashboard');
    };


    if (loading) {
        return <div>Loading services...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    // Render the fetched services
    return (
        <div className="admin-provider-services"> {/* Add a class for styling */}
            {provider && <h2>Services for {provider.name} ({provider.serviceType})</h2>}

            <button onClick={handleBackToList} className="back-button"> {/* Add a class for styling */}
                Back to Provider List
            </button>

            {/* Display Accommodations */}
            {accommodations.length > 0 && (
                <div className="service-category"> {/* Add a class for styling */}
                    <h3>Accommodations</h3>
                    <ul className="service-list"> {/* Add a class for styling */}
                        {accommodations.map(acc => (
                            <li key={acc._id} className="service-item"> {/* Add a class for styling */}
                                <p><strong>Name:</strong> {acc.accommodationName || 'N/A'}</p>
                                <p><strong>ID:</strong> {acc.accommodationID || 'N/A'}</p>
                                <p><strong>Type:</strong> {acc.accommodationType || 'N/A'}</p>
                                <p><strong>Room Type:</strong> {acc.roomType || 'N/A'}</p>
                                <p><strong>Price:</strong> ₹{acc.pricePerNight?.toLocaleString('en-IN') || 'N/A'}/night</p>
                                <p><strong>Beds:</strong> {acc.numberOfBeds || 'N/A'}</p>
                                <p><strong>Guests Allowed:</strong> {acc.guestsAllowed || 'N/A'}</p>
                                <p><strong>Rating:</strong> {acc.rating || 'N/A'}/5</p>
                                <p><strong>Address:</strong> {acc.address || 'N/A'}</p>
                                {/* Display image if available */}
                                {acc.image && (
                                     <p><strong>Image:</strong> <a href={`http://localhost:5000/images/${acc.image}`} target="_blank" rel="noopener noreferrer">{acc.image}</a></p>
                                )}
                                {/* Display amenities if available */}
                                {acc.amenities && acc.amenities.length > 0 && (
                                    <p><strong>Amenities:</strong> {acc.amenities.join(', ')}</p>
                                )}
                                {/* Display facilities if available */}
                                {acc.facilities && acc.facilities.length > 0 && (
                                    <p><strong>Facilities:</strong> {acc.facilities.join(', ')}</p>
                                )}
                                 <p><strong>Terms:</strong> {acc.termsAndConditions || 'N/A'}</p>
                                 <p><strong>Nearby:</strong> {acc.nearbyLocations || 'N/A'}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             {/* Display message if no accommodations found */}
             {accommodations.length === 0 && (
                <p className="no-services">No accommodations found for this provider.</p>
             )}


            {/* Display Transportations */}
            {transportations.length > 0 && (
                <div className="service-category"> {/* Add a class for styling */}
                    <h3>Transportations</h3>
                     <ul className="service-list"> {/* Add a class for styling */}
                        {transportations.map(trans => (
                            <li key={trans._id} className="service-item"> {/* Add a class for styling */}
                                <p><strong>Driver:</strong> {trans.driver_name || 'N/A'}</p>
                                <p><strong>Type:</strong> {trans.transport_type || 'N/A'}</p>
                                <p><strong>Model:</strong> {trans.model || 'N/A'}</p>
                                <p><strong>ID:</strong> {trans.id || 'N/A'}</p>
                                <p><strong>Price:</strong> ₹{trans.price_per_day?.toLocaleString('en-IN') || 'N/A'}/day</p>
                                <p><strong>Rating:</strong> {trans.rating || 'N/A'}</p>
                                {/* Display image if available */}
                                {trans.image && (
                                     <p><strong>Image:</strong> <a href={`http://localhost:5000/images/${trans.image}`} target="_blank" rel="noopener noreferrer">{trans.image}</a></p>
                                )}
                                {/* Display features if available */}
                                {trans.features && trans.features.length > 0 && (
                                    <p><strong>Features:</strong> {trans.features.join(', ')}</p>
                                )}
                                <p><strong>Terms:</strong> {trans.termsAndConditions || 'N/A'}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             {/* Display message if no transportations found */}
             {transportations.length === 0 && (
                <p className="no-services">No transportations found for this provider.</p>
             )}

            {/* Display Sport Adventures */}
            {sportAdventures.length > 0 && (
                <div className="service-category"> {/* Add a class for styling */}
                    <h3>Sport Adventures</h3>
                     <ul className="service-list"> {/* Add a class for styling */}
                        {sportAdventures.map(sport => (
                            <li key={sport._id} className="service-item"> {/* Add a class for styling */}
                                <p><strong>Name:</strong> {sport.name || 'N/A'}</p>
                                <p><strong>Type:</strong> {sport.type || 'N/A'}</p>
                                <p><strong>ID:</strong> {sport.id || 'N/A'}</p>
                                <p><strong>Price:</strong> ₹{sport.price?.toLocaleString('en-IN') || 'N/A'}</p>
                                <p><strong>Location:</strong> {sport.location || 'N/A'}</p>
                                <p><strong>Rating:</strong> {sport.rating || 'N/A'}</p>
                                <p><strong>Minimum Age:</strong> {sport.minimumAge || 'N/A'}</p>
                                {/* Display image if available */}
                                {sport.image && (
                                     <p><strong>Image:</strong> <a href={`http://localhost:5000/images/${sport.image}`} target="_blank" rel="noopener noreferrer">{sport.image}</a></p>
                                )}
                                {/* Display terms if available */}
                                {sport.termsAndConditions && sport.termsAndConditions.length > 0 && (
                                    <p><strong>Terms:</strong> {sport.termsAndConditions.join(', ')}</p>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {/* Display message if no sport adventures found */}
            {sportAdventures.length === 0 && (
                <p className="no-services">No sport adventures found for this provider.</p>
             )}

             {/* Message if provider has no services of any type */}
             {accommodations.length === 0 && transportations.length === 0 && sportAdventures.length === 0 && (
                 <p className="no-services">This provider has not added any services yet.</p>
             )}

        </div>
    );
};

export default AdminProviderServices;
