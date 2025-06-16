import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/AccommodationForm.css'

// Define API URL (base URL of your server)
const API_URL = 'http://localhost:5000';

// Define allowed room types (should match backend)
const allowedRoomTypes = {
    Hotels: ["Standard Room", "Deluxe Room", "Suite", "Executive Suite", "Family Room", "Presidential Suite"],
    Resorts: ["Cottage", "Bungalow", "Luxury Suite", "Private Villa", "Tent", "Chalet"],
    Homestays: ["Private Room", "Entire Home/Apartment", "Shared Room", "Studio", "Basic Room", "Family Suite"],
    Villas: ["Entire Villa", "With Private Pool", "Multiple Bedrooms", "Sea-facing", "Garden View", "Luxury Villa", "Budget Villa"],
    Apartments: ["Studio Apartment", "1-Bedroom Apartment", "2-Bedroom Apartment", "3-Bedroom Apartment", "Penthouse", "Serviced Apartment"],
    Guesthouses: ["Single Room", "Double Room", "Twin Room", "Triple Room", "Dorm Room", "En-suite Room"]
};

// Predefined lists for Room Amenities and Facilities (these are now for individual rooms)
const predefinedRoomAmenities = ["Wi-Fi", "Mini-bar", "Coffee/Tea Maker", "Desk", "Safe", "Balcony/Terrace", "Iron/Ironing Board", "Hair Dryer"];
const predefinedRoomFacilities = ["TV", "AC", "Geyser", "Separate Cupboard", "Attached Bathroom", "Heater", "Seating Area"];


// Initial state for a single room in the roomsData array
const initialRoomState = {
    _id: null, // For existing rooms
    roomNumber: '', // Changed from roomName to roomNumber
    roomType: '',
    pricePerNight: '',
    numberOfBeds: '',
    // guestsAllowed: '', // Removed
    roomFacilities: [], // Array for room-specific facilities
    roomAmenities: [],  // Array for room-specific amenities
    description: '',
    image: null, // File object for new image upload
    existingRoomImageUrl: '', // URL for displaying existing image
};


