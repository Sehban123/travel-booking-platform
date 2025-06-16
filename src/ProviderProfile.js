import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/ProviderProfile.css';

const API_URL = 'http://localhost:5000'; // Define base API URL for serving static files

// --- Static Options for Checkboxes/Dropdowns (Reused from ServiceProviderLogin) ---
const ROOM_TYPES = ['Single', 'Double', 'Suite', 'Dormitory', 'Family Room', 'Deluxe', 'Standard'];
const ACCOMMODATION_FACILITIES = ['WiFi', 'Parking', 'Breakfast', 'AC', 'Pool', 'Room Service', 'Restaurant', 'Gym', 'Spa', 'Laundry', 'Conference Room'];
// Note: VEHICLE_TYPES is not used here as transportation details are business-level
const ADVENTURE_ACTIVITIES = ['Trekking', 'Paragliding', 'Scuba Diving', 'Zipline', 'Boating', 'Safari', 'Camping', 'River Rafting', 'Rock Climbing', 'Bungee Jumping'];

// Removed 'setMessage' and 'onError' from props, as they will now be handled locally.
// The parent (ServiceProviderDashboard) can still use onUpdateSuccess to refresh its data.
const ProviderProfile = ({ provider, onUpdateSuccess, loading, setLoading }) => {
    // Local state for messages within this component
    const [message, setMessage] = useState('');
    const [error, setError] = useState(''); // Use a separate state for errors

    // State for form data, initialized with provider data
    const [formData, setFormData] = useState({
        // Basic Information
        businessName: '',
        ownerFullName: '',
        serviceType: '', // Display only
        businessRegistrationNumber: '',
        contactNumber: '',
        whatsappNumber: '',
        email: '', // Display only
        alternateContactPerson: '',
        fullBusinessAddress: '',
        state: '',
        city: '',
        pinCode: '',
        websiteSocialMediaLink: '',
        preferredModeOfContact: '',
        message: '', // This 'message' refers to the provider's general message field

        // Conditional Service Details (initialized as empty objects or with default values)
        accommodationDetails: { // Kept in state, but not rendered in this component's form/view
            hotelCategory: '',
            totalRoomsAvailable: '',
            roomTypesOffered: [],
            facilitiesAvailable: [],
            checkInCheckOutTime: '',
            govtTourismRegistrationNo: ''
        },
        transportationDetails: {
            fleetSize: '',
            serviceAreas: '',
            operatingHours: '',
            transportationLicenseNumber: '',
            fleetInsuranceDetails: '',
        },
        sportAdventureDetails: {
            typeOfAdventureActivity: [],
            activityLocations: '',
            certifiedInstructorsAvailable: '',
            safetyEquipmentProvided: '',
            maxParticipantsPerSession: '',
            insuranceCoverForCustomers: '',
            govtLicensesPermits: ''
        },
        // Document filenames (display only)
        aadharPanCard: '',
        businessRegistrationCertificate: '',
        bankAccountDetails: '',
        gstNumber: '',
        servicePhotos: [],
    });

    const [isEditing, setIsEditing] = useState(false); // State to toggle between view and edit mode

    // Effect to initialize form data when the provider prop changes
    useEffect(() => {
        if (provider) {
            setFormData({
                businessName: provider.businessName || '',
                ownerFullName: provider.ownerFullName || '',
                serviceType: provider.serviceType || '',
                businessRegistrationNumber: provider.businessRegistrationNumber || '',
                contactNumber: provider.phoneNumber || '', // Use phoneNumber from backend
                whatsappNumber: provider.whatsappNumber || '',
                email: provider.email || '',
                alternateContactPerson: provider.alternateContactPerson || '',
                fullBusinessAddress: provider.fullBusinessAddress || '',
                state: provider.state || '',
                city: provider.city || '',
                pinCode: provider.pinCode || '',
                websiteSocialMediaLink: provider.websiteSocialMediaLink || '',
                preferredModeOfContact: provider.preferredModeOfContact || '',
                message: provider.message || '', // This is the provider's message field, not the UI message

                accommodationDetails: {
                    hotelCategory: provider.accommodationDetails?.hotelCategory || '',
                    totalRoomsAvailable: provider.accommodationDetails?.totalRoomsAvailable || '',
                    roomTypesOffered: provider.accommodationDetails?.roomTypesOffered || [],
                    facilitiesAvailable: provider.accommodationDetails?.facilitiesAvailable || [],
                    checkInCheckOutTime: provider.accommodationDetails?.checkInCheckOutTime || '',
                    govtTourismRegistrationNo: provider.accommodationDetails?.govtTourismRegistrationNo || ''
                },
                transportationDetails: {
                    fleetSize: provider.transportationDetails?.fleetSize || '',
                    serviceAreas: provider.transportationDetails?.serviceAreas || '',
                    operatingHours: provider.transportationDetails?.operatingHours || '',
                    transportationLicenseNumber: provider.transportationDetails?.transportationLicenseNumber || '',
                    fleetInsuranceDetails: provider.transportationDetails?.fleetInsuranceDetails || '',
                },
                sportAdventureDetails: {
                    typeOfAdventureActivity: provider.sportAdventureDetails?.typeOfAdventureActivity || [],
                    activityLocations: provider.sportAdventureDetails?.activityLocations || '',
                    certifiedInstructorsAvailable: provider.sportAdventureDetails?.certifiedInstructorsAvailable || '',
                    safetyEquipmentProvided: provider.sportAdventureDetails?.safetyEquipmentProvided || '',
                    maxParticipantsPerSession: provider.sportAdventureDetails?.maxParticipantsPerSession || '',
                    insuranceCoverForCustomers: provider.sportAdventureDetails?.insuranceCoverForCustomers || '',
                    govtLicensesPermits: provider.sportAdventureDetails?.govtLicensesPermits || ''
                },
                aadharPanCard: provider.aadharPanCard || '',
                businessRegistrationCertificate: provider.businessRegistrationCertificate || '',
                bankAccountDetails: provider.bankAccountDetails || '',
                gstNumber: provider.gstNumber || '',
                servicePhotos: provider.servicePhotos || [],
            });
        }
        setMessage(''); // Clear local success message on load/reset
        setError(''); // Clear local error message on load/reset
    }, [provider]); // Depend on provider prop

    // Handle input changes for top-level fields
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle input changes for nested service-specific details
    const handleServiceDetailsChange = (e, section) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [section]: {
                ...prevData[section],
                [name]: value
            }
        }));
    };

    // Handle checkbox group inputs (e.g., roomTypesOffered, facilitiesAvailable)
    const handleCheckboxGroupChange = (e, section, field) => {
        const { value, checked } = e.target;
        setFormData(prevData => {
            const currentArray = prevData[section][field] || [];
            if (checked) {
                return {
                    ...prevData,
                    [section]: {
                        ...prevData[section],
                        [field]: [...currentArray, value]
                    }
                };
            } else {
                return {
                    ...prevData,
                    [section]: {
                        ...prevData[section],
                        [field]: currentArray.filter(item => item !== value)
                    }
                };
            }
        });
    };

    // Handle radio button changes (e.g., certifiedInstructorsAvailable)
    const handleRadioChange = (e, section, field) => {
        const { value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [section]: {
                ...prevData[section],
                [field]: value
            }
        }));
    };

    // Toggle between viewing and editing mode
    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setMessage(''); // Clear local messages on toggle
        setError('');   // Clear local errors on toggle
        // Reset form data if cancelling edit
        if (isEditing && provider) {
            setFormData({
                businessName: provider.businessName || '',
                ownerFullName: provider.ownerFullName || '',
                serviceType: provider.serviceType || '',
                businessRegistrationNumber: provider.businessRegistrationNumber || '',
                contactNumber: provider.phoneNumber || '',
                whatsappNumber: provider.whatsappNumber || '',
                email: provider.email || '',
                alternateContactPerson: provider.alternateContactPerson || '',
                fullBusinessAddress: provider.fullBusinessAddress || '',
                state: provider.state || '',
                city: provider.city || '',
                pinCode: provider.pinCode || '',
                websiteSocialMediaLink: provider.websiteSocialMediaLink || '',
                preferredModeOfContact: provider.preferredModeOfContact || '',
                message: provider.message || '', // This is the provider's message field, not the UI message
                accommodationDetails: {
                    hotelCategory: provider.accommodationDetails?.hotelCategory || '',
                    totalRoomsAvailable: provider.accommodationDetails?.totalRoomsAvailable || '',
                    roomTypesOffered: provider.accommodationDetails?.roomTypesOffered || [],
                    facilitiesAvailable: provider.accommodationDetails?.facilitiesAvailable || [],
                    checkInCheckOutTime: provider.accommodationDetails?.checkInCheckOutTime || '',
                    govtTourismRegistrationNo: provider.accommodationDetails?.govtTourismRegistrationNo || ''
                },
                transportationDetails: {
                    fleetSize: provider.transportationDetails?.fleetSize || '',
                    serviceAreas: provider.transportationDetails?.serviceAreas || '',
                    operatingHours: provider.transportationDetails?.operatingHours || '',
                    transportationLicenseNumber: provider.transportationDetails?.transportationLicenseNumber || '',
                    fleetInsuranceDetails: provider.transportationDetails?.fleetInsuranceDetails || '',
                },
                sportAdventureDetails: {
                    typeOfAdventureActivity: provider.sportAdventureDetails?.typeOfAdventureActivity || [],
                    activityLocations: provider.sportAdventureDetails?.activityLocations || '',
                    certifiedInstructorsAvailable: provider.sportAdventureDetails?.certifiedInstructorsAvailable || '',
                    safetyEquipmentProvided: provider.sportAdventureDetails?.safetyEquipmentProvided || '',
                    maxParticipantsPerSession: provider.sportAdventureDetails?.maxParticipantsPerSession || '',
                    insuranceCoverForCustomers: provider.sportAdventureDetails?.insuranceCoverForCustomers || '',
                    govtLicensesPermits: provider.sportAdventureDetails?.govtLicensesPermits || ''
                },
                aadharPanCard: provider.aadharPanCard || '',
                businessRegistrationCertificate: provider.businessRegistrationCertificate || '',
                bankAccountDetails: provider.bankAccountDetails || '',
                gstNumber: provider.gstNumber || '',
                servicePhotos: provider.servicePhotos || [],
            });
        }
    };

    // Helper function to render document links with download functionality
    const renderDocumentLink = (filename, folder = 'documents') => {
        if (!filename) return 'N/A';

        const fileExtension = filename.split('.').pop().toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
        const fileUrl = `${API_URL}/${folder}/${filename}`; // Correct base URL

        return (
            <a
                href={fileUrl}
                target="_blank" // Opens in a new tab
                rel="noopener noreferrer" // Security best practice for target="_blank"
                className="document-link"
                download={filename} // Suggests the filename for download
            >
                {isImage ? (
                    // Display image thumbnail if it's an image
                    <img
                        src={fileUrl}
                        alt={filename}
                        className="document-thumbnail"
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/50x50?text=File`; }}
                    />
                ) : (
                    // Display filename for non-image documents
                    <span>{filename}</span>
                )}
            </a>
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); // Indicate loading
        setMessage(''); // Clear previous messages
        setError(''); // Clear previous errors

        const payload = new FormData();
        // Append all text fields from formData to the payload
        for (const key in formData) {
            // Skip document/image file fields as they are view-only here
            if (['aadharPanCard', 'businessRegistrationCertificate', 'bankAccountDetails', 'gstNumber', 'servicePhotos'].includes(key)) {
                continue;
            }
            // Skip the accommodationDetails object as per previous user request to remove it from form/display
            if (key === 'accommodationDetails') {
                continue;
            }

            if (typeof formData[key] === 'object' && formData[key] !== null) {
                // For nested service details objects (transportationDetails, sportAdventureDetails)
                // stringify them if they are complex objects to be sent as JSON strings
                // or ensure your backend parses them from FormData correctly.
                // Assuming simple flat fields here or backend handles JSON.stringify
                if (key === 'transportationDetails' || key === 'sportAdventureDetails') {
                    // Check if the service type matches before sending these details
                    if ((key === 'transportationDetails' && formData.serviceType === 'Transportation') ||
                        (key === 'sportAdventureDetails' && formData.serviceType === 'Sport Adventure')) {
                        payload.append(key, JSON.stringify(formData[key]));
                    }
                } else if (Array.isArray(formData[key])) {
                    // Handle array fields, ensuring they are sent correctly (e.g., joined by comma or as separate appends)
                    // For checkboxes, sending as JSON string array is common with multipart/form-data
                    payload.append(key, JSON.stringify(formData[key]));
                } else {
                    payload.append(key, formData[key]);
                }
            } else if (formData[key] !== null && formData[key] !== undefined) {
                 payload.append(key, formData[key]);
            }
        }

        // IMPORTANT: Ensure the providerId is included for the PUT request
        payload.append('providerId', provider._id);

        try {
            const response = await axios.put(`${API_URL}/api/providers/${provider._id}`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data', // Important for sending FormData
                },
            });
            console.log('Provider profile updated successfully:', response.data);
            setMessage('Profile updated successfully!');
            setError(''); // Clear any previous errors on success
            onUpdateSuccess(); // Notify parent to refresh data
            setIsEditing(false); // Exit edit mode
        } catch (err) {
            console.error('Error updating provider profile:', err);
            const errMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update profile. Please try again.';
            setError(errMessage);
            setMessage(''); // Clear success message if there's an error
        } finally {
            setLoading(false); // Stop loading
        }
    };

    if (loading) {
        return <div className="profile-container">Loading profile...</div>;
    }

    if (!provider) {
        return <div className="profile-container">No provider data found.</div>;
    }

    // Determine which service details to display based on provider.serviceType
    const renderServiceSpecificDetails = () => {
        // Accommodation details are no longer rendered here
        switch (provider.serviceType) {
            case 'Transportation':
                return (
                    <div className="profile-subsection">
                        <h3>Transportation Details</h3>
                        <p><strong>Fleet Size:</strong> {provider.transportationDetails?.fleetSize || 'N/A'}</p>
                        <p><strong>Service Areas:</strong> {provider.transportationDetails?.serviceAreas || 'N/A'}</p>
                        <p><strong>Operating Hours:</strong> {provider.transportationDetails?.operatingHours || 'N/A'}</p>
                        <p><strong>Transportation License No.:</strong> {provider.transportationDetails?.transportationLicenseNumber || 'N/A'}</p>
                        <p><strong>Fleet Insurance Details:</strong> {provider.transportationDetails?.fleetInsuranceDetails || 'N/A'}</p>
                    </div>
                );
            case 'Sport Adventure':
                return (
                    <div className="profile-subsection">
                        <h3>Sport Adventure Details</h3>
                        <p>
                            <strong>Type of Activity:</strong>{' '}
                            {provider.sportAdventureDetails?.typeOfAdventureActivity && provider.sportAdventureDetails.typeOfAdventureActivity.length > 0
                                ? provider.sportAdventureDetails.typeOfAdventureActivity.join(', ')
                                : 'N/A'}
                        </p>
                        <p><strong>Activity Locations:</strong> {provider.sportAdventureDetails?.activityLocations || 'N/A'}</p>
                        <p><strong>Certified Instructors Available:</strong> {provider.sportAdventureDetails?.certifiedInstructorsAvailable || 'N/A'}</p>
                        <p><strong>Safety Equipment Provided:</strong> {provider.sportAdventureDetails?.safetyEquipmentProvided || 'N/A'}</p>
                        <p><strong>Max Participants Per Session:</strong> {provider.sportAdventureDetails?.maxParticipantsPerSession || 'N/A'}</p>
                        <p><strong>Insurance Cover for Customers:</strong> {provider.sportAdventureDetails?.insuranceCoverForCustomers || 'N/A'}</p>
                        <p><strong>Govt. Licenses/Permits:</strong> {provider.sportAdventureDetails?.govtLicensesPermits || 'N/A'}</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="profile-container">
            <h2>Service Provider Profile</h2>
            {message && ( // Now refers to local 'message' state
                <div className={`profile-message success`}>
                    {message}
                </div>
            )}
            {error && ( // Display error message
                <div className={`profile-message error`}>
                    {error}
                </div>
            )}

            {!isEditing ? (
                // View Mode
                <div className="profile-view-mode">
                    <div className="profile-subsection">
                        <h3>Basic Information</h3>
                        <p><strong>Business Name:</strong> {provider.businessName || 'N/A'}</p>
                        <p><strong>Owner Full Name:</strong> {provider.ownerFullName || 'N/A'}</p>
                        <p><strong>Service Type:</strong> {provider.serviceType || 'N/A'}</p>
                        <p><strong>Business Reg. No.:</strong> {provider.businessRegistrationNumber || 'N/A'}</p>
                        <p><strong>Contact No.:</strong> {provider.phoneNumber || 'N/A'}</p>
                        <p><strong>WhatsApp No.:</strong> {provider.whatsappNumber || 'N/A'}</p>
                        <p><strong>Email:</strong> {provider.email || 'N/A'}</p>
                        <p><strong>Alternate Contact Person:</strong> {provider.alternateContactPerson || 'N/A'}</p>
                        <p><strong>Full Business Address:</strong> {provider.fullBusinessAddress || 'N/A'}</p>
                        <p><strong>State:</strong> {provider.state || 'N/A'}</p>
                        <p><strong>City:</strong> {provider.city || 'N/A'}</p>
                        <p><strong>PIN Code:</strong> {provider.pinCode || 'N/A'}</p>
                        <p><strong>Website/Social Media:</strong> {provider.websiteSocialMediaLink ? <a href={provider.websiteSocialMediaLink} target="_blank" rel="noopener noreferrer">{provider.websiteSocialMediaLink}</a> : 'N/A'}</p>
                        <p><strong>Preferred Mode of Contact:</strong> {provider.preferredModeOfContact || 'N/A'}</p>
                        <p><strong>Status:</strong> <span className={`status-${provider.status?.toLowerCase()}`}>{provider.status || 'N/A'}</span></p>
                        <p><strong>Remarks (Admin):</strong> {provider.remarks || 'N/A'}</p>
                        <p><strong>Application Date:</strong> {provider.applicationDate ? new Date(provider.applicationDate).toLocaleDateString() : 'N/A'}</p>
                    </div>

                    {renderServiceSpecificDetails()}

                    {/* Documents are display-only in view mode */}
                    <div className="profile-subsection">
                        <h3>Uploaded Documents (View Only)</h3>
                        <p><strong>Aadhar/PAN Card:</strong> {renderDocumentLink(provider?.aadharPanCard, 'documents')}</p>
                        <p><strong>Business Reg. Cert.:</strong> {renderDocumentLink(provider?.businessRegistrationCertificate, 'documents')}</p>
                        <p><strong>Bank Account Details:</strong> {renderDocumentLink(provider?.bankAccountDetails, 'documents')}</p>
                        <p><strong>GST Number:</strong> {renderDocumentLink(provider?.gstNumber, 'documents')}</p>
                        <p>
                            <strong>Service Photos:</strong>
                            {provider?.servicePhotos && Array.isArray(provider.servicePhotos) && provider.servicePhotos.length > 0 ? (
                                provider.servicePhotos.map((photoPath, index) => (
                                    <span key={index}>
                                        {renderDocumentLink(photoPath, 'images')}
                                        {index < provider.servicePhotos.length - 1 && ', '}
                                    </span>
                                ))
                            ) : (
                                'N/A'
                            )}
                        </p>
                    </div>

                    <div className="profile-form-actions">
                        <button type="button" onClick={handleEditToggle} disabled={loading}>Edit Profile</button>
                    </div>
                </div>
            ) : (
                // Edit Mode
                <form className="profile-edit-mode" onSubmit={handleSubmit}>
                    <h3>Edit Profile Information</h3>

                    <div className="form-group">
                        <label htmlFor="businessName">Business Name:</label>
                        <input type="text" id="businessName" name="businessName" value={formData.businessName} onChange={handleInputChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ownerFullName">Owner Full Name:</label>
                        <input type="text" id="ownerFullName" name="ownerFullName" value={formData.ownerFullName} onChange={handleInputChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label>Service Type:</label>
                        <input type="text" value={formData.serviceType} disabled className="disabled-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="businessRegistrationNumber">Business Registration Number (Optional):</label>
                        <input type="text" id="businessRegistrationNumber" name="businessRegistrationNumber" value={formData.businessRegistrationNumber} onChange={handleInputChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="contactNumber">Contact Number:</label>
                        <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="whatsappNumber">WhatsApp Number (Optional):</label>
                        <input type="tel" id="whatsappNumber" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input type="email" value={formData.email} disabled className="disabled-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="alternateContactPerson">Alternate Contact Person (Optional):</label>
                        <input type="text" id="alternateContactPerson" name="alternateContactPerson" value={formData.alternateContactPerson} onChange={handleInputChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="fullBusinessAddress">Full Business Address:</label>
                        <textarea id="fullBusinessAddress" name="fullBusinessAddress" value={formData.fullBusinessAddress} onChange={handleInputChange} rows="3" required disabled={loading}></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="state">State:</label>
                        <input type="text" id="state" name="state" value={formData.state} onChange={handleInputChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="city">City:</label>
                        <input type="text" id="city" name="city" value={formData.city} onChange={handleInputChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="pinCode">PIN Code:</label>
                        <input type="text" id="pinCode" name="pinCode" value={formData.pinCode} onChange={handleInputChange} required disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="websiteSocialMediaLink">Website/Social Media Link (Optional):</label>
                        <input type="url" id="websiteSocialMediaLink" name="websiteSocialMediaLink" value={formData.websiteSocialMediaLink} onChange={handleInputChange} disabled={loading} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="preferredModeOfContact">Preferred Mode of Contact:</label>
                        <select id="preferredModeOfContact" name="preferredModeOfContact" value={formData.preferredModeOfContact} onChange={handleInputChange} required disabled={loading}>
                            <option value="">Select</option>
                            <option value="Phone">Phone</option>
                            <option value="Email">Email</option>
                            <option value="WhatsApp">WhatsApp</option>
                        </select>
                    </div>

                    {/* Conditional Service Details Forms - Accommodation details are now removed */}
                    {formData.serviceType === 'Transportation' && (
                        <div className="profile-subsection-form">
                            <h3>Transportation Service Details</h3>
                            <div className="form-group">
                                <label htmlFor="fleetSize">Fleet Size:</label>
                                <input type="number" id="fleetSize" name="fleetSize" value={formData.transportationDetails.fleetSize} onChange={(e) => handleServiceDetailsChange(e, 'transportationDetails')} min="0" disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="serviceAreas">Service Areas:</label>
                                <textarea id="serviceAreas" name="serviceAreas" value={formData.transportationDetails.serviceAreas} onChange={(e) => handleServiceDetailsChange(e, 'transportationDetails')} disabled={loading}></textarea>
                            </div>
                            <div className="form-group">
                                <label htmlFor="operatingHours">Operating Hours:</label>
                                <input type="text" id="operatingHours" name="operatingHours" value={formData.transportationDetails.operatingHours} onChange={(e) => handleServiceDetailsChange(e, 'transportationDetails')} disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="transportationLicenseNumber">Transportation License Number:</label>
                                <input type="text" id="transportationLicenseNumber" name="transportationLicenseNumber" value={formData.transportationDetails.transportationLicenseNumber} onChange={(e) => handleServiceDetailsChange(e, 'transportationDetails')} disabled={loading} />
                            </div>
                            <div className="form-group">
                                <label htmlFor="fleetInsuranceDetails">Fleet Insurance Details:</label>
                                <textarea id="fleetInsuranceDetails" name="fleetInsuranceDetails" value={formData.transportationDetails.fleetInsuranceDetails} onChange={(e) => handleServiceDetailsChange(e, 'transportationDetails')} disabled={loading}></textarea>
                            </div>
                        </div>
                    )}

                    {formData.serviceType === 'Sport Adventure' && (
                        <div className="profile-subsection-form">
                            <h3>Sport Adventure Service Details</h3>
                            <div className="form-group checkbox-group">
                                <label>Type of Adventure Activity:</label>
                                {ADVENTURE_ACTIVITIES.map(activity => (
                                    <label key={activity}>
                                        <input
                                            type="checkbox"
                                            value={activity}
                                            checked={formData.sportAdventureDetails.typeOfAdventureActivity.includes(activity)}
                                            onChange={(e) => handleCheckboxGroupChange(e, 'sportAdventureDetails', 'typeOfAdventureActivity')}
                                            disabled={loading}
                                        />
                                        {activity}
                                    </label>
                                ))}
                            </div>
                            <div className="form-group">
                                <label htmlFor="activityLocations">Activity Locations:</label>
                                <textarea id="activityLocations" name="activityLocations" value={formData.sportAdventureDetails.activityLocations} onChange={(e) => handleServiceDetailsChange(e, 'sportAdventureDetails')} disabled={loading}></textarea>
                            </div>
                            <div className="form-group radio-group">
                                <label>Certified Instructors Available:</label>
                                <label><input type="radio" name="certifiedInstructorsAvailable" value="Yes" checked={formData.sportAdventureDetails.certifiedInstructorsAvailable === 'Yes'} onChange={(e) => handleRadioChange(e, 'sportAdventureDetails', 'certifiedInstructorsAvailable')} disabled={loading} /> Yes</label>
                                <label><input type="radio" name="certifiedInstructorsAvailable" value="No" checked={formData.sportAdventureDetails.certifiedInstructorsAvailable === 'No'} onChange={(e) => handleRadioChange(e, 'sportAdventureDetails', 'certifiedInstructorsAvailable')} disabled={loading} /> No</label>
                            </div>
                            <div className="form-group radio-group">
                                <label>Safety Equipment Provided:</label>
                                <label><input type="radio" name="safetyEquipmentProvided" value="Yes" checked={formData.sportAdventureDetails.safetyEquipmentProvided === 'Yes'} onChange={(e) => handleRadioChange(e, 'sportAdventureDetails', 'safetyEquipmentProvided')} disabled={loading} /> Yes</label>
                                <label><input type="radio" name="safetyEquipmentProvided" value="No" checked={formData.sportAdventureDetails.safetyEquipmentProvided === 'No'} onChange={(e) => handleRadioChange(e, 'sportAdventureDetails', 'safetyEquipmentProvided')} disabled={loading} /> No</label>
                            </div>
                            <div className="form-group">
                                <label htmlFor="maxParticipantsPerSession">Max Participants Per Session:</label>
                                <input type="number" id="maxParticipantsPerSession" name="maxParticipantsPerSession" value={formData.sportAdventureDetails.maxParticipantsPerSession} onChange={(e) => handleServiceDetailsChange(e, 'sportAdventureDetails')} min="1" disabled={loading} />
                            </div>
                            <div className="form-group radio-group">
                                <label>Insurance Cover For Customers:</label>
                                <label><input type="radio" name="insuranceCoverForCustomers" value="Yes" checked={formData.sportAdventureDetails.insuranceCoverForCustomers === 'Yes'} onChange={(e) => handleRadioChange(e, 'sportAdventureDetails', 'insuranceCoverForCustomers')} disabled={loading} /> Yes</label>
                                <label><input type="radio" name="insuranceCoverForCustomers" value="No" checked={formData.sportAdventureDetails.insuranceCoverForCustomers === 'No'} onChange={(e) => handleRadioChange(e, 'sportAdventureDetails', 'insuranceCoverForCustomers')} disabled={loading} /> No</label>
                            </div>
                            <div className="form-group">
                                <label htmlFor="govtLicensesPermits">Govt. Licenses/Permits:</label>
                                <textarea id="govtLicensesPermits" name="govtLicensesPermits" value={formData.sportAdventureDetails.govtLicensesPermits} onChange={(e) => handleServiceDetailsChange(e, 'sportAdventureDetails')} disabled={loading}></textarea>
                            </div>
                        </div>
                    )}

                    {/* Documents are display-only in edit mode */}
                    <div className="profile-subsection-form">
                        <h3>Uploaded Documents (View Only)</h3>
                        <p><strong>Aadhar/PAN Card:</strong> {renderDocumentLink(provider?.aadharPanCard, 'documents')}</p>
                        <p><strong>Business Reg. Cert.:</strong> {renderDocumentLink(provider?.businessRegistrationCertificate, 'documents')}</p>
                        <p><strong>Bank Account Details:</strong> {renderDocumentLink(provider?.bankAccountDetails, 'documents')}</p>
                        <p><strong>GST Number:</strong> {renderDocumentLink(provider?.gstNumber, 'documents')}</p>
                        <p>
                            <strong>Service Photos:</strong>
                            {provider?.servicePhotos && Array.isArray(provider.servicePhotos) && provider.servicePhotos.length > 0 ? (
                                provider.servicePhotos.map((photoPath, index) => (
                                    <span key={index}>
                                        {renderDocumentLink(photoPath, 'images')}
                                        {index < provider.servicePhotos.length - 1 && ', '}
                                    </span>
                                ))
                            ) : (
                                'N/A'
                            )}
                        </p>
                    </div>

                    <div className="profile-form-actions">
                        <button type="submit" disabled={loading}>Save Changes</button>
                        <button type="button" onClick={handleEditToggle} disabled={loading}>Cancel</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default ProviderProfile;
