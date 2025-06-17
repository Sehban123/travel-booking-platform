import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/TransportationForm.css'; // Import the dedicated CSS file

// Define API URL (base URL of your server)
const API_URL = 'https://travel-booking-backend.onrender.com'; // Changed to base URL

// Define a list of available transportation types for the dropdown
const availableTransportTypes = [
    '', // Empty option for default/placeholder
    'Car',
    'Bike',
    'Bus',
    'Van',
    'Truck',
    'Taxi',
    'Auto Rickshaw',
    'Tempo Traveler',
    // Add more types as needed
];

// Define a list of common transportation features
const availableFeatures = [
    'Air Conditioning',
    'GPS Navigation',
    'Child Seat Available',
    'Wheelchair Accessible',
    'Pet Friendly',
    'Extra Luggage Space',
    'Wi-Fi Onboard',
    'Music Player',
    'Charging Ports',
    'Tinted Windows',
    'Sunroof'
    // Add more features as needed
];


const TransportationForm = ({ providerId, existingTransportation, onSuccess, onError, loading, setLoading, setMessage }) => {
    // State for form data, initialized based on whether editing or adding
    const [formData, setFormData] = useState({
        driver_name: '',
        transport_type: '', // Will be selected from dropdown
        model: '',
        price_per_day: '',
        rating: '', // Kept as string for input, will parse to number/string on submit
        termsAndConditions: ''
    });

    // State to hold the selected image file for upload
    const [selectedImage, setSelectedImage] = useState(null);
    // State to hold the existing image URL/path when editing
    const [existingImageUrl, setExistingImageUrl] = useState('');

    // State to hold the selected features (array of strings)
    const [selectedFeatures, setSelectedFeatures] = useState([]);

    // State for custom feature input
    const [customFeature, setCustomFeature] = useState('');
    const [addCustomFeature, setAddCustomFeature] = useState(false);

    // State to hold the transportation ID when editing (the automatically generated one)
    const [editTransportationID, setEditTransportationID] = useState('');

    // Removed termsAccepted state as it's a provider form

    // Message display is handled by the parent ProviderDashboard

    // Effect to populate form data when editing an existing transportation item
    useEffect(() => {
        if (existingTransportation) {
            // Populate form for editing
            setEditTransportationID(existingTransportation._id || ''); // Use _id from Mongoose document
            setFormData({
                driver_name: existingTransportation.driver_name || '',
                transport_type: existingTransportation.transport_type || '',
                model: existingTransportation.model || '',
                price_per_day: existingTransportation.price_per_day || '',
                rating: existingTransportation.rating || '',
                termsAndConditions: existingTransportation.termsAndConditions || ''
            });
            // Set the existing image URL for display
            if (existingTransportation.image) {
                setExistingImageUrl(`${API_URL}/images/${existingTransportation.image}`);
            } else {
                 setExistingImageUrl(''); // Clear if no existing image
            }

            // Populate selectedFeatures from existingTransportation.features
            if (Array.isArray(existingTransportation.features)) {
                setSelectedFeatures(existingTransportation.features);
            } else if (existingTransportation.features && typeof existingTransportation.features === 'string') {
                // If features is stored as a comma-separated string, parse it into an array
                setSelectedFeatures(existingTransportation.features.split(',').map(item => item.trim()).filter(item => item));
            } else {
                setSelectedFeatures([]);
            }

            // Check if existing features include a custom one
            const existingFeatures = existingTransportation.features || [];
            // Find the first feature that is *not* in the predefined list
            const customExistingFeature = existingFeatures.find(f => f && !availableFeatures.includes(f)); // Added check for f
            if (customExistingFeature) {
                setAddCustomFeature(true);
                setCustomFeature(customExistingFeature);
            } else {
                setAddCustomFeature(false);
                setCustomFeature('');
            }

             // No terms acceptance checkbox for provider form
        } else {
            // Reset form for adding new item
            setFormData({
                driver_name: '',
                transport_type: '',
                model: '',
                price_per_day: '',
                rating: '',
                termsAndConditions: ''
            });
            setEditTransportationID('');
            setSelectedImage(null);
            setExistingImageUrl('');
            setSelectedFeatures([]); // Clear selected features for new additions
            setCustomFeature(''); // Reset custom input
            setAddCustomFeature(false); // Reset custom checkbox
            // No terms acceptance checkbox for provider form
        }
         // Clear parent messages and errors when existingTransportation changes (form is reset/populated)
         setMessage('');
         onError(null);

    }, [existingTransportation]); // Depend on existingTransportation prop

    // Handle input changes in the form (for text/number/select inputs)
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    // Handle file input change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setSelectedImage(file);
        // Clear existing image preview if a new file is selected
        if (file) {
            setExistingImageUrl('');
        }
    };

    // Handle features checkbox change
    const handleFeatureChange = (e) => {
        const { value, checked } = e.target;
        setSelectedFeatures(prevFeatures =>
            checked ? [...prevFeatures, value] : prevFeatures.filter(feature => feature !== value)
        );
    };

    // Handle custom feature input change
    const handleCustomFeatureInputChange = (e) => {
        setCustomFeature(e.target.value);
    };

    // Handle "Add Custom Feature" checkbox change
    const handleAddCustomFeatureCheckboxChange = (e) => {
        const checked = e.target.checked;
        setAddCustomFeature(checked);
        if (!checked) {
            setCustomFeature(''); // Clear custom input if checkbox is unchecked
        }
    };

    // Removed handleTermsChange

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous parent messages
        onError(null); // Clear previous parent errors
        setLoading(true); // Start loading

        // Client-side validation
        if (!existingTransportation && !selectedImage && !existingImageUrl) { // Image is required for new additions AND if no existing image when editing
             setMessage('Image is required for new transportation entries.');
             setLoading(false);
             return;
        }
        // Removed terms acceptance validation

         if (!formData.transport_type) { // Validate transport type dropdown
             setMessage('Please select a Transport Type.');
             setLoading(false);
             return;
         }

         if (formData.price_per_day !== '' && parseFloat(formData.price_per_day) < 0) {
             setMessage('Price Per Day cannot be negative.');
             setLoading(false);
             return;
         }
          if (formData.rating !== '' && (parseFloat(formData.rating) < 0 || parseFloat(formData.rating) > 5)) {
              if (!isNaN(parseFloat(formData.rating))) { // Only show message if it's a number but out of range
                  setMessage('Rating must be between 0 and 5.');
                  setLoading(false);
                  return;
              }
          }
           // Validate custom input if its checkbox is checked
          if (addCustomFeature && customFeature.trim() === '') {
              setMessage('Please enter a custom feature or uncheck the "Add Custom Feature" box.');
              onError('Custom feature input is empty.');
              setLoading(false);
              return;
          }


        const submitData = new FormData(); // Use FormData for file uploads

        // Append text fields from formData state
        for (const key in formData) {
            // Do NOT append 'features' from formData as it's now handled by selectedFeatures
            // Do NOT append 'termsAccepted' as it's removed
            if (key !== 'features' && key !== 'termsAccepted') {
                 // Append only if value is not null or undefined to avoid sending "null" or "undefined" strings
                 if (formData[key] !== null && formData[key] !== undefined) {
                    submitData.append(key, formData[key]);
                 } else {
                     // Optionally append empty string for fields that should be cleared if empty
                     // submitData.append(key, '');
                 }
            }
        }

        // Combine selected features (from checkboxes) and custom feature (if added)
        const finalFeatures = [...selectedFeatures];
         if (addCustomFeature && customFeature.trim() !== '') {
             finalFeatures.push(customFeature.trim());
         }
        // Append the final features array, joined by commas (matching backend expectation)
        submitData.append('features', finalFeatures.join(','));


        // Append providerId for authorization on update/add
        submitData.append('providerId', providerId);


        // Append the image file if selected
        if (selectedImage) {
            submitData.append('image', selectedImage);
        } else if (existingTransportation && existingTransportation.image && !selectedImage) {
            // If editing and no new image selected, but there was an existing image,
            // send the existing filename. This tells the backend to keep the old image.
            // The backend should be designed to handle this.
             const existingImageName = existingTransportation.image.split('/').pop(); // Extract filename from path
             submitData.append('image', existingImageName);
        } else if (existingTransportation && !existingTransportation.image && !selectedImage) {
             // If editing and there was no existing image and no new image selected,
             // explicitly send an empty string or null to clear the image field in DB if needed.
             // Sending an empty string is common with FormData.
             submitData.append('image', '');
        }
         // If adding new and no image selected, the initial validation handles this.


        try {
            let response;
            if (existingTransportation) {
                // Update existing transportation
                // Use the Mongoose _id for the PUT request URL
                response = await axios.put(`${API_URL}/api/transportation/${existingTransportation._id}`, submitData, {
                     headers: {
                         'Content-Type': 'multipart/form-data', // Important for sending FormData
                     },
                });
                setMessage('Transportation updated successfully!');
                console.log('Transportation updated:', response.data);
            } else {
                // Add new transportation
                // providerId is already in submitData, not needed in URL for POST
                response = await axios.post(`${API_URL}/api/provider/${providerId}/transportations`, submitData, { // Changed endpoint from /api/transportation to /api/provider/:providerId/transportations for consistency
                     headers: {
                         'Content-Type': 'multipart/form-data', // Important for sending FormData
                     },
                });
                setMessage('Transportation added successfully!');
                console.log('Transportation added:', response.data);
            }
            onSuccess(); // Call parent's success handler (e.g., to refetch list and close form)

        } catch (error) {
            console.error('Error submitting transportation form:', error);
            if (error.response && error.response.data && error.response.data.error) {
                setMessage(error.response.data.error);
                // Pass more detailed error if available
                onError(error.response.data.details || error.response.data.error);
            } else {
                setMessage('Failed to save transportation.');
                onError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false); // End loading
        }
    };

    return (
        <div className="service-form"> {/* Changed class name */}
            <h2>{existingTransportation ? 'Edit Transportation' : 'Add New Transportation'}</h2> {/* Changed heading tag */}
            {loading && <div className="form-loading">Saving transportation...</div>} {/* Changed class name */}

            <form onSubmit={handleSubmit}>
                {/* Display ID when editing */}
                {existingTransportation && (
                    <div className="form-field-display"> {/* Use a class for displaying read-only fields */}
                        <strong>Transportation ID:</strong> {editTransportationID}
                    </div>
                )}

                <label>
                    Driver Name:
                    <input type="text" name="driver_name" value={formData.driver_name} onChange={handleInputChange} required disabled={loading} autoComplete="name" />
                </label>

                {/* Transportation Type Dropdown */}
                <label>
                    Transport Type:
                    <select name="transport_type" value={formData.transport_type} onChange={handleInputChange} required disabled={loading}>
                        {availableTransportTypes.map(type => (
                            <option key={type} value={type}>{type || '-- Select Type --'}</option>
                        ))}
                    </select>
                </label>

                <label>
                    Model:
                    <input type="text" name="model" value={formData.model} onChange={handleInputChange} required disabled={loading} autoComplete="off" />
                </label>

                <label>
                    Price Per Day:
                    <input type="number" name="price_per_day" value={formData.price_per_day} onChange={handleInputChange} required min="0" step="0.01" disabled={loading} autoComplete="off" />
                </label>

                <label>
                    Rating: {/* Input for rating */}
                    <input type="text" name="rating" value={formData.rating} onChange={handleInputChange} disabled={loading} autoComplete="off" placeholder="e.g., 4.5 or Not Rated" /> {/* Added placeholder */}
                </label>

                <label>
                    Image: {/* Label for file input */}
                    <input type="file" name="image" onChange={handleImageChange} required={!existingTransportation?.image} disabled={loading} accept="image/*" /> {/* Changed to type="file", added accept, required only if no existing image */}
                    {/* Display existing image when editing */}
                    {existingImageUrl && !selectedImage && (
                         <img src={existingImageUrl} alt="Existing Transportation" className="existing-image-preview" /> 
                    )}
                     {/* Display preview of newly selected image (optional) */}
                     {selectedImage && (
                         <img src={URL.createObjectURL(selectedImage)} alt="New Image Preview" className="new-image-preview" /> 
                     )}
                </label>

                {/* Features Checkboxes and Custom Input - Using .form-group and .checkbox-group */}
                <div className="form-group"> {/* Changed class name */}
                    <strong>Features:</strong>
                    <div className="checkbox-group"> {/* Changed class name */}
                        {availableFeatures.map(feature => (
                            <label key={feature}> {/* Changed to label */}
                                <input
                                    type="checkbox"
                                    name="features" // Use the same name for all feature checkboxes
                                    value={feature}
                                    checked={selectedFeatures.includes(feature)}
                                    onChange={handleFeatureChange}
                                    disabled={loading}
                                />
                                {feature}
                            </label>
                        ))}
                    </div>
                    {/* Add Custom Feature Checkbox and Input */}
                    <div className="custom-feature-section"> {/* Added container for custom feature */}
                         <label className="custom-feature-checkbox-label"> {/* Specific class for the checkbox label */}
                             <input
                                 type="checkbox"
                                 name="addCustomFeature"
                                 checked={addCustomFeature}
                                 onChange={handleAddCustomFeatureCheckboxChange}
                                 disabled={loading}
                             />
                             Add Custom Feature:
                         </label>
                         {addCustomFeature && (
                             <input
                                 type="text"
                                 name="customFeatureInput" // Use a distinct name for the custom input state
                                 value={customFeature}
                                 onChange={handleCustomFeatureInputChange}
                                 disabled={loading}
                                 placeholder="Enter custom feature"
                                 required // Make custom input required if checkbox is checked
                                 autoComplete="off"
                             />
                         )}
                    </div>
                </div>


                <label>
                    Terms and Conditions:
                    <textarea name="termsAndConditions" value={formData.termsAndConditions} onChange={handleInputChange} disabled={loading} autoComplete="off" placeholder="Enter terms and conditions specific to this transportation."></textarea> {/* Added placeholder */}
                </label>

                {/* Removed Terms Acceptance Checkbox */}
                {/*
                {!existingTransportation && (
                     <div className="terms-checkbox">
                         <input
                             type="checkbox"
                             id="transportTermsAccepted"
                             checked={termsAccepted}
                             onChange={handleTermsChange}
                             disabled={loading}
                         />
                         <label htmlFor="transportTermsAccepted">I agree to the terms and conditions for listing this transportation service.</label>
                     </div>
                )}
                */}


                <button type="submit" disabled={loading}>{existingTransportation ? 'Update Transportation' : 'Add Transportation'}</button> {/* Removed termsAccepted from disabled logic */}
            </form>
        </div>
    );
};

export default TransportationForm;
