// src/components/Admin/AdminProviderList.js
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assuming axios is used for API calls
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './css/AdminProviderList.css'; // Import the CSS file

const API_URL = "https://travel-booking-backend.onrender.com/api"; // Base URL for your backend API

const AdminProviderList = () => {
    const navigate = useNavigate(); // Initialize useNavigate hook

    const [allProviders, setAllProviders] = useState([]); // Store all fetched providers
    const [filteredProviders, setFilteredProviders] = useState([]); // Store providers after filtering
    const [filterText, setFilterText] = useState(''); // State for the filter input
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch all providers on component mount
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                setLoading(true);
                // Fetch all service providers with their populated services
                // IMPORTANT: Ensure your backend endpoint '/admin/service-providers'
                // populates the 'services' field (e.g., .populate('services'))
                // and the 'phoneNumber' field is correctly named.
                const response = await axios.get(`${API_URL}/admin/service-providers`);
                setAllProviders(response.data);
                setFilteredProviders(response.data); // Initially, filtered list is the full list
                console.log("Fetched providers with services:", response.data); // Log fetched data
            } catch (err) {
                console.error('Error fetching service providers:', err);
                setError('Failed to load service providers.');
            } finally {
                setLoading(false);
            }
        };

        fetchProviders();
    }, []); // Empty dependency array means this effect runs once on mount

    // Effect to update filteredProviders when filterText or allProviders changes
    useEffect(() => {
        const lowerCaseFilterText = filterText.toLowerCase();

        if (lowerCaseFilterText === '') {
            // If filter text is empty, show all providers
            setFilteredProviders(allProviders);
            return;
        }

        const filtered = allProviders.filter(provider => {
            // Check if provider's basic details match the filter text
            const providerMatch =
                provider.businessName?.toLowerCase().includes(lowerCaseFilterText) || // Changed to businessName
                provider.email?.toLowerCase().includes(lowerCaseFilterText) ||
                provider.serviceType?.toLowerCase().includes(lowerCaseFilterText) ||
                provider.status?.toLowerCase().includes(lowerCaseFilterText) ||
                provider.phoneNumber?.toLowerCase().includes(lowerCaseFilterText) || // Changed to phoneNumber
                provider.message?.toLowerCase().includes(lowerCaseFilterText);

            // Check if any of the provider's services match the filter text (based on summary fields)
            const servicesMatch = provider.services && provider.services.some(service => {
                if (!service) return false; // Skip if service is null/undefined

                // Filter based on the fields displayed in the service summary
                if (provider.serviceType === 'Accommodation') {
                    return (
                        service.accommodationName?.toLowerCase().includes(lowerCaseFilterText) ||
                        service.accommodationID?.toLowerCase().includes(lowerCaseFilterText) ||
                        String(service.pricePerNight || '').includes(lowerCaseFilterText) // Convert price to string for search, handle null/undefined
                    );
                } else if (provider.serviceType === 'Transportation') {
                     return (
                        service.model?.toLowerCase().includes(lowerCaseFilterText) ||
                        service.transport_type?.toLowerCase().includes(lowerCaseFilterText) ||
                        service.transportationID?.toLowerCase().includes(lowerCaseFilterText) || // Assuming backend sends transportationID
                        String(service.price_per_day || '').includes(lowerCaseFilterText)
                     );
                } else if (provider.serviceType === 'Sport Adventure') {
                     return (
                        service.activityName?.toLowerCase().includes(lowerCaseFilterText) || // Assuming activityName
                        service.activityType?.toLowerCase().includes(lowerCaseFilterText) || // Assuming activityType
                        service.sportAdventureID?.toLowerCase().includes(lowerCaseFilterText) || // Assuming sportAdventureID
                        String(service.price || '').includes(lowerCaseFilterText)
                     );
                }
                return false; // Return false if service type is not recognized or no match found
            });

            // A provider matches the filter if either their basic details or any of their services match
            return providerMatch || servicesMatch;
        });

        setFilteredProviders(filtered);
    }, [filterText, allProviders]); // Re-run filter when filterText or allProviders changes


    // Function to handle navigation to the provider's services page
    const handleViewServices = (providerId) => {
        console.log(`Navigating to dedicated services page for provider ID: ${providerId}`);
        // Navigate to the route that is handled by AdminDashboard to render AdminProviderServices
        navigate(`/admin/providers/${providerId}/services`);
    };


    if (loading) {
        return <div>Loading service providers...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="admin-provider-list"> {/* Add a class for styling */}
            <h2>All Service Providers</h2>

            {/* Filter Input */}
            <div className="filter-container"> {/* Add a class for styling */}
                <label htmlFor="providerFilter">Filter by Name, Email, Service Type, or Service Details:</label>
                <input
                    type="text"
                    id="providerFilter"
                    name="providerFilter"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Enter filter text..."
                />
            </div>

            {filteredProviders.length === 0 ? (
                <p className="no-providers-message">No service providers found matching your filter.</p>
            ) : (
                <ul className="provider-list"> {/* Add a class for styling the list */}
                    {filteredProviders.map(provider => (
                        <li key={provider._id} className="provider-item"> {/* Add a class for styling each item */}
                            <div className="provider-summary"> {/* Container for provider basic info */}
                                <h3>{provider.businessName || 'N/A'} ({provider.serviceType || 'N/A'})</h3> {/* Changed to businessName */}
                                <p><strong>Email:</strong> {provider.email || 'N/A'}</p>
                                <p><strong>Mobile:</strong> {provider.phoneNumber || 'N/A'}</p> {/* Changed to phoneNumber */}
                                <p><strong>Status:</strong> <span className={`status-${provider.status?.toLowerCase()}`}>{provider.status || 'N/A'}</span></p>
                                <p><strong>Application Date:</strong> {provider.applicationDate ? new Date(provider.applicationDate).toLocaleDateString() : 'N/A'}</p>
                            </div>

                            {/* Display associated services (Summary only) */}
                            {provider.services && provider.services.length > 0 ? (
                                <div className="provider-services-summary">
                                    <h4>Associated Services (Summary):</h4>
                                    <ul className="service-list-summary">
                                        {provider.services.slice(0, 3).map(service => (
                                            <li key={service._id || Math.random()} className="service-item-summary"> {/* Use _id for key, fallback to random if _id missing */}
                                                {/* Display service details based on type */}
                                                {provider.serviceType === 'Accommodation' && (
                                                    <>
                                                        <strong>Accommodation:</strong> {service.accommodationName || 'N/A'} (ID: {service.accommodationID || 'N/A'}) - ₹{service.pricePerNight?.toLocaleString('en-IN') || 'N/A'}/night
                                                    </>
                                                )}
                                                {provider.serviceType === 'Transportation' && (
                                                    <>
                                                        <strong>Transportation:</strong> {service.model || service.transport_type || 'N/A'} (ID: {service.transportationID || 'N/A'}) - ₹{service.price_per_day?.toLocaleString('en-IN') || 'N/A'}/day
                                                    </>
                                                )}
                                                {provider.serviceType === 'Sport Adventure' && (
                                                    <>
                                                        <strong>Sport Adventure:</strong> {service.activityName || 'N/A'} (ID: {service.sportAdventureID || 'N/A'}) - ₹{service.price?.toLocaleString('en-IN') || 'N/A'}
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                         {provider.services.length > 3 && (
                                            <li className="service-item-summary">...and {provider.services.length - 3} more services.</li>
                                         )}
                                    </ul>
                                </div>
                            ) : (
                                <p className="no-services-message">No services added by this provider yet.</p>
                            )}

                             {/* Button to view services */}
                            <button
                                className="view-services-button"
                                onClick={() => handleViewServices(provider._id)}
                            >
                                View All Services
                            </button>

                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AdminProviderList;