const AccommodationForm = ({ providerId, existingAccommodation, onSuccess, onError, loading, setLoading, setMessage }) => {
    // Step state for the multi-step form
    const [currentStep, setCurrentStep] = useState(1);

    // State for main accommodation details (Step 1)
    const [accommodationFormData, setAccommodationFormData] = useState({
        accommodationType: '',
        accommodationName: '',
        ownerName: '',
        address: '',
        termsAndConditions: '',
        nearbyLocations: ''
    });

    // State for rooms data (Step 2) - array of room objects
    const [roomsData, setRoomsData] = useState([]);

    // State to hold the selected main accommodation image file for upload
    const [selectedImage, setSelectedImage] = useState(null);
    // State to hold the existing main accommodation image URL/path when editing
    const [existingImageUrl, setExistingImageUrl] = useState('');

    // State to hold the accommodationID when editing
    const [editAccommodationID, setEditAccommodationID] = useState('');

    const [selectedAccommodationType, setSelectedAccommodationType] = useState('');

    // Consolidated list of all possible room types for the dropdown
    const allAvailableRoomTypes = Object.values(allowedRoomTypes).flat();

    // Effect to populate form data when editing an existing accommodation
    useEffect(() => {
        if (existingAccommodation) {
            setEditAccommodationID(existingAccommodation.accommodationID || '');
            setAccommodationFormData({
                accommodationType: existingAccommodation.accommodationType || '',
                accommodationName: existingAccommodation.accommodationName || '',
                ownerName: existingAccommodation.ownerName || '',
                address: existingAccommodation.address || '',
                termsAndConditions: existingAccommodation.termsAndConditions || '',
                nearbyLocations: existingAccommodation.nearbyLocations || ''
            });

            // Populate roomsData from existingAccommodation
            if (existingAccommodation.rooms && existingAccommodation.rooms.length > 0) {
                const loadedRooms = existingAccommodation.rooms.map(room => ({
                    _id: room._id,
                    roomNumber: room.roomNumber || '', // Changed from roomName to roomNumber
                    roomType: room.roomType || '',
                    pricePerNight: room.pricePerNight || '',
                    numberOfBeds: room.numberOfBeds || '',
                    // guestsAllowed: room.guestsAllowed || '', // Removed
                    roomFacilities: room.roomFacilities || [],
                    roomAmenities: room.roomAmenities || [],
                    description: room.description || '',
                    image: null, // No file selected initially for existing rooms
                    existingRoomImageUrl: room.image ? `${API_URL}/images/${room.image}` : '' // Set existing image URL
                }));
                setRoomsData(loadedRooms);
            } else {
                setRoomsData([JSON.parse(JSON.stringify(initialRoomState))]); // Start with one empty room if no rooms exist
            }


            setSelectedAccommodationType(existingAccommodation.accommodationType || '');
            if (existingAccommodation.image) {
                setExistingImageUrl(`${API_URL}/images/${existingAccommodation.image}`);
            } else {
                setExistingImageUrl('');
            }
            setSelectedImage(null); // Clear selected file when switching to edit
        } else {
            // Reset form for adding new
            setEditAccommodationID('');
            setAccommodationFormData({
                accommodationType: '',
                accommodationName: '',
                ownerName: '',
                address: '',
                termsAndConditions: '',
                nearbyLocations: ''
            });
            setRoomsData([JSON.parse(JSON.stringify(initialRoomState))]); // Start with one empty room for new entry
            setSelectedAccommodationType('');
            setExistingImageUrl('');
            setSelectedImage(null);
        }
        setMessage('');
        onError(null);
        setCurrentStep(1); // Always start at step 1 on load/reset
    }, [existingAccommodation, setMessage, onError]);

    // No longer need to update availableRoomTypes based on selectedAccommodationType
    // as roomType dropdown will now show all allowed types.
    // Removed the previous useEffect for availableRoomTypes.


    // Handle input changes for main accommodation details (Step 1)
    const handleAccommodationInputChange = (e) => {
        const { name, value } = e.target;
        setAccommodationFormData({ ...accommodationFormData, [name]: value });
        if (name === 'accommodationType') {
            setSelectedAccommodationType(value); // Keep track of main accommodation type
        }
    };

    // Handle file input change for main accommodation image
    const handleMainImageChange = (e) => {
        setSelectedImage(e.target.files[0]);
        setExistingImageUrl(''); // Clear existing image when a new file is selected
    };

    // Handle input changes for room details (Step 2)
    const handleRoomInputChange = (index, e) => {
        const { name, value } = e.target;
        const updatedRooms = [...roomsData];
        updatedRooms[index][name] = value;
        setRoomsData(updatedRooms);
    };

    // Handle file input change for room-specific image
    const handleRoomImageChange = (index, e) => {
        const updatedRooms = [...roomsData];
        updatedRooms[index].image = e.target.files[0];
        updatedRooms[index].existingRoomImageUrl = ''; // Clear existing image when new file selected
        setRoomsData(updatedRooms);
    };

    // Handle checkbox changes for room amenities and facilities
    const handleRoomCheckboxChange = (index, listName, value, checked) => {
        const updatedRooms = [...roomsData];
        const updatedList = checked
            ? [...updatedRooms[index][listName], value]
            : updatedRooms[index][listName].filter(item => item !== value);
        updatedRooms[index][listName] = updatedList;
        setRoomsData(updatedRooms);
    };

    // Handle adding a new room entry
    const handleAddRoom = () => {
        setRoomsData(prevRooms => [...prevRooms, JSON.parse(JSON.stringify(initialRoomState))]);
    };

    // Handle removing a room entry
    const handleRemoveRoom = (indexToRemove) => {
        if (roomsData.length > 1) { // Ensure at least one room remains
            setRoomsData(prevRooms => prevRooms.filter((_, index) => index !== indexToRemove));
        } else {
            setMessage("You must have at least one room.");
            onError("Cannot remove the last room.");
        }
    };

    // Validate Step 1 and move to Step 2
    const handleNextStep = () => {
        setMessage('');
        onError(null);

        const { accommodationType, accommodationName, ownerName, address } = accommodationFormData;
        if (!accommodationType || !accommodationName || !ownerName || !address || (!selectedImage && !existingAccommodation?.image)) {
            setMessage('Please fill in all required fields for accommodation details and provide a main image.');
            onError('Missing required fields for accommodation details.');
            return;
        }
        setCurrentStep(2);
    };

    // Move back to Step 1
    const handlePreviousStep = () => {
        setCurrentStep(1);
        setMessage('');
        onError(null);
    };


    // Handle form submission (Add or Edit)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        onError(null);
        setLoading(true);

        // Validate all rooms in Step 2 before submission
        if (roomsData.length === 0) {
            setMessage('Please add at least one room.');
            onError('No rooms added.');
            setLoading(false);
            return;
        }

        for (let i = 0; i < roomsData.length; i++) {
            const room = roomsData[i];
            if (!room.roomNumber || !room.roomType || isNaN(parseFloat(room.pricePerNight)) || isNaN(parseInt(room.numberOfBeds, 10)) || (!room.image && !room.existingRoomImageUrl && !existingAccommodation)) {
                setMessage(`Please fill in all required fields for Room ${i + 1} and provide an image.`);
                onError(`Missing required fields for Room ${i + 1}.`);
                setLoading(false);
                return;
            }
            if (parseFloat(room.pricePerNight) <= 0 || parseInt(room.numberOfBeds, 10) <= 0) {
                setMessage(`Price and number of beds must be positive for Room ${i + 1}.`);
                onError(`Invalid numerical values for Room ${i + 1}.`);
                setLoading(false);
                return;
            }
        }


        const formDataToSend = new FormData();

        // Append main accommodation data (Step 1)
        formDataToSend.append('accommodationType', accommodationFormData.accommodationType);
        formDataToSend.append('accommodationName', accommodationFormData.accommodationName);
        formDataToSend.append('ownerName', accommodationFormData.ownerName);
        formDataToSend.append('address', accommodationFormData.address);
        formDataToSend.append('termsAndConditions', accommodationFormData.termsAndConditions);
        formDataToSend.append('nearbyLocations', accommodationFormData.nearbyLocations);
        formDataToSend.append('providerId', providerId);

        // Append main image file if selected or existing
        if (selectedImage) {
            formDataToSend.append('image', selectedImage);
        } else if (existingAccommodation && existingAccommodation.image) {
            // If no new image selected, but there was an existing one,
            // ensure its filename is sent to the backend.
            formDataToSend.append('image', existingAccommodation.image);
        } else if (!existingAccommodation && !selectedImage && !existingImageUrl) {
            // For new accommodation, if no image is uploaded, send an empty string.
            formDataToSend.append('image', '');
        }

        // Append rooms data as a JSON string
        // Each room object will be sent with its details, including image filenames if they exist
        const roomsToSend = roomsData.map(room => {
            const roomObj = { ...room };

            // Remove the File object from the room object if it's there
            // The actual file will be appended separately
            delete roomObj.image;
            // Retain the existing image URL/path if no new file is selected
            if (room.existingRoomImageUrl && !room.image) {
                roomObj.image = room.existingRoomImageUrl.split('/').pop(); // Extract filename from URL
            } else if (!room.existingRoomImageUrl && !room.image) {
                roomObj.image = ''; // Explicitly set to empty if no image (new or old)
            }
            delete roomObj.existingRoomImageUrl; // Not needed on backend
            return roomObj;
        });

        formDataToSend.append('rooms', JSON.stringify(roomsToSend));

        // Append individual room image files
        roomsData.forEach((room) => {
            if (room.image) {
                formDataToSend.append('roomImages', room.image); // ✅ CORRECT
            }
        });



        try {
            if (existingAccommodation) {
                // --- Update existing accommodation ---
                await axios.put(`${API_URL}/api/accommodations/${existingAccommodation._id}`, formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                console.log('Accommodation updated successfully:', existingAccommodation._id);
                setMessage('Accommodation updated successfully!');
                onSuccess('Accommodation');
            } else {
                // --- Add new accommodation ---
                await axios.post(`${API_URL}/api/provider/${providerId}/accommodations`, formDataToSend, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                console.log('Accommodation added successfully.');
                setMessage('Accommodation added successfully!');
                onSuccess('Accommodation');
            }
        } catch (err) {
            console.error('Error submitting accommodation form:', err);
            console.error('Backend says:', err.response?.data); // <-- Shows 400 cause
            onError(`Failed to save accommodation: ${err.response?.data?.error || err.message}`);
            setMessage(`Failed to save accommodation: ${err.response?.data?.error || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="service-form">
            <h2>{existingAccommodation ? 'Edit Accommodation' : 'Add New Accommodation'}</h2>
            {loading && <div className="form-loading">Saving accommodation...</div>}

            <form onSubmit={handleSubmit}>
                {/* Step 1: Accommodation Details */}
                {currentStep === 1 && (
                    <div className="form-step active">
                        <h3>Step 1: Accommodation Details</h3>
                        {existingAccommodation && (
                            <label>
                                Accommodation ID:
                                <input type="text" name="accommodationID" value={editAccommodationID} disabled />
                            </label>
                        )}

                        <label>
                            Accommodation Type:
                            <select name="accommodationType" value={accommodationFormData.accommodationType} onChange={handleAccommodationInputChange} required disabled={loading} autoComplete="off">
                                <option value="">Select Type</option>
                                {Object.keys(allowedRoomTypes).map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Accommodation Name:
                            <input type="text" name="accommodationName" value={accommodationFormData.accommodationName} onChange={handleAccommodationInputChange} required disabled={loading} autoComplete="organization" />
                        </label>
                        <label>
                            Owner Name:
                            <input type="text" name="ownerName" value={accommodationFormData.ownerName} onChange={handleAccommodationInputChange} required disabled={loading} autoComplete="name" />
                        </label>

                        <label>
                            Image: (Main Accommodation Image)
                            <input type="file" name="image" onChange={handleMainImageChange} required={!existingAccommodation && !selectedImage && !existingImageUrl} disabled={loading} accept="image/*" />
                            {existingImageUrl && !selectedImage && (
                                <img src={existingImageUrl} alt="Existing Accommodation" style={{ maxWidth: '100px', marginTop: '10px' }} />
                            )}
                        </label>
                        <label>
                            Address:
                            <textarea name="address" value={accommodationFormData.address} onChange={handleAccommodationInputChange} required disabled={loading} autoComplete="street-address"></textarea>
                        </label>
                        <label>
                            Terms and Conditions:
                            <textarea name="termsAndConditions" value={accommodationFormData.termsAndConditions} onChange={handleAccommodationInputChange} disabled={loading} autoComplete="off"></textarea>
                        </label>
                        <label>
                            Nearby Locations (Comma-separated, e.g., "Park, Museum, Beach"):
                            <input type="text" name="nearbyLocations" value={accommodationFormData.nearbyLocations} onChange={handleAccommodationInputChange} disabled={loading} autoComplete="off" />
                        </label>

                        <div className="form-navigation-buttons">
                            <button type="button" onClick={handleNextStep} disabled={loading}>Next</button>
                        </div>
                    </div>
                )}

                {/* Step 2: Room Details */}
                {currentStep === 2 && (
                    <div className="form-step active">
                        <h3>Step 2: Room Details</h3>
                        {roomsData.map((room, index) => (
                            <div key={index} className="room-card">
                                <h4>Room {index + 1} Details</h4>
                                <label>
                                    Room Number: {/* Changed label */}
                                    <input type="text" name="roomNumber" value={room.roomNumber} onChange={(e) => handleRoomInputChange(index, e)} required disabled={loading} autoComplete="off" />
                                </label>
                                <label>
                                    Room Type:
                                    <select name="roomType" value={room.roomType} onChange={(e) => handleRoomInputChange(index, e)} required disabled={loading} autoComplete="off">
                                        <option value="">Select Room Type</option>
                                        {/* Flatten all room types into one array for the dropdown */}
                                        {allAvailableRoomTypes.map(roomType => (
                                            <option key={roomType} value={roomType}>{roomType}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    Price Per Night:
                                    <input type="number" name="pricePerNight" value={room.pricePerNight} onChange={(e) => handleRoomInputChange(index, e)} required min="0.01" step="0.01" disabled={loading} autoComplete="off" />
                                </label>
                                <label>
                                    Number of Beds:
                                    <input type="number" name="numberOfBeds" value={room.numberOfBeds} onChange={(e) => handleRoomInputChange(index, e)} required min="1" disabled={loading} autoComplete="off" />
                                </label>
                                {/* Removed Guests Allowed Field */}
                                {/*
                                <label>
                                    Guests Allowed:
                                    <input type="number" name="guestsAllowed" value={room.guestsAllowed} onChange={(e) => handleRoomInputChange(index, e)} required min="1" disabled={loading} autoComplete="off" />
                                </label>
                                */}
                                <label>
                                    Description:
                                    <textarea name="description" value={room.description} onChange={(e) => handleRoomInputChange(index, e)} disabled={loading} autoComplete="off"></textarea>
                                </label>

                                {/* Room Amenities Checkboxes */}
                                <div className="form-group room-checkbox-group">
                                    <label>Room Amenities:</label>
                                    <div className="checkbox-group">
                                        {predefinedRoomAmenities.map(amenity => (
                                            <label key={amenity}>
                                                <input
                                                    type="checkbox"
                                                    name="roomAmenities"
                                                    value={amenity}
                                                    checked={room.roomAmenities.includes(amenity)}
                                                    onChange={(e) => handleRoomCheckboxChange(index, 'roomAmenities', amenity, e.target.checked)}
                                                    disabled={loading}
                                                />
                                                {amenity}
                                            </label>
                                        ))}
                                    </div>
                                    {/* You can add custom amenity input per room if needed, similar to previous version */}
                                </div>

                                {/* Room Facilities Checkboxes */}
                                <div className="form-group room-checkbox-group">
                                    <label>Room Facilities:</label>
                                    <div className="checkbox-group">
                                        {predefinedRoomFacilities.map(facility => (
                                            <label key={facility}>
                                                <input
                                                    type="checkbox"
                                                    name="roomFacilities"
                                                    value={facility}
                                                    checked={room.roomFacilities.includes(facility)}
                                                    onChange={(e) => handleRoomCheckboxChange(index, 'roomFacilities', facility, e.target.checked)}
                                                    disabled={loading}
                                                />
                                                {facility}
                                            </label>
                                        ))}
                                    </div>
                                    {/* You can add custom facility input per room if needed */}
                                </div>

                                <label>
                                    Room Image:
                                    <input type="file" name="roomImage" onChange={(e) => handleRoomImageChange(index, e)} required={!room.image && !room.existingRoomImageUrl && !existingAccommodation} disabled={loading} accept="image/*" />
                                    {room.existingRoomImageUrl && !room.image && (
                                        <img src={room.existingRoomImageUrl} alt={`Room ${index + 1}`} style={{ maxWidth: '100px', marginTop: '10px' }} />
                                    )}
                                </label>

                                <div className="room-actions">
                                    {roomsData.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveRoom(index)} disabled={loading} className="remove-room-button">Remove Room</button>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddRoom} disabled={loading} className="add-room-button">Add Another Room</button>

                        <div className="form-navigation-buttons">
                            <button type="button" onClick={handlePreviousStep} disabled={loading}>Previous</button>
                            <button type="submit" disabled={loading}>{existingAccommodation ? 'Update Accommodation' : 'Add Accommodation'}</button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default AccommodationForm;
