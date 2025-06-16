import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Assuming axios is used for API calls


// Import the components for different views
import ProviderProfile from './ProviderProfile';
import ChangePassword from './ChangePassword';
import AccommodationList from './AccomdationList';
import AccommodationForm from './AccommodationForm';
import AccommodationBookingRequests from './AccommodationBookingRequests';
import TransportationList from './TransportationList';
import TransportationForm from './TransportationForm';
import TransportationBookingRequests from './TransportationBookingRequests';
import SportAdventureList from './SportAdventureList';
import SportAdventureForm from './SportAdventureForm';
import SportAdventureBookingRequests from './SportAdventureBookingRequests';

import './css/ProviderDashboard.css'; // Import the CSS for styling

const API_URL = 'https://travel-booking-backend.onrender.com/api'; // Base URL for your backend API

const ServiceProviderDashboard = () => {
    // Get providerId from the URL parameters
    const { providerId } = useParams();
    const navigate = useNavigate(); // Hook for navigation

    // State variables
    const [provider, setProvider] = useState(null); // Stores the logged-in provider's data
    const [services, setServices] = useState([]); // Stores the list of services for the current provider
    const [bookingRequests, setBookingRequests] = useState([]); // Stores booking requests for the provider's services
    const [loading, setLoading] = useState(true); // Indicates if data is being loaded
    const [error, setError] = useState(null); // Stores any error messages
    // State to manage which view is currently displayed in the main content area
    const [currentView, setCurrentView] = useState('profile'); // Default view is 'profile'
    const [editingService, setEditingService] = useState(null); // Stores data of the service being edited

    const [message, setMessage] = useState(''); // General message display (success/error)

    // --- State for managing the booking requests filter status (Moved to parent) ---
    const [bookingFilterStatus, setBookingFilterStatus] = useState('All'); // Default filter is 'All'


    // --- Effect to fetch initial provider data, services, and booking requests on component mount or providerId change ---
    useEffect(() => {
        console.log("ServiceProviderDashboard: useEffect triggered.");
        const storedProviderId = localStorage.getItem('providerId');
        // IMPORTANT: The userRole might not be set consistently or might be missing.
        // For service providers, 'providerId' in local storage is the primary indicator.
        // If your backend doesn't explicitly return a 'userRole' for service providers,
        // it's safer to rely just on 'providerId' and the route itself.
        // I'm assuming 'userRole' might not be critical or could be simplified.
        // If you intended 'userRole' to be set as 'serviceProvider' by the login,
        // ensure ServiceProviderLogin.js sets it: localStorage.setItem('userRole', 'serviceProvider');
        const storedServiceType = localStorage.getItem('serviceType'); // Get stored service type

        // Log local storage values for debugging
        console.log("Dashboard useEffect: Stored Provider ID:", storedProviderId);
        console.log("Dashboard useEffect: URL Provider ID:", providerId);
        console.log("Dashboard useEffect: Stored Service Type:", storedServiceType);

        // Authentication/Authorization Check
        if (!storedProviderId || storedProviderId !== providerId) {
            console.log("ServiceProviderDashboard: Unauthorized access attempt or ID mismatch. Redirecting.");
            setMessage('You are not authorized to view this dashboard or your session expired. Please log in.');
            // Clear potentially stale or incorrect local storage items
            localStorage.removeItem('providerId');
            localStorage.removeItem('serviceType');
            localStorage.removeItem('userRole'); // Clear if you are using it
            // Use navigate with replace: true to prevent going back to dashboard on browser back button
            navigate('/service-provider-login', { replace: true });
            return; // Stop further execution
        }

        const fetchProviderDetails = async () => {
            console.log("ServiceProviderDashboard: Inside fetchProviderDetails function.");
            if (!providerId) {
                // This case should ideally be caught by the check above, but as a safeguard:
                console.log('ServiceProviderDashboard: providerId missing, redirecting to login.');
                setError('Provider ID not found. Redirecting to login.');
                setLoading(false);
                navigate('/service-provider-login', { replace: true });
                return;
            }

            try {
                setLoading(true);
                setError(null); // Clear previous errors
                console.log(`ServiceProviderDashboard: Fetching provider details for ID: ${providerId}`);
                // Fetch provider details using the ID from the URL
                // Ensure your backend endpoint is correct: /api/providers/:providerId
                const response = await axios.get(`${API_URL}/providers/${providerId}`);
                setProvider(response.data); // Set the fetched provider data
                setMessage('Provider details loaded successfully.');

                // After loading provider details, fetch services and booking requests
                // These calls should ideally happen after the provider is confirmed.
                if (response.data?.serviceType) {
                    refetchServices(response.data.serviceType);
                }
                refetchBookingRequests();

            } catch (err) {
                console.error('ServiceProviderDashboard: Error fetching provider details:', err);
                setError('Failed to fetch provider details. Please try logging in again.');
                if (err.response) {
                    console.error("Error response status:", err.response.status);
                    console.error("Error response data:", err.response.data);
                    if (err.response.status === 401 || err.response.status === 403 || err.response.status === 404) {
                        // Unauthorized, Forbidden, or Not Found cases often mean session invalid or ID wrong
                        console.log("ServiceProviderDashboard: Redirecting to login due to API error.");
                        navigate('/service-provider-login', { replace: true });
                    }
                }
            } finally {
                console.log("ServiceProviderDashboard: fetchProviderDetails finished.");
                setLoading(false);
            }
        };

        // Only fetch details if `provider` state is null or the `providerId` from URL changes
        // This prevents unnecessary re-fetches if the component re-renders for other reasons
        // without a change in the core `providerId`.
        if (!provider || provider._id !== providerId) {
            fetchProviderDetails();
        }


    }, [providerId, navigate]); // Re-run effect if providerId or navigate changes


    // --- Function to refetch services of a specific type for the current provider ---
    const refetchServices = async (serviceType) => {
        try {
            setLoading(true);
            setError(null);
            setMessage('');
            let updatedServices = [];
            let servicesEndpoint = '';
            if (serviceType === 'Accommodation') {
                servicesEndpoint = `${API_URL}/provider/${providerId}/accommodations`;
            } else if (serviceType === 'Transportation') {
                servicesEndpoint = `${API_URL}/provider/${providerId}/transportations`;
            } else if (serviceType === 'Sport Adventure') {
                servicesEndpoint = `${API_URL}/provider/${providerId}/sports-adventures`;
            }

            if (servicesEndpoint) {
                console.log(`ServiceProviderDashboard: Refetching services from: ${servicesEndpoint}`);
                const response = await axios.get(servicesEndpoint);
                updatedServices = response.data;
            } else {
                console.warn(`ServiceProviderDashboard: Unknown service type: ${serviceType} during refetch.`);
                updatedServices = [];
            }
            setServices(updatedServices);
        } catch (err) {
            console.error(`ServiceProviderDashboard: Error refetching ${serviceType} services:`, err);
            setError(`Failed to refresh ${serviceType} list.`);
        } finally {
            setLoading(false);
        }
    };

    // --- Function to refetch booking requests for the current provider's services ---
    const refetchBookingRequests = async () => {
        try {
            setLoading(true);
            setError(null);
            setMessage('');
            console.log(`ServiceProviderDashboard: Refetching booking requests for provider: ${providerId}`);
            const response = await axios.get(`${API_URL}/provider/${providerId}/booking-requests`);
            setBookingRequests(response.data);
        } catch (err) {
            console.error("ServiceProviderDashboard: Error refetching booking requests:", err);
            setError("Failed to refresh booking requests.");
        } finally {
            setLoading(false);
        }
    };


    // --- Handlers for Navigation/View Changes ---
    const handleNavItemClick = (view) => {
        setCurrentView(view);
        setEditingService(null); // Clear editing state when changing views
        setMessage(''); // Clear messages
        setError(null); // Clear errors
        setBookingFilterStatus('All'); // Reset filter when changing views away from booking requests

        // Fetch data relevant to the selected view
        // These fetches are now consolidated within the main useEffect or triggered explicitly
        // based on the selected view.
        if (view === 'booking-summary' || view === 'booking-requests') {
            refetchBookingRequests();
        } else if (view.startsWith('my-') && provider?.serviceType) {
            refetchServices(provider.serviceType);
        }
    };


    const handleAddService = (type) => {
        setCurrentView(`add-${type.toLowerCase().replace(' ', '-')}`); // e.g., 'add-accommodation', 'add-sport-adventure'
        setEditingService(null); // Clear editing state
        setMessage(''); // Clear messages
        setError(null); // Clear errors
    };

    const handleEditService = (service) => {
        // Pass the service object and its type to the edit view
        setCurrentView(`edit-${service.serviceType.toLowerCase().replace(' ', '-')}`); // e.g., 'edit-accommodation', 'edit-sport-adventure'
        setEditingService(service); // Set the service data for editing
        setMessage(''); // Clear messages
        setError(null); // Clear errors
    };

    // Handler after a service is successfully added, updated, or deleted
    const handleServiceOperationSuccess = (serviceType) => {
        setMessage(`${serviceType} operation successful!`); // Optional success message
        setEditingService(null); // Clear editing state
        // Navigate back to the list view for that service type and refresh
        handleNavItemClick(`my-${serviceType.toLowerCase().replace(' ', '-')}s`);
        // Also refetch booking requests as service changes might affect them (e.g., deleting a service)
        refetchBookingRequests();
        // Also refetch services here to update the count on the summary tile
        if (provider?.serviceType) {
            refetchServices(provider.serviceType);
        }
    };

    // Handler after provider profile is updated
    const handleProfileUpdateSuccess = async () => {
        setMessage('Profile updated successfully!');
        // Refetch provider details to show updated info
        try {
            const providerResponse = await axios.get(`${API_URL}/providers/${providerId}`);
            setProvider(providerResponse.data);
        } catch (err) {
            console.error("Error refetching provider details after update:", err);
            setError("Profile updated, but failed to refresh details.");
        }
        setCurrentView('profile'); // Go back to profile view
    };

    // Handler after password change success
    const handlePasswordChangeSuccess = () => {
        setMessage('Password changed successfully!');
        // Stay on the change password view or navigate elsewhere
        // For now, just clear the form in the component
        // setCurrentView('profile'); // Or navigate back to profile after password change
    };

    // --- Handlers for Booking Request Actions (Approve/Reject) ---
    const handleBookingAction = async (bookingId, action) => { // action can be 'Approved' or 'Rejected'
        setMessage(''); // Clear previous messages
        setError(null); // Clear previous errors
        setLoading(true); // Start loading

        try {
            const response = await axios.put(`${API_URL}/bookings/${bookingId}/status`, {
                status: action,
                providerId: providerId // Include the providerId in the request body
            });

            console.log(`Booking ${action}d successfully:`, bookingId);
            setMessage(`Booking ${action}d successfully!`); // Set success message

            // Refresh the booking requests list and summary after action
            refetchBookingRequests();

        } catch (err) {
            console.error(`Error ${action}ing booking:`, err);
            // Set error message
            setError(`Failed to ${action} booking: ${err.response?.data?.error || err.message}`);
            setMessage(`Failed to ${action} booking: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false); // End loading
        }
    };

    // --- Handler for Logout ---
    const handleLogout = async () => {
        setMessage(''); // Clear previous messages
        setError(null); // Clear previous errors
        setLoading(true); // Start loading

        try {
            // No specific logout API endpoint needed if backend is stateless or session-based.
            // If you had a logout API, it would be called here: await axios.post(`${API_URL}/provider/logout`);
            console.log('Clearing local storage and redirecting to login.');
            localStorage.removeItem('providerId');
            localStorage.removeItem('serviceType');
            localStorage.removeItem('userRole'); // Clear if you are using it
            setMessage('Logged out successfully.');
            // Redirect to the service provider login page
            navigate('/service-provider-login', { replace: true }); // Use replace: true for logout
        } catch (err) {
            console.error('Error during logout (frontend processing):', err);
            // Even if there's a frontend error during cleanup, still try to redirect
            setError(`Failed to log out: ${err.message}`);
            setMessage(`Failed to log out: ${err.message}`);
            navigate('/service-provider-login', { replace: true });
        } finally {
            setLoading(false); // End loading
        }
    };


    // --- Conditional Rendering based on Loading/Error State ---
    if (loading && !provider) { // Show initial loading only if provider data is not yet loaded
        return <div className="dashboard-loading">Loading dashboard...</div>;
    }

    if (error && !provider) { // Show error only if provider data failed to load initially
        return <div className="dashboard-error">Error: {error}</div>;
    }

    // This condition means `provider` is null, but we've already done auth checks.
    // If it reaches here, it means the auth check failed and a redirect happened.
    // So, no need to render anything, as the `navigate` call will handle the screen.
    if (!provider) {
        return null; // Render nothing if provider data is not available after checks
    }

    // Determine the label for the total services tile based on provider type
    const totalServicesLabel = provider?.serviceType === 'Accommodation' ? 'Total Accommodations'
        : provider?.serviceType === 'Transportation' ? 'Total Transportations'
            : provider?.serviceType === 'Sport Adventure' ? 'Total Sport Adventures'
                : 'Total Services';


    // --- Helper function to render the correct component based on currentView and provider type ---
    const renderContent = () => {
        // Calculate booking counts whenever bookingRequests changes
        const pendingCount = bookingRequests.filter(req => req.status === 'Pending').length;
        const approvedCount = bookingRequests.filter(req => req.status === 'Approved').length;
        const rejectedCount = bookingRequests.filter(req => req.status === 'Rejected').length;
        const totalServicesCount = services.length; // Get the count of services


        if (currentView === 'booking-summary') {
            return (
                <div className="booking-summary">
                    <h2>Dashboard Summary</h2> {/* Updated heading */}
                    <div className="summary-tiles">
                        {/* New Tile for Total Services */}
                        <div className="summary-tile total-services-tile">
                            <h3>{totalServicesLabel}</h3> {/* Dynamic Label */}
                            <p className="count">{totalServicesCount}</p>
                        </div>
                        <div className="summary-tile pending-tile">
                            <h3>Pending Requests</h3>
                            <p className="count">{pendingCount}</p>
                        </div>
                        <div className="summary-tile approved-tile">
                            <h3>Approved Requests</h3>
                            <p className="count">{approvedCount}</p>
                        </div>
                        <div className="summary-tile rejected-tile">
                            <h3>Rejected Requests</h3>
                            <p className="count">{rejectedCount}</p>
                        </div>
                    </div>
                    {/* Optional: Add a button to view all booking requests */}
                    <button
                        className="view-all-bookings-button"
                        onClick={() => handleNavItemClick('booking-requests')}
                        disabled={loading}
                    >
                        View All Booking Requests
                    </button>
                </div>
            );
        }

        // Rest of the renderContent function remains the same
        if (currentView === 'profile') {
            return (
                <ProviderProfile
                    provider={provider}
                    onUpdateSuccess={handleProfileUpdateSuccess}
                    onError={setError}
                    loading={loading}
                    setLoading={setLoading}
                    setMessage={setMessage}
                />
            );
        }
        if (currentView === 'change-password') {
            return (
                <ChangePassword
                    providerId={providerId}
                    onSuccess={handlePasswordChangeSuccess}
                    onError={setError}
                    loading={loading}
                    setLoading={setLoading}
                    setMessage={setMessage}
                />
            );
        }
        if (currentView === 'booking-requests') {
            // Render the appropriate booking requests component based on provider type
            switch (provider.serviceType) {
                case 'Accommodation':
                    return (
                        <AccommodationBookingRequests
                            providerId={providerId} // Pass providerId down
                            bookingRequests={bookingRequests}
                            onAction={handleBookingAction} // Pass the updated handler
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                            // --- Pass filter state and setter down ---
                            filterStatus={bookingFilterStatus}
                            setFilterStatus={setBookingFilterStatus}
                        />
                    );
                case 'Transportation':
                    return (
                        <TransportationBookingRequests
                            providerId={providerId} // Pass providerId down
                            bookingRequests={bookingRequests}
                            onAction={handleBookingAction} // Pass the updated handler
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                            // --- Pass filter state and setter down ---
                            filterStatus={bookingFilterStatus}
                            setFilterStatus={setBookingFilterStatus}
                        />
                    );
                case 'Sport Adventure':
                    return (
                        <SportAdventureBookingRequests
                            providerId={providerId} // Pass providerId down
                            bookingRequests={bookingRequests}
                            onAction={handleBookingAction} // Pass the updated handler
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                            // --- Pass filter state and setter down ---
                            filterStatus={bookingFilterStatus}
                            setFilterStatus={setBookingFilterStatus}
                        />
                    );
                default:
                    return <p>Booking requests are not available for your service type.</p>;
            }
        }


        // Render service management components based on provider's service type and current view
        switch (provider.serviceType) {
            case 'Accommodation':
                if (currentView === 'my-accommodations') {
                    return (
                        <AccommodationList
                            providerId={providerId}
                            accommodations={services}
                            onEdit={handleEditService}
                            onDeleteSuccess={() => handleServiceOperationSuccess('Accommodation')}
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                        />
                    );
                } else if (currentView === 'add-accommodation') {
                    return (
                        <AccommodationForm
                            providerId={providerId}
                            onSuccess={() => handleServiceOperationSuccess('Accommodation')}
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                        />
                    );
                } else if (currentView === 'edit-accommodation' && editingService) {
                    return (
                        <AccommodationForm
                            providerId={providerId}
                            existingAccommodation={editingService}
                            onSuccess={() => handleServiceOperationSuccess('Accommodation')}
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                        />
                    );
                }
                break; // Exit switch after handling Accommodation views

            case 'Transportation':
                if (currentView === 'my-transportations') {
                    return (
                        <TransportationList
                            providerId={providerId}
                            transportations={services}
                            onEdit={handleEditService}
                            onDeleteSuccess={() => handleServiceOperationSuccess('Transportation')}
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                        />
                    );
                } else if (currentView === 'add-transportation') {
                    return (
                        <TransportationForm
                            providerId={providerId}
                            onSuccess={() => handleServiceOperationSuccess('Transportation')}
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                        />
                    );
                } else if (currentView === 'edit-transportation' && editingService) {
                    return (
                        <TransportationForm
                            providerId={providerId}
                            existingTransportation={editingService}
                            onSuccess={() => handleServiceOperationSuccess('Transportation')}
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                        />
                    );
                }
                break; // Exit switch after handling Transportation views

            case 'Sport Adventure':
                if (currentView === 'my-sports-adventures') {
                    return (
                        <SportAdventureList
                            providerId={providerId}
                            adventures={services}
                            onEdit={handleEditService}
                            onDeleteSuccess={() => handleServiceOperationSuccess('Sport Adventure')}
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                        />
                    );
                } else if (currentView === 'add-sport-adventure') {
                    return (
                        <SportAdventureForm
                            providerId={providerId}
                            onSuccess={() => handleServiceOperationSuccess('Sport Adventure')}
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                        />
                    );
                }
                else if (currentView === 'edit-sport adventure' && editingService) {
                    return (
                        <SportAdventureForm
                            providerId={providerId}
                            existingAdventure={editingService}
                            onSuccess={() => handleServiceOperationSuccess('Sport Adventure')}
                            onError={setError}
                            loading={loading}
                            setLoading={setLoading}
                            setMessage={setMessage}
                        />
                    );
                }
                break; // Exit switch after handling Sport Adventure views

            default:
                // Default content if service type doesn't match or no view is selected
                return <p>Select an option from the menu.</p>;
        }

        // Fallback if currentView doesn't match any case (e.g., after edit/add success before list reloads)
        return <p>Loading content...</p>;
    };


    return (
        <div className="provider-dashboard-layout">
            {/* Left Navigation Panel */}
            <div className="dashboard-sidebar">
                <h2>Dashboard Menu</h2>
                <nav>
                    <ul>
                        {/* Booking Summary Nav Item */}
                        <li>
                            <button
                                className={currentView === 'booking-summary' ? 'active' : ''}
                                onClick={() => handleNavItemClick('booking-summary')}
                                disabled={loading}
                            >
                                Dashboard Summary
                            </button>
                        </li>
                        <li>
                            <button
                                className={currentView === 'profile' ? 'active' : ''}
                                onClick={() => handleNavItemClick('profile')}
                                disabled={loading}
                            >
                                Profile Management
                            </button>
                        </li>
                        {/* Show service type specific navigation based on provider's registered type */}
                        {provider?.serviceType === 'Accommodation' && (
                            <>
                                <li>
                                    <button
                                        className={currentView === 'my-accommodations' ? 'active' : ''}
                                        onClick={() => handleNavItemClick('my-accommodations')}
                                        disabled={loading}
                                    >
                                        My Accommodations
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={currentView === 'add-accommodation' ? 'active' : ''}
                                        onClick={() => handleAddService('Accommodation')} // Use handleAddService to set view
                                        disabled={loading}
                                    >
                                        Add Accommodation
                                    </button>
                                </li>
                            </>
                        )}
                        {provider?.serviceType === 'Transportation' && (
                            <>
                                <li>
                                    <button
                                        className={currentView === 'my-transportations' ? 'active' : ''}
                                        onClick={() => handleNavItemClick('my-transportations')}
                                        disabled={loading}
                                    >
                                        My Transportation
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={currentView === 'add-transportation' ? 'active' : ''}
                                        onClick={() => handleAddService('Transportation')}
                                        disabled={loading}
                                    >
                                        Add Transportation
                                    </button>
                                </li>
                            </>
                        )}
                        {provider?.serviceType === 'Sport Adventure' && (
                            <>
                                <li>
                                    <button
                                        className={currentView === 'my-sports-adventures' ? 'active' : ''}
                                        onClick={() => handleNavItemClick('my-sports-adventures')}
                                        disabled={loading}
                                    >
                                        My Sport Adventures
                                    </button>
                                </li>
                                <li>
                                    <button
                                        className={currentView === 'add-sport adventure' ? 'active' : ''}
                                        onClick={() => handleAddService('Sport Adventure')}
                                        disabled={loading}
                                    >
                                        Add Sport Adventure
                                    </button>
                                </li>
                            </>
                        )}
                        {/* Booking Requests link (assuming it's relevant for all service types) */}
                        {/* Show booking requests link only if provider data is loaded */}
                        {provider && (
                            <li>
                                <button
                                    className={currentView === 'booking-requests' ? 'active' : ''}
                                    onClick={() => handleNavItemClick('booking-requests')}
                                    disabled={loading}
                                >
                                    View All Booking Requests
                                </button>
                            </li>
                        )}
                        <li>
                            <button
                                className={currentView === 'change-password' ? 'active' : ''}
                                onClick={() => handleNavItemClick('change-password')}
                                disabled={loading}
                            >
                                Change Password
                            </button>
                        </li>
                        {/* Add Logout Button */}
                        <li>
                            <button
                                onClick={handleLogout} // Call the new handleLogout function
                                disabled={loading} // Disable button while loading/logging out
                                className="logout-button" // Add a class for styling
                            >
                                Logout
                            </button>
                        </li>
                    </ul>
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="dashboard-main-content">
                {/* Display provider name and service type if provider data is loaded */}
                {provider && (
                    <>
                        <h1>Welcome, {provider.name}!</h1>
                        <p>Service Type: {provider.serviceType}</p>
                    </>
                )}


                {/* Message Display */}
                {message && (
                    <div className={`dashboard-message ${message.includes('failed') || message.includes('error') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                {/* Render the content based on the current view */}
                {renderContent()}

            </div>
        </div>
    );
};

export default ServiceProviderDashboard;
