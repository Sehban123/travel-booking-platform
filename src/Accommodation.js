import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/Accommodation.css';

const API_URL = "https://travel-booking-backend.onrender.com"; // Define API URL (base URL of your server)

const Accommodation = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allAccommodations, setAllAccommodations] = useState([]); // Store original fetched data
  const [filteredAccommodations, setFilteredAccommodations] = useState([]); // Store filtered data for display
  const [loading, setLoading] = useState(true); // Loading state
  const navigate = useNavigate();

  // Helper function to extract unique amenities/facilities from all rooms
  const extractUniqueRoomDetails = (rooms, type) => {
    if (!rooms || rooms.length === 0) return 'N/A';
    const allDetails = new Set();
    rooms.forEach(room => {
      // Ensure the property exists and is an array before iterating
      if (room[type] && Array.isArray(room[type])) {
        room[type].forEach(detail => allDetails.add(detail));
      }
    });
    // Convert Set back to Array and join with ', '
    return allDetails.size > 0 ? Array.from(allDetails).join(', ') : 'N/A';
  };

  // Helper function to get all unique room types available in an accommodation
  const getAllRoomTypes = (rooms) => {
    if (!rooms || rooms.length === 0) return 'N/A';
    const types = rooms.map(room => room.roomType).filter(Boolean); // Get all roomType values, filter out null/undefined
    return types.length > 0 ? Array.from(new Set(types)).join(', ') : 'N/A'; // Return unique types
  };

  // Helper function to get the minimum price per night from all rooms
  const getMinPricePerNight = (rooms) => {
    if (!rooms || rooms.length === 0) return 'N/A';
    // Filter for valid numbers and find the minimum
    const prices = rooms.map(room => room.pricePerNight).filter(price => typeof price === 'number' && price >= 0);
    if (prices.length === 0) return 'N/A';
    const minPrice = Math.min(...prices);
    return `Starting from ₹${minPrice.toLocaleString('en-IN')}`; // Format with Indian Rupee symbol
  };


  // Effect hook to fetch accommodations data from the backend API
  useEffect(() => {
    const fetchAccommodations = async () => {
      try {
        // Make GET request to the backend accommodations API
        const response = await axios.get(`${API_URL}/api/accommodations`);
        // The backend now returns accommodations with a populated 'rooms' array.
        // Group the accommodations by their 'accommodationType' for display.
        const groupedData = response.data.reduce((acc, accommodation) => {
          const { accommodationType, ...rest } = accommodation;
          if (!acc[accommodationType]) {
            acc[accommodationType] = [];
          }
          acc[accommodationType].push(rest);
          return acc;
        }, {});

        // Convert the grouped object into an array of categories
        const categoriesArray = Object.keys(groupedData).map(type => ({
          type: type, // e.g., "Hotels", "Resorts"
          accommodations: groupedData[type], // Array of accommodations in that category
        }));

        setAllAccommodations(categoriesArray); // Store the full list of categorized accommodations
        setFilteredAccommodations(categoriesArray); // Initially, display all fetched accommodations
        setLoading(false); // Set loading to false once data is fetched
      } catch (error) {
        console.error('Error fetching accommodations:', error);
        setLoading(false); // Ensure loading is false even if an error occurs
      }
    };

    fetchAccommodations(); // Call the fetch function when the component mounts
  }, []); // Empty dependency array ensures this effect runs only once on mount

  // Handler for search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query); // Update the search query state
    filterAccommodations(query); // Filter accommodations based on the new query
  };

  // Function to filter accommodations based on the search query
  const filterAccommodations = (query) => {
    // Split the query into individual terms and convert to lowercase
    const terms = query.toLowerCase().split(' ').filter(Boolean); // Filter out empty strings

    if (!terms.length) {
      // If no search terms, reset filtered accommodations to display all original data
      setFilteredAccommodations(allAccommodations);
      return;
    }

    const results = []; // Array to store filtered categories and their matching accommodations

    // Iterate through each category in the original list of all accommodations
    allAccommodations.forEach((category) => {
      // Filter accommodations within the current category
      const matchingAccommodations = category.accommodations.filter((accommodation) => {
        // Check if all search terms are present in the accommodation's details
        return terms.every((term) => {
          const termIsNumber = !isNaN(term); // Check if the search term is a number
          const termLower = term.toLowerCase();

          // If the term is a number, try to filter by price
          if (termIsNumber) {
            // Check if any room's pricePerNight is less than or equal to the numeric search term
            return accommodation.rooms.some(room => room.pricePerNight <= Number(term));
          } else {
            // If the term is not a number, search in various string fields
            // Get combined room types, amenities, and facilities for searching
            const allRoomTypes = getAllRoomTypes(accommodation.rooms).toLowerCase();
            const allRoomAmenities = extractUniqueRoomDetails(accommodation.rooms, 'roomAmenities').toLowerCase();
            const allRoomFacilities = extractUniqueRoomDetails(accommodation.rooms, 'roomFacilities').toLowerCase();

            return (
              accommodation.accommodationName.toLowerCase().includes(termLower) || // Search in accommodation name
              category.type.toLowerCase().includes(termLower) || // Search in accommodation type (category type)
              accommodation.address.toLowerCase().includes(termLower) || // Search in address
              allRoomTypes.includes(termLower) || // Search in combined room types
              allRoomAmenities.includes(termLower) || // Search in combined room amenities
              allRoomFacilities.includes(termLower) // Search in combined room facilities
            );
          }
        });
      });

      // If matching accommodations are found in this category, add them to results
      if (matchingAccommodations.length > 0) {
        results.push({
          type: category.type,
          accommodations: matchingAccommodations,
        });
      }
    });

    setFilteredAccommodations(results); // Update the state with filtered accommodations
  };


  // Handler for "Book Now" button click
  const handleBook = (accommodationId) => {
    // Navigate to the accommodation booking page with the specific accommodation ID
    navigate(`/accommodation-booking/${encodeURIComponent(accommodationId)}`);
  };

  // Display loading message while data is being fetched
  if (loading) {
    return <p className="loading-message">Loading accommodations...</p>;
  }

  return (
    <div className="accommodation-page-container"> {/* Main container for the accommodation page */}
      <div className="search-bar-container">
          <input
            type="text"
            placeholder="Search accommodations (e.g., Hotel, Wi-Fi, 2000 price)..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
      </div>
      <div className="accommodationlist">
        {/* Conditional rendering based on whether filtered accommodations are found */}
        {filteredAccommodations.length > 0 ? (
            filteredAccommodations.map((category) => (
            <div key={category.type} className="accommodation-category"> {/* Category section (e.g., Hotels, Resorts) */}
                <h2>{category.type}</h2> {/* Category title */}
                <div className="accommodationitems">
                {/* Conditional rendering for accommodations within a category */}
                {category.accommodations.length > 0 ? (
                    category.accommodations.map((accommodation) => (
                    <div className="accommodationcard" key={accommodation._id}> {/* Individual accommodation card */}
                        <img
                        className="accommodationimage"
                        // Construct the full image URL from the backend API_URL and image filename
                        src={`${API_URL}/images/${accommodation.image}`}
                        alt={accommodation.accommodationName}
                        // Fallback for broken images: display a placeholder
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=Image+Not+Available'; }}
                        />
                        <div className="accommodation-details">
                        <h3>{accommodation.accommodationName}</h3>
                        <p><strong>Owner:</strong> {accommodation.ownerName || 'N/A'}</p>
                        {/* UPDATED: Display all unique room types from the `rooms` array */}
                        <p><strong>Room Types:</strong> {getAllRoomTypes(accommodation.rooms)}</p>
                        <p><strong>Address:</strong> {accommodation.address || 'N/A'}</p>
                        {/* UPDATED: Display the minimum price from the `rooms` array */}
                        <p><strong>Price Per Night:</strong> {getMinPricePerNight(accommodation.rooms)}</p>
                        <p><strong>Rating:</strong> {accommodation.rating || 'N/A'}</p>
                        {/* UPDATED: Display combined unique amenities from all rooms */}
                        <p>
                            <strong>Amenities:</strong>{" "}
                            {extractUniqueRoomDetails(accommodation.rooms, 'roomAmenities')}
                        </p>
                        {/* UPDATED: Display combined unique facilities from all rooms */}
                        <p>
                            <strong>Facilities:</strong>{" "}
                            {extractUniqueRoomDetails(accommodation.rooms, 'roomFacilities')}
                        </p>

                        <button
                            className="bookButton"
                            onClick={() => handleBook(accommodation._id)}
                        >
                            Book Now
                        </button>
                        </div>
                    </div>
                    ))
                ) : (
                    // Message if no accommodations are found in the current category
                    <p>No accommodations found in this category.</p>
                )}
                </div>
            </div>
            ))
        ) : (
            // Message if no accommodations are found matching the search criteria at all
            <p className="no-results-message">No accommodations found matching your search criteria.</p>
        )}
      </div>
    </div>
  );
};

export default Accommodation;
