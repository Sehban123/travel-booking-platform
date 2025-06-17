import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/SportAdventureForm.css'; // Import the dedicated CSS file

// Define API URL (base URL of your server)
const API_URL = 'https://travel-booking-platform.onrender.com'; // Changed to base URL

// Define a list of common sport adventure features (adjust as needed)
const availableAdventureFeatures = [
    'Beginner Friendly',
    'Intermediate Level',
    'Advanced Level',
    'Equipment Included',
    'Guide Provided',
    'Transportation Included',
    'Meals Included',
    'Photography Service',
    'First Aid Certified Staff',
    'Insurance Included'
    // Add more features as needed
];

// Define available sport adventure categories for the dropdown
const availableAdventureCategories = [
    '', // Empty default option
    'Air',
    'Water',
    'Land',
    'Other'
    // Add more categories as needed
];


const SportAdventureForm = ({ providerId, existingAdventure, onSuccess, onError, loading, setLoading, setMessage }) => {
    // State for form data, initialized based on whether editing or adding
    const [formData, setFormData] = useState({
        // id is removed from formData state for new additions
        type: '', // Will now be selected from dropdown (category)
        name: '', // Name of the specific activity
        description: '',
        location: '',
        price: '',
        // rating: '', // Removed rating field
        // image is now handled as a File object, not a string URL/path in state for new uploads
        // features is now handled by selectedFeatures state
        termsAndConditions: '', // Assuming comma-separated string input
        minimumAge: '' // Kept as string for input, will parse to number on submit
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


    // State to hold the sport adventure ID when editing (the automatically generated one)
    const [editAdventureID, setEditAdventureID] = useState('');

     // State for the terms acceptance checkbox
    const [termsAccepted, setTermsAccepted] = useState(false); // Added state for terms checkbox


    // Message display is handled by the parent ProviderDashboard


    // Effect to populate form data when editing an existing adventure
    useEffect(() => {
        if (existingAdventure) {
            // Populate form for editing
            setEditAdventureID(existingAdventure.id || ''); // Set ID for editing
            setFormData({
                type: existingAdventure.type || '', // Populate type from existing data
                name: existingAdventure.name || '',
                description: existingAdventure.description || '',
                location: existingAdventure.location || '',
                price: existingAdventure.price || '',
                // rating: existingAdventure.rating || '', // Removed rating field
                // image is not set here, handle existing image separately
                // features: is handled below by setSelectedFeatures
                termsAndConditions: Array.isArray(existingAdventure.termsAndConditions) ? existingAdventure.termsAndConditions.join(', ') : existingAdventure.termsAndConditions || '', // Join array back to string for editing
                minimumAge: existingAdventure.minimumAge || ''
            });
             // Set the existing image URL for display
            if (existingAdventure.image) {
                setExistingImageUrl(`${API_URL}/images/${existingAdventure.image}`);
            }
            // Populate selectedFeatures from existingAdventure.features
             if (Array.isArray(existingAdventure.features)) {
                 setSelectedFeatures(existingAdventure.features);
             } else if (existingAdventure.features && typeof existingAdventure.features === 'string') {
                 // If features is stored as a comma-separated string, parse it into an array
                 setSelectedFeatures(existingAdventure.features.split(',').map(item => item.trim()).filter(item => item));
             } else {
                 setSelectedFeatures([]);
             }

             // Check if existing features include a custom one
             const existingFeatures = existingAdventure.features || [];
             const customExistingFeature = existingFeatures.find(f => !availableAdventureFeatures.includes(f));
             if (customExistingFeature) {
                 setAddCustomFeature(true);
                 setCustomFeature(customExistingFeature);
             } else {
                 setAddCustomFeature(false);
                 setCustomFeature('');
             }


            // For editing, assume terms were already accepted when created/last updated, or decide a different logic
             // For simplicity, we'll just set it to true when editing an existing item
            setTermsAccepted(true); // Assume terms are accepted when editing
        } else {
             // Reset form for adding new item
             setFormData({
                type: '', // Reset type to empty for new additions
                name: '',
                description: '',
                location: '',
                price: '',
                // rating: '', // Removed rating field
                termsAndConditions: '',
                minimumAge: ''
            });
            setEditAdventureID('');
            setSelectedImage(null);
            setExistingImageUrl('');
            setSelectedFeatures([]); // Clear selected features for new additions
            setCustomFeature(''); // Reset custom input
            setAddCustomFeature(false); // Reset custom checkbox
            setTermsAccepted(false); // Terms must be accepted for new additions
        }
    }, [existingAdventure, API_URL]); // Add API_URL to dependency array

    // Handle input changes in the form
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


     // Handle checkbox change for terms acceptance
    const handleTermsChange = (e) => {
        setTermsAccepted(e.target.checked);
    };


    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous parent messages
        onError(null); // Clear previous parent errors
        setLoading(true); // Start loading

         // Client-side validation
        if (!existingAdventure && !selectedImage) { // Image is required only for new additions
             setMessage('Image is required for new sport adventure entries.');
             setLoading(false);
             return;
        }
         if (!existingAdventure && !termsAccepted) { // Terms must be accepted for new additions
             setMessage('You must accept the terms and conditions.');
             setLoading(false);
             return;
         }
         if (formData.price !== '' && parseFloat(formData.price) < 0) {
             setMessage('Price cannot be negative.');
             setLoading(false);
             return;
         }
         if (formData.minimumAge !== '' && parseInt(formData.minimumAge, 10) < 0) {
              setMessage('Minimum Age cannot be negative.');
              setLoading(false);
              return;
         }
          // Removed rating validation
           // Validate custom feature input if its checkbox is checked
           if (addCustomFeature && customFeature.trim() === '') {
               setMessage('Please enter a custom feature or uncheck the "Add Custom Feature" box.');
               onError('Custom feature input is empty.');
               setLoading(false);
               return;
           }


        const submitData = new FormData(); // Use FormData for file uploads

        // Append text fields from formData state
        for (const key in formData) {
            // Do NOT append 'features' from formData as it's now handled by selectedFeatures and customFeature
            // Do NOT append 'rating' as it's removed
             if (key !== 'features' && key !== 'rating') {
                 submitData.append(key, formData[key]);
             }
        }

         // Combine selected features (from checkboxes) and custom feature (if added)
         const finalFeatures = [...selectedFeatures];
         if (addCustomFeature && customFeature.trim() !== '') {
             finalFeatures.push(customFeature.trim());
         }
        // Append the final features array, joined by commas (matching backend expectation)
        submitData.append('features', finalFeatures.join(','));


        // Append providerId for authorization on update
        submitData.append('providerId', providerId);


        // Append the image file if selected
        if (selectedImage) {
            submitData.append('image', selectedImage);
        } else if (existingAdventure && existingAdventure.image) {
             // If editing and no new image selected, but there was an existing image,
             // send the existing filename.
             const existingImageName = existingAdventure.image.split('/').pop(); // Extract filename from path
             submitData.append('image', existingImageName);
        } else if (existingAdventure && !existingAdventure.image && !selectedImage) {
            // If editing and there was no existing image and no new image selected,
            // explicitly send an empty string to clear the image field in DB if needed.
             submitData.append('image', '');
        }


        try {
            let response;
            if (existingAdventure) {
                // Update existing sport adventure
                // Use the Mongoose _id for the PUT request URL
                 response = await axios.put(`${API_URL}/api/sports-adventures/${existingAdventure._id}`, submitData, {
                     headers: {
                         'Content-Type': 'multipart/form-data', // Important for sending FormData
                     },
                 });
                 setMessage('Sport Adventure updated successfully!');
                 console.log('Sport Adventure updated:', response.data);
            } else {
                // Add new sport adventure
                // providerId is already in submitData, not needed in URL for POST
                 response = await axios.post(`${API_URL}/api/provider/${providerId}/sports-adventures`, submitData, {
                      headers: {
                         'Content-Type': 'multipart/form-data', // Important for sending FormData
                      },
                 });
                setMessage('Sport Adventure added successfully!');
                console.log('Sport Adventure added:', response.data);
            }
            onSuccess(); // Call parent's success handler (e.g., to refetch list)

        } catch (error) {
            console.error('Error submitting sport adventure form:', error);
             if (error.response && error.response.data && error.response.data.error) {
                setMessage(error.response.data.error);
                onError(error.response.data.details || 'An error occurred.');
            } else {
                setMessage('Failed to save sport adventure.');
                onError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false); // End loading
        }
    };

    return (
        <div className="service-form"> {/* Changed class name */}
            <h2>{existingAdventure ? 'Edit Sport Adventure' : 'Add New Sport Adventure'}</h2> {/* Changed heading tag */}
            {loading && <div className="form-loading">Saving sport adventure...</div>} {/* Changed class name */}

            <form onSubmit={handleSubmit}>
                 {/* Display ID when editing */}
                {existingAdventure && (
                    <div className="form-field-display"> {/* Use a class for displaying read-only fields */}
                         <strong>Sport Adventure ID:</strong> {editAdventureID}
                    </div>
                )}

                <label>
                    Type:
                    {/* Changed from input type="text" to select dropdown */}
                    <select name="type" value={formData.type} onChange={handleInputChange} required disabled={loading}>
                         <option value="">Select Category</option> {/* Default empty option */}
                         {availableAdventureCategories.map(category => (
                             <option key={category} value={category}>{category}</option>
                         ))}
                    </select>
                </label>
                <label>
                    Name:
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} required disabled={loading} autoComplete="name" />
                </label>
                 <label>
                    Description:
                    <textarea name="description" value={formData.description} onChange={handleInputChange} required disabled={loading} autoComplete="off"></textarea>
                </label>
                 <label>
                    Location:
                    <input type="text" name="location" value={formData.location} onChange={handleInputChange} required disabled={loading} autoComplete="street-address" />
                </label>
                 <label>
                    Price:
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" step="0.01" disabled={loading} autoComplete="off" />
                </label>
                 {/* Removed Rating Field */}
                 {/*
                 <label>
                    Rating:
                    <input type="text" name="rating" value={formData.rating} onChange={handleInputChange} disabled={loading} autoComplete="off" />
                 </label>
                 */}
                 <label>
                    Image: {/* Changed label for file input */}\
                    <input type="file" name="image" onChange={handleImageChange} required={!existingAdventure?.image} disabled={loading} accept="image/*" /> {/* Changed to type="file", added accept, required only if no existing image */}
                     {/* Display existing image when editing */}
                     {existingImageUrl && !selectedImage && (
                         <img src={existingImageUrl} alt="Existing Sport Adventure" style={{ maxWidth: '150px', marginTop: '10px' }} />
                     )}
                </label>

                 {/* Features Checkboxes and Custom Input - Using .form-group and .checkbox-group */}
                 <div className="form-group"> {/* Changed class name */}
                     <strong>Features:</strong>
                     <div className="checkbox-group"> {/* Changed class name */}
                         {availableAdventureFeatures.map(feature => (
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
                      <label> {/* This label is for the "Add Custom Feature" checkbox */}
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
                             name="customFeature" // Use a distinct name for the custom input state
                             value={customFeature}
                             onChange={handleCustomFeatureInputChange}
                             disabled={loading}
                             placeholder="Enter custom feature"
                             required // Make custom input required if checkbox is checked
                             autoComplete="off"
                         />
                     )}
                 </div>


                 <label>
                    Terms and Conditions:
                    <textarea name="termsAndConditions" value={formData.termsAndConditions} onChange={handleInputChange} disabled={loading} autoComplete="off"></textarea> {/* Added autocomplete */}
                </label>
                 <label>
                    Minimum Age:
                    <input type="number" name="minimumAge" value={formData.minimumAge} onChange={handleInputChange} required min="0" disabled={loading} autoComplete="off" /> {/* Added autocomplete */}
                </label>

                 {/* Terms Acceptance Checkbox */}
                 {!existingAdventure && ( // Only show checkbox for new additions if required
                     <div className="terms-checkbox">
                         <input
                             type="checkbox"
                             id="adventureTermsAccepted"
                             checked={termsAccepted}
                             onChange={handleTermsChange}
                             disabled={loading}
                         />
                         <label htmlFor="adventureTermsAccepted">I agree to the terms and conditions for listing this sport adventure service.</label>
                     </div>
                 )}


                <button type="submit" disabled={loading || (!existingAdventure && !termsAccepted)}>{existingAdventure ? 'Update Sport Adventure' : 'Add Sport Adventure'}</button>
            </form>
        </div>
    );
};

export default SportAdventureForm;
