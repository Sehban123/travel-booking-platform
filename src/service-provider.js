// --- Service Provider Login Endpoint - MODIFIED (Check status) ---
app.post('/api/provider/login', async (req, res) => {
    console.log("Backend received POST request for Service Provider login");
    const { email, password } = req.body;
    if (!email || !password) { return res.status(400).json({ error: 'Email and password are required.' }); }
    try {
        const serviceProvider = await ServiceProvider.findOne({ email });
        if (!serviceProvider) {
            console.log(`Login failed: Provider not found for email: ${email}`);
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        if (serviceProvider.status !== 'Approved') {
            console.log(`Login failed: Provider not approved for email: ${email}. Status: ${serviceProvider.status}`);
            let message = 'Your application is pending review.';
            if (serviceProvider.status === 'Rejected') { message = 'Your application has been rejected.'; }
            return res.status(403).json({ error: message });
        }
        if (password !== serviceProvider.password) {
            console.log(`Login failed: Incorrect password for email: ${email}`);
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        console.log(`Service Provider login successful for email: ${email}`);

        // --- IMPORTANT CHANGE HERE: Ensure _id and serviceType are explicitly included ---
        res.status(200).json({
            message: 'Login successful!',
            providerId: serviceProvider._id, // Send the _id as providerId
            serviceType: serviceProvider.serviceType, // Send the serviceType
            // You can include other provider details here if needed by the frontend,
            // but these two are essential for dashboard navigation.
            provider: { // Keep this object for general provider data, but ensure essential fields are top-level
                id: serviceProvider._id,
                email: serviceProvider.email,
                name: serviceProvider.ownerFullName, // Using ownerFullName as the display name
                mobile: serviceProvider.phoneNumber, // Using phoneNumber as mobile
                serviceType: serviceProvider.serviceType,
                status: serviceProvider.status
            }
        });
    } catch (error) {
        console.error('Error during Service Provider login:', error);
        res.status(500).json({ error: 'An error occurred during login. Please try again.', details: error.message });
    }
});

// --- Endpoint for Service Provider Applications (Signup) - MODIFIED ---
app.post('/api/become-provider', upload, async (req, res) => {
    try {
        console.log("Backend received POST request for 'Become a Provider' application");
        console.log("Request body (from multer):", req.body);
        console.log("Request files (from multer):", req.files);

        const {
            businessName,
            ownerFullName,
            email,
            phoneNumber,
            fullBusinessAddress,
            businessRegistrationNumber,
            whatsappNumber,
            state,
            city,
            pinCode,
            websiteSocialMediaLink,
            preferredModeOfContact,
            serviceType
        } = req.body;

        // --- START DUPLICATE CHECK ---
        // Check if email already exists
        const existingEmailProvider = await ServiceProvider.findOne({ email });
        if (existingEmailProvider) {
            console.log(`Application failed: Email already registered: ${email}`);
            // Clean up uploaded files if an error occurs early
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                    fileArray.forEach(file => fs.unlinkSync(file.path));
                });
            }
            return res.status(409).json({ message: 'Email already registered. Please use a different email or log in.' });
        }

        // Check if business name already exists (case-insensitive for robustness)
        const existingBusinessNameProvider = await ServiceProvider.findOne({
            businessName: { $regex: new RegExp(`^${businessName}$`, 'i') }
        });
        if (existingBusinessNameProvider) {
            console.log(`Application failed: Business Name already registered: ${businessName}`);
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                    fileArray.forEach(file => fs.unlinkSync(file.path));
                });
            }
            return res.status(409).json({ message: 'Business Name already registered. Please use a different name.' });
        }

        // Check if phone number already exists
        const existingPhoneNumberProvider = await ServiceProvider.findOne({ phoneNumber });
        if (existingPhoneNumberProvider) {
            console.log(`Application failed: Phone Number already registered: ${phoneNumber}`);
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                    fileArray.forEach(file => fs.unlinkSync(file.path));
                });
            }
            return res.status(409).json({ message: 'Phone Number already registered. Please use a different number.' });
        }
        // --- END DUPLICATE CHECK ---

        // Extract uploaded file names safely (this part remains the same)
        const aadharPanCard = req.files?.aadharPanCard?.[0]?.filename || null;
        const businessRegistrationCertificate = req.files?.businessRegistrationCertificate?.[0]?.filename || null;
        const bankAccountDetails = req.files?.bankAccountDetails?.[0]?.filename || null;
        const gstNumber = req.files?.gstNumber?.[0]?.filename || null;
        const servicePhotos = req.files?.servicePhotos?.map(file => file.filename) || [];

        // Basic validation for required fields (this part remains the same)
        if (!email || !businessName || !ownerFullName || !phoneNumber || !fullBusinessAddress || !serviceType || !state || !city || !pinCode || !preferredModeOfContact || servicePhotos.length === 0) {
            // If validation fails after duplicate checks, still clean up files
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                    fileArray.forEach(file => fs.unlinkSync(file.path));
                });
            }
            return res.status(400).json({ message: 'Missing required fields or documents. Please ensure all mandatory fields are filled and documents are uploaded.' });
        }

        const newApplication = new ServiceProvider({
            businessName,
            ownerFullName,
            email,
            phoneNumber,
            fullBusinessAddress,
            businessRegistrationNumber,
            whatsappNumber,
            state,
            city,
            pinCode,
            websiteSocialMediaLink,
            preferredModeOfContact,
            serviceType,
            aadharPanCard,
            businessRegistrationCertificate,
            bankAccountDetails,
            gstNumber,
            servicePhotos
        });

        await newApplication.save();
        res.status(201).json({ message: 'Application submitted successfully. We will review your application and get back to you soon!', providerId: newApplication._id });

    } catch (error) {
        console.error("Error during provider application submission:", error);
        // Ensure files are cleaned up if an error occurs during save or later
        if (req.files) {
            Object.values(req.files).forEach(fileArray => {
                fileArray.forEach(file => fs.unlinkSync(file.path));
            });
        }
        // Enhanced Mongoose validation error handling
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation failed:", details: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});


// 🔹 Route for a Provider to Add New Transportation - Add status check
app.post("/api/provider/:providerId/transportations", uploadSingle.single('image'), async (req, res) => {
    console.log(`Backend received POST request for adding transportation for provider ${req.params.providerId}`);
    const providerId = req.params.providerId;
    const transportationData = req.body;
    const imageFile = req.file;
    let generatedId;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        if (imageFile) fs.unlinkSync(imageFile.path);
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    if (!transportationData.driver_name || !transportationData.transport_type || !transportationData.model ||
        !transportationData.price_per_day || !imageFile) {
        if (imageFile) fs.unlinkSync(imageFile.path);
        return res.status(400).json({ error: 'Missing required fields or image file.' });
    }

    try {
        const provider = await ServiceProvider.findById(providerId);
        if (!provider) {
            console.log(`Provider not found for ID: ${providerId} when adding transportation.`);
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(404).json({ message: 'Provider not found.' });
        }
        // --- NEW: Check provider status (Keep this check for providers adding their *own* services) ---
        if (provider.status !== 'Approved') {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(403).json({ error: 'Provider account is not approved to add services.' });
        }
        // --- END NEW ---
        if (provider.serviceType !== 'Transportation') {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(403).json({ error: 'Provider is not authorized to add Transportation services.' });
        }

        // --- Generate Unique Transportation ID --- (Existing logic)
        const type = transportationData.transport_type;
        const prefix = transportationTypePrefixes[type] || 'TX';
        let counter = 0;
        const maxRetries = 10;

        while (counter < maxRetries) {
            const lastTransportation = await Transportation.findOne({ id: new RegExp(`^${prefix}\\d+$`) })
                .sort({ id: -1 })
                .limit(1);

            let nextNumber = 1;
            if (lastTransportation) {
                const lastId = lastTransportation.id;
                const lastNumber = parseInt(lastId.replace(prefix, ''), 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
            generatedId = `${prefix}${String(nextNumber).padStart(2, '0')}`;
            const existingTransportationWithId = await Transportation.findOne({ id: generatedId });
            if (!existingTransportationWithId) {
                break;
            }
            console.warn(`Generated duplicate Transportation ID: ${generatedId}. Retrying...`);
            counter++;
            if (counter === maxRetries) {
                if (imageFile) fs.unlinkSync(imageFile.path);
                throw new Error('Failed to generate a unique Transportation ID after multiple retries.');
            }
        }
        // --- End Generate Unique Transportation ID ---


        const newTransportationData = {
            ...transportationData,
            providerId: providerId,
            id: generatedId,
            image: imageFile.filename
        };

        newTransportationData.price_per_day = parseFloat(newTransportationData.price_per_day);
        if (newTransportationData.rating !== undefined) newTransportationData.rating = parseFloat(newTransportationData.rating);

        if (newTransportationData.features && typeof newTransportationData.features === 'string') {
            newTransportationData.features = newTransportationData.features.split(',').map(item => item.trim()).filter(item => item);
        } else if (newTransportationData.features === '') {
            newTransportationData.features = [];
        } else if (!Array.isArray(newTransportationData.features)) {
            newTransportationData.features = [];
        }


        const newTransportation = new Transportation(newTransportationData);
        await newTransportation.save();
        console.log("New transportation saved for provider:", providerId, newTransportation._id, "with ID:", generatedId);
        res.status(201).json(newTransportation);

    } catch (error) {
        console.error("Error adding transportation for provider:", providerId, error);
        if (imageFile) fs.unlinkSync(imageFile.path);
        if (error.code === 11000) {
            return res.status(409).json({ error: `Transportation with this generated ID already exists. Please try again.` });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
        }
        res.status(500).json({ error: "Failed to add transportation", details: error.message });
    }
});


// 🔹 Route for a Provider to Get Their Transportation - MODIFIED (Removed status check for Admin view)
app.get("/api/provider/:providerId/transportations", async (req, res) => {
    console.log(`Backend received GET request for provider ${req.params.providerId}'s transportations`);
    const providerId = req.params.providerId;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    try {
        const provider = await ServiceProvider.findById(providerId);
        if (!provider) {
            console.log(`Provider not found for ID: ${providerId} when fetching transportations.`);
            return res.status(404).json({ message: 'Provider not found.' });
        }
        // --- REMOVED: Provider status check here to allow Admin to fetch ---
        // if (provider.status !== 'Approved') {
        //      return res.status(403).json({ error: 'Provider account is not approved to view services.' });
        // }
        // --- END REMOVED ---
        if (provider.serviceType !== 'Transportation') {
            return res.status(403).json({ error: 'Provider is not authorized to view Transportation services.' });
        }

        const transportations = await Transportation.find({ providerId: providerId });
        console.log(`Found ${transportations.length} transportations for provider ${providerId}.`);
        res.status(200).json(transportations);

    } catch (error) {
        console.error("Error fetching transportations for provider:", providerId, error);
        res.status(500).json({ error: "Failed to fetch transportations", details: error.message });
    }
});


// 🔹 Route to UPDATE an Accommodation by ID - UPDATED FOR MULTI-ROOM
app.put("/api/accommodations/:id", upload, async (req, res) => {
    console.log(`Backend received PUT request for accommodation ID: ${req.params.id}`);
    const accommodationId = req.params.id;
    const { rooms, ...updateData } = req.body; // Destructure rooms from body
    const mainImageFile = req.files && req.files['image'] ? req.files['image'][0] : null;

    let parsedRooms = [];
    if (rooms) {
        try {
            parsedRooms = JSON.parse(rooms);
        } catch (parseError) {
            console.error('Error parsing rooms JSON for update:', parseError);
            if (mainImageFile) fs.unlinkSync(mainImageFile.path);
            if (req.files && req.files['roomImages']) {
                req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(400).json({ error: "Invalid rooms data format. Must be a valid JSON string." });
        }
    }

    if (!mongoose.Types.ObjectId.isValid(accommodationId)) {
        if (mainImageFile) fs.unlinkSync(mainImageFile.path);
        if (req.files && req.files['roomImages']) {
            req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
        }
        return res.status(400).json({ error: "Invalid Accommodation ID format provided." });
    }

    const providerId = updateData.providerId; // Provider ID for authorization
    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        if (mainImageFile) fs.unlinkSync(mainImageFile.path);
        if (req.files && req.files['roomImages']) {
            req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
        }
        return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
    }

    try {
        const accommodation = await Accommodation.findOne({ _id: accommodationId, providerId: providerId }).populate('rooms');
        if (!accommodation) {
            if (mainImageFile) fs.unlinkSync(mainImageFile.path);
            if (req.files && req.files['roomImages']) {
                req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(404).json({ message: "Accommodation not found or does not belong to this provider." });
        }

        const provider = await ServiceProvider.findById(providerId);
        if (!provider || provider.status !== 'Approved') {
            if (mainImageFile) fs.unlinkSync(mainImageFile.path);
            if (req.files && req.files['roomImages']) {
                req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(403).json({ error: 'Provider account is not approved to modify services.' });
        }

        // --- Handle Main Accommodation Image ---
        if (mainImageFile) {
            const oldImagePath = path.join(__dirname, 'src', 'images', accommodation.image);
            if (accommodation.image && fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error(`Error deleting old main accommodation image file: ${oldImagePath}`, err);
                    else console.log(`Deleted old main accommodation image file: ${oldImagePath}`);
                });
            }
            updateData.image = mainImageFile.filename;
        } else if (updateData.image === '' && accommodation.image) { // Frontend explicitly cleared image
            const oldImagePath = path.join(__dirname, 'src', 'images', accommodation.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error(`Error deleting old main accommodation image file (cleared): ${oldImagePath}`, err);
                    else console.log(`Deleted old main accommodation image file (cleared): ${oldImagePath}`);
                });
            }
            updateData.image = '';
        } else if (updateData.image === undefined) { // No new image, and not explicitly cleared
            updateData.image = accommodation.image; // Keep existing image
        }

        delete updateData.providerId; // Prevent providerId from being updated
        delete updateData.accommodationID; // Prevent accommodationID from being updated

        // --- Handle Rooms Update ---
        const existingRoomIds = accommodation.rooms.map(room => room._id.toString());
        const updatedRoomIds = [];
        const roomImageFiles = req.files['roomImages'] || [];

        for (let i = 0; i < parsedRooms.length; i++) {
            const roomData = parsedRooms[i];
            const roomImageFile = roomImageFiles[i]; // Corresponding file for this room

            if (roomData._id && existingRoomIds.includes(roomData._id)) {
                // Existing room: Update it
                const roomToUpdate = await Room.findById(roomData._id);
                if (roomToUpdate) {
                    const roomUpdateFields = {
                        roomNumber: roomData.roomNumber,
                        roomType: roomData.roomType,
                        pricePerNight: parseFloat(roomData.pricePerNight),
                        numberOfBeds: parseInt(roomData.numberOfBeds, 10),
                        roomFacilities: roomData.roomFacilities,
                        roomAmenities: roomData.roomAmenities,
                        description: roomData.description,
                    };

                    // Handle room-specific image update
                    if (roomImageFile) {
                        const oldRoomImagePath = path.join(__dirname, 'src', 'images', roomToUpdate.image);
                        if (roomToUpdate.image && fs.existsSync(oldRoomImagePath)) {
                            fs.unlink(oldRoomImagePath, (err) => {
                                if (err) console.error(`Error deleting old room image file: ${oldRoomImagePath}`, err);
                                else console.log(`Deleted old room image file: ${oldRoomImagePath}`);
                            });
                        }
                        roomUpdateFields.image = roomImageFile.filename;
                    } else if (roomData.existingRoomImageUrl === '' && roomToUpdate.image) { // Frontend explicitly cleared room image
                        const oldRoomImagePath = path.join(__dirname, 'src', 'images', roomToUpdate.image);
                        if (fs.existsSync(oldRoomImagePath)) {
                            fs.unlink(oldRoomImagePath, (err) => {
                                if (err) console.error(`Error deleting old room image file (cleared): ${oldRoomImagePath}`, err);
                                else console.log(`Deleted old room image file (cleared): ${oldRoomImagePath}`);
                            });
                        }
                        roomUpdateFields.image = '';
                    } else if (!roomImageFile && roomData.existingRoomImageUrl) { // Keep existing if no new file and old URL provided
                        roomUpdateFields.image = roomData.existingRoomImageUrl.split('/').pop();
                    } else if (!roomImageFile && !roomData.existingRoomImageUrl) { // No new file, no existing, set to empty
                        roomUpdateFields.image = '';
                    }


                    await Room.findByIdAndUpdate(roomData._id, roomUpdateFields, { new: true, runValidators: true });
                    updatedRoomIds.push(roomData._id);
                } else {
                    console.warn(`Room with ID ${roomData._id} not found during update, skipping.`);
                }
            } else {
                // New room: Create it
                const newRoomData = {
                    accommodationId: accommodationId, // Link to this accommodation
                    roomNumber: roomData.roomNumber,
                    roomType: roomData.roomType,
                    pricePerNight: parseFloat(roomData.pricePerNight),
                    numberOfBeds: parseInt(roomData.numberOfBeds, 10),
                    roomFacilities: roomData.roomFacilities,
                    roomAmenities: roomData.roomAmenities,
                    description: roomData.description,
                    image: roomImageFile ? roomImageFile.filename : (roomData.existingRoomImageUrl ? roomData.existingRoomImageUrl.split('/').pop() : '')
                };
                const newRoom = new Room(newRoomData);
                await newRoom.save();
                updatedRoomIds.push(newRoom._id);
            }
        }

        // Delete rooms that were removed by the frontend
        const roomsToDelete = existingRoomIds.filter(id => !updatedRoomIds.includes(id));
        for (const roomId of roomsToDelete) {
            const roomToDelete = await Room.findById(roomId);
            if (roomToDelete && roomToDelete.image) {
                const oldRoomImagePath = path.join(__dirname, 'src', 'images', roomToDelete.image);
                if (fs.existsSync(oldRoomImagePath)) {
                    fs.unlink(oldRoomImagePath, (err) => {
                        if (err) console.error(`Error deleting old room image file on removal: ${oldRoomImagePath}`, err);
                        else console.log(`Deleted old room image file on removal: ${oldRoomImagePath}`);
                    });
                }
            }
            await Room.findByIdAndDelete(roomId);
        }

        // Update the main accommodation's rooms array
        updateData.rooms = updatedRoomIds;

        const updatedAccommodation = await Accommodation.findByIdAndUpdate(
            accommodationId,
            updateData,
            { new: true, runValidators: true }
        ).populate('rooms'); // Populate rooms to return complete data

        if (!updatedAccommodation) {
            return res.status(404).json({ message: "Accommodation not found" });
        }

        console.log("Accommodation updated:", updatedAccommodation._id);
        res.json(updatedAccommodation);

    } catch (error) {
        console.error("Error updating accommodation:", error);
        if (mainImageFile) fs.unlinkSync(mainImageFile.path);
        if (req.files && req.files['roomImages']) {
            req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
        }

        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Accommodation ID format" });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
        }
        res.status(500).json({ error: "Failed to update accommodation", details: error.message });
    }
});

// 🔹 Route to DELETE an Accommodation by ID - UPDATED FOR MULTI-ROOM
app.delete("/api/accommodations/:id", async (req, res) => {
    console.log(`Backend received DELETE request for accommodation ID: ${req.params.id}`);
    try {
        const accommodationId = req.params.id;
        const providerId = req.body.providerId; // Expect providerId in the body for authorization

        if (!mongoose.Types.ObjectId.isValid(accommodationId)) {
            return res.status(400).json({ error: "Invalid Accommodation ID format provided." });
        }
        if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
        }


        const accommodation = await Accommodation.findOne({ _id: accommodationId, providerId: providerId }).populate('rooms');
        if (!accommodation) {
            return res.status(404).json({ message: "Accommodation not found or does not belong to this provider." });
        }
        const provider = await ServiceProvider.findById(providerId);
        if (!provider || provider.status !== 'Approved') {
            return res.status(403).json({ error: 'Provider account is not approved to delete services.' });
        }

        // Delete associated room images and room documents
        for (const room of accommodation.rooms) {
            if (room.image) {
                const roomImagePath = path.join(__dirname, 'src', 'images', room.image);
                if (fs.existsSync(roomImagePath)) {
                    fs.unlink(roomImagePath, (err) => {
                        if (err) console.error(`Error deleting room image file: ${roomImagePath}`, err);
                        else console.log(`Deleted room image file: ${roomImagePath}`);
                    });
                }
            }
            await Room.findByIdAndDelete(room._id);
        }

        // Delete the main accommodation image
        if (accommodation.image) {
            const imagePath = path.join(__dirname, 'src', 'images', accommodation.image);
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => {
                    if (err) console.error(`Error deleting main accommodation image file: ${imagePath}`, err);
                    else console.log(`Deleted main accommodation image file: ${imagePath}`);
                });
            }
        }

        await Accommodation.findByIdAndDelete(accommodationId);

        console.log("Accommodation and its associated rooms deleted:", accommodationId);
        res.json({ message: "Accommodation deleted successfully" });

    } catch (error) {
        console.error("Error deleting accommodation:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Accommodation ID format" });
        }
        res.status(500).json({ error: "Failed to delete accommodation", details: error.message });
    }
});

// 🔹 Route to get bookings for a specific Accommodation ID (Likely for User Side or Admin) - UPDATED for RoomId
app.get("/api/accommodations/:id/bookings", async (req, res) => {
    console.log(`Backend received GET request for bookings for accommodation ID: ${req.params.id}`);
    try {
        const accommodationId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(accommodationId)) {
            console.error("Backend received invalid ObjectId format for accommodation bookings:", accommodationId);
            return res.status(400).json({ error: "Invalid Accommodation ID format provided." });
        }

        // Populate both accommodationId and roomId
        const bookings = await Booking.find({ accommodationId: accommodationId }).populate('roomId');
        console.log(`Found ${bookings.length} bookings for accommodation ID: ${accommodationId}`);
        res.json(bookings);

    } catch (error) {
        console.error("Error fetching bookings for accommodation:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// 🔹 Route to GET a single Accommodation by ID - UPDATED (Populate rooms)
app.get("/api/accommodations/:id", async (req, res) => {
    try {
        const accommodation = await Accommodation.findById(req.params.id).populate('rooms');
        if (!accommodation) return res.status(404).json({ message: "Accommodation not found" });
        res.json(accommodation);
    } catch (error) {
        console.error("Error fetching accommodation:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Accommodation ID format" });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
});
// 🔹 Route to UPDATE a Transportation item by ID - Add status check
app.put("/api/transportation/:id", uploadSingle.single('image'), async (req, res) => {
    console.log(`Backend received PUT request for transportation ID: ${req.params.id}`);
    const imageFile = req.file;
    try {
        const transportationId = req.params.id;
        const updateData = req.body;
        const providerId = updateData.providerId;


        if (!mongoose.Types.ObjectId.isValid(transportationId)) {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(400).json({ error: "Invalid Transportation ID format provided." });
        }
        if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
        }


        const transportation = await Transportation.findOne({ _id: transportationId, providerId: providerId });
        if (!transportation) {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(404).json({ message: "Transportation not found or does not belong to this provider." });
        }
        // --- NEW: Check provider status (Keep this check for providers updating their *own* services) ---
        const provider = await ServiceProvider.findById(providerId);
        if (!provider || provider.status !== 'Approved') {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(403).json({ error: 'Provider account is not approved to modify services.' });
        }
        // --- END NEW ---

        if (imageFile) {
            const oldImagePath = path.join(__dirname, 'src', 'images', transportation.image);
            if (transportation.image && fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error(`Error deleting old image file: ${oldImagePath}`, err);
                    else console.log(`Deleted old image file on transportation update: ${oldImagePath}`);
                });
            }
            updateData.image = imageFile.filename;
        } else {
            // If no new image is uploaded, check if the frontend explicitly sent empty/null for image
            if (updateData.image === undefined) {
                // If image field is not in updateData, keep the old image
                updateData.image = transportation.image;
            } else if (updateData.image === null || updateData.image === '') {
                // If frontend explicitly sent empty/null, delete the old image and set image to empty string
                const oldImagePath = path.join(__dirname, 'src', 'images', transportation.image);
                if (transportation.image && fs.existsSync(oldImagePath)) {
                    fs.unlink(oldImagePath, (err) => {
                        if (err) console.error(`Error deleting old image file: ${oldImagePath}`, err);
                        else console.log(`Deleted old image file because frontend sent empty image: ${oldImagePath}`);
                    });
                }
                updateData.image = '';
            }
        }


        delete updateData.providerId; // Prevent providerId from being updated
        delete updateData.id; // Prevent transportation ID from being updated

        if (updateData.price_per_day !== undefined) updateData.price_per_day = parseFloat(updateData.price_per_day);
        if (updateData.rating !== undefined) updateData.rating = parseFloat(updateData.rating);

        if (updateData.features && typeof updateData.features === 'string') {
            updateData.features = updateData.features.split(',').map(item => item.trim()).filter(item => item);
        } else if (updateData.features === '') {
            updateData.features = [];
        } else if (!Array.isArray(updateData.features)) {
            updateData.features = [];
        }


        const updatedTransportation = await Transportation.findByIdAndUpdate(
            transportationId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedTransportation) {
            return res.status(404).json({ message: "Transportation not found" });
        }

        console.log("Transportation updated:", updatedTransportation._id);
        res.json(updatedTransportation);

    } catch (error) {
        console.error("Error updating transportation:", error);
        if (imageFile) fs.unlinkSync(imageFile.path);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Transportation ID format" });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
        }
        res.status(500).json({ error: "Failed to update transportation", details: error.message });
    }
});
// 🔹 Route to DELETE a Transportation item by ID - Add status check
app.delete("/api/transportation/:id", async (req, res) => {
    console.log(`Backend received DELETE request for transportation ID: ${req.params.id}`);
    try {
        const transportationId = req.params.id;
        const providerId = req.body.providerId; // Expect providerId in the body for authorization

        if (!mongoose.Types.ObjectId.isValid(transportationId)) {
            return res.status(400).json({ error: "Invalid Transportation ID format provided." });
        }
        if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
        }

        const transportation = await Transportation.findOne({ _id: transportationId, providerId: providerId });
        if (!transportation) {
            return res.status(404).json({ message: "Transportation not found or does not belong to this provider." });
        }
        // --- NEW: Check provider status (Keep this check for providers deleting their *own* services) ---
        const provider = await ServiceProvider.findById(providerId);
        if (!provider || provider.status !== 'Approved') {
            return res.status(403).json({ error: 'Provider account is not approved to delete services.' });
        }
        // --- END NEW ---

        const result = await Transportation.findByIdAndDelete(transportationId);

        // Delete the associated image file
        if (transportation.image) {
            const imagePath = path.join(__dirname, 'src', 'images', transportation.image);
            fs.unlink(imagePath, (err) => {
                if (err) console.error(`Error deleting old image file: ${imagePath}`, err);
                else console.log(`Deleted old image file on transportation deletion: ${imagePath}`);
            });
        }


        console.log("Transportation deleted:", transportationId);
        res.json({ message: "Transportation deleted successfully" });

    } catch (error) {
        console.error("Error deleting transportation:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Transportation ID format" });
        }
        res.status(500).json({ error: "Failed to delete transportation", details: error.message });
    }
});


// 🔹 Route to GET a single Transportation item by its Mongoose _id
app.get("/api/transportation/:id", async (req, res) => {
    console.log(`Backend received GET request for flat transportation item ID: ${req.params.id}`);
    try {
        const transportationItemId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(transportationItemId)) {
            console.error("Backend received invalid ObjectId format for flat transportation item:", transportationItemId);
            return res.status(400).json({ error: "Invalid Transportation Item ID format provided." });
        }

        const transportItem = await Transportation.findById(transportationItemId);

        if (!transportItem) {
            console.log("Flat Transportation item not found for ID:", transportationItemId);
            return res.status(404).json({ message: "Transportation item not found" });
        }

        console.log("Found Flat Transportation item:", transportItem._id);
        res.json(transportItem);

    } catch (error) {
        console.error("Error fetching single flat transportation item by _id:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});
// 🔹 Route for a Provider to Add New Sport Adventure - Add status check
app.post("/api/provider/:providerId/sports-adventures", uploadSingle.single('image'), async (req, res) => {
    console.log(`Backend received POST request for adding sport adventure for provider ${req.params.providerId}`);
    const providerId = req.params.providerId;
    const adventureData = req.body;
    const imageFile = req.file;
    let generatedId;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        if (imageFile) fs.unlinkSync(imageFile.path);
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    if (!adventureData.type || !adventureData.name || !adventureData.description ||
        !adventureData.location || !adventureData.price || !imageFile || adventureData.minimumAge === undefined) {
        if (imageFile) fs.unlinkSync(imageFile.path);
        return res.status(400).json({ error: 'Missing required fields or image file.' });
    }

    try {
        const provider = await ServiceProvider.findById(providerId);
        if (!provider) {
            console.log(`Provider not found for ID: ${providerId} when adding sport adventure.`);
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(404).json({ message: 'Provider not found.' });
        }
        // --- NEW: Check provider status (Keep this check for providers adding their *own* services) ---
        if (provider.status !== 'Approved') {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(403).json({ error: 'Provider account is not approved to add services.' });
        }
        // --- END NEW ---
        if (provider.serviceType !== 'Sport Adventure') {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(403).json({ error: 'Provider is not authorized to add Sport Adventure services.' });
        }

        // --- Generate Unique Sport Adventure ID --- (Existing logic)
        const type = adventureData.type;
        const prefix = sportAdventureTypePrefixes[type] || 'SA';
        let counter = 0;
        const maxRetries = 10;

        while (counter < maxRetries) {
            const lastAdventure = await SportAdventure.findOne({ id: new RegExp(`^${prefix}\\d+$`) })
                .sort({ id: -1 })
                .limit(1);

            let nextNumber = 1;
            if (lastAdventure) {
                const lastId = lastAdventure.id;
                const lastNumber = parseInt(lastId.replace(prefix, ''), 10);
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }
            generatedId = `${prefix}${String(nextNumber).padStart(2, '0')}`;
            const existingAdventureWithId = await SportAdventure.findOne({ id: generatedId });
            if (!existingAdventureWithId) {
                break;
            }
            console.warn(`Generated duplicate Sport Adventure ID: ${generatedId}. Retrying...`);
            counter++;
            if (counter === maxRetries) {
                if (imageFile) fs.unlinkSync(imageFile.path);
                throw new Error('Failed to generate a unique Sport Adventure ID after multiple retries.');
            }
        }
        // --- End Generate Unique Sport Adventure ID ---


        const newAdventureData = {
            ...adventureData,
            providerId: providerId,
            id: generatedId,
            image: imageFile.filename
        };

        newAdventureData.price = parseFloat(newAdventureData.price);
        newAdventureData.minimumAge = parseInt(newAdventureData.minimumAge, 10);
        if (newAdventureData.rating !== undefined) newAdventureData.rating = parseFloat(newAdventureData.rating);

        if (newAdventureData.termsAndConditions && typeof newAdventureData.termsAndConditions === 'string') {
            newAdventureData.termsAndConditions = newAdventureData.termsAndConditions.split(',').map(term => term.trim()).filter(term => term);
        } else if (newAdventureData.termsAndConditions === '') {
            newAdventureData.termsAndConditions = [];
        } else if (!Array.isArray(newAdventureData.termsAndConditions)) {
            newAdventureData.termsAndConditions = [];
        }


        const newAdventure = new SportAdventure(newAdventureData);
        await newAdventure.save();
        console.log("New sport adventure saved for provider:", providerId, newAdventure._id, "with ID:", generatedId);
        res.status(201).json(newAdventure);

    } catch (error) {
        console.error("Error adding sport adventure for provider:", providerId, error);
        if (imageFile) fs.unlinkSync(imageFile.path);
        if (error.code === 11000) {
            return res.status(409).json({ error: `Sport Adventure with this generated ID already exists. Please try again.` });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
        }
        res.status(500).json({ error: "Failed to add sport adventure", details: error.message });
    }
});

// 🔹 Route for a Provider to Get Their Sport Adventures - MODIFIED (Removed status check for Admin view)
app.get("/api/provider/:providerId/sports-adventures", async (req, res) => {
    console.log(`Backend received GET request for provider ${req.params.providerId}'s sport adventures`);
    const providerId = req.params.providerId;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    try {
        const provider = await ServiceProvider.findById(providerId);
        if (!provider) {
            console.log(`Provider not found for ID: ${providerId} when fetching sport adventures.`);
            return res.status(404).json({ message: 'Provider not found.' });
        }
        // --- REMOVED: Provider status check here to allow Admin to fetch ---
        // if (provider.status !== 'Approved') {
        //      return res.status(403).json({ error: 'Provider account is not approved to view services.' });
        // }
        // --- END REMOVED ---
        if (provider.serviceType !== 'Sport Adventure') {
            return res.status(403).json({ error: 'Provider is not authorized to view Sport Adventure services.' });
        }

        const adventures = await SportAdventure.find({ providerId: providerId });
        console.log(`Found ${adventures.length} sport adventures for provider ${providerId}.`);
        res.status(200).json(adventures);

    } catch (error) {
        console.error("Error fetching sport adventures for provider:", providerId, error);
        res.status(500).json({ error: "Failed to fetch sport adventures", details: error.message });
    }
});


// 🔹 Route to UPDATE a Sport Adventure by ID - Add status check
app.put("/api/sports-adventures/:id", uploadSingle.single('image'), async (req, res) => {
    console.log(`Backend received PUT request for sport adventure ID: ${req.params.id}`);
    const imageFile = req.file;
    try {
        const adventureId = req.params.id;
        const updateData = req.body;
        const providerId = updateData.providerId;


        if (!mongoose.Types.ObjectId.isValid(adventureId)) {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(400).json({ error: "Invalid Sport Adventure ID format provided." });
        }
        if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
        }

        const adventure = await SportAdventure.findOne({ _id: adventureId, providerId: providerId });
        if (!adventure) {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(404).json({ message: "Sport Adventure not found or does not belong to this provider." });
        }
        // --- NEW: Check provider status (Keep this check for providers updating their *own* services) ---
        const provider = await ServiceProvider.findById(providerId);
        if (!provider || provider.status !== 'Approved') {
            if (imageFile) fs.unlinkSync(imageFile.path);
            return res.status(403).json({ error: 'Provider account is not approved to modify services.' });
        }
        // --- END NEW ---

        if (imageFile) {
            const oldImagePath = path.join(__dirname, 'src', 'images', adventure.image);
            if (adventure.image && fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error(`Error deleting old image file: ${oldImagePath}`, err);
                    else console.log(`Deleted old image file on sport adventure update: ${oldImagePath}`);
                });
            }
            updateData.image = imageFile.filename;
        } else {
            // If no new image is uploaded, check if the frontend explicitly sent empty/null for image
            if (updateData.image === undefined) {
                // If image field is not in updateData, keep the old image
                updateData.image = adventure.image;
            } else if (updateData.image === null || updateData.image === '') {
                // If frontend explicitly sent empty/null, delete the old image and set image to empty string
                const oldImagePath = path.join(__dirname, 'src', 'images', adventure.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlink(oldImagePath, (err) => {
                        if (err) console.error(`Error deleting old image file (cleared): ${oldImagePath}`, err);
                        else console.log(`Deleted old image file because frontend sent empty image: ${oldImagePath}`);
                    });
                }
                updateData.image = '';
            }
        }


        delete updateData.providerId; // Prevent providerId from being updated
        delete updateData.id; // Prevent sport adventure ID from being updated

        if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price);
        if (updateData.minimumAge !== undefined) updateData.minimumAge = parseInt(updateData.minimumAge, 10);
        if (updateData.rating !== undefined) updateData.rating = parseFloat(updateData.rating);

        if (updateData.termsAndConditions && typeof updateData.termsAndConditions === 'string') {
            updateData.termsAndConditions = updateData.termsAndConditions.split(',').map(term => term.trim()).filter(term => term);
        } else if (updateData.termsAndConditions === '') {
            updateData.termsAndConditions = [];
        } else if (!Array.isArray(updateData.termsAndConditions)) {
            updateData.termsAndConditions = [];
        }


        const updatedAdventure = await SportAdventure.findByIdAndUpdate(
            adventureId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedAdventure) {
            return res.status(404).json({ message: "Sport Adventure not found" });
        }

        console.log("Sport Adventure updated:", updatedAdventure._id);
        res.json(updatedAdventure);

    } catch (error) {
        console.error("Error updating sport adventure:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Sport Adventure ID format" });
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
        }
        res.status(500).json({ error: "Failed to update sport adventure", details: error.message });
    }
});

// 🔹 Route to DELETE a Sport Adventure by ID - Add status check
app.delete("/api/sports-adventures/:id", async (req, res) => {
    console.log(`Backend received DELETE request for sport adventure ID: ${req.params.id}`);
    try {
        const adventureId = req.params.id;
        const providerId = req.body.providerId; // Expect providerId in the body for authorization

        if (!mongoose.Types.ObjectId.isValid(adventureId)) {
            return res.status(400).json({ error: "Invalid Sport Adventure ID format provided." });
        }
        if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
        }

        const adventure = await SportAdventure.findOne({ _id: adventureId, providerId: providerId });
        if (!adventure) {
            return res.status(404).json({ message: "Sport Adventure not found or does not belong to this provider." });
        }
        // --- NEW: Check provider status (Keep this check for providers deleting their *own* services) ---
        const provider = await ServiceProvider.findById(providerId);
        if (!provider || provider.status !== 'Approved') {
            return res.status(403).json({ error: 'Provider account is not approved to delete services.' });
        }
        // --- END NEW ---

        const result = await SportAdventure.findByIdAndDelete(adventureId);

        // Delete the associated image file
        if (adventure.image) {
            const imagePath = path.join(__dirname, 'src', 'images', adventure.image);
            fs.unlink(imagePath, (err) => {
                if (err) console.error(`Error deleting old image file: ${imagePath}`, err);
                else console.log(`Deleted old image file on sport adventure deletion: ${imagePath}`);
            });
        }


        console.log("Sport Adventure deleted:", adventureId);
        res.json({ message: "Sport Adventure deleted successfully" });

    } catch (error) {
        console.error("Error deleting sport adventure:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Sport Adventure ID format" });
        }
        res.status(500).json({ error: "Failed to delete sport adventure", details: error.message });
    }
});

// --- NEW ENDPOINT: Get Single Sport Adventure by ID (Public) ---
app.get("/api/sports-adventures/:id", async (req, res) => {
    console.log(`Backend received GET request for single Sport Adventure ID: ${req.params.id}`);
    const adventureId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(adventureId)) {
        return res.status(400).json({ error: "Invalid Sport Adventure ID format." });
    }

    try {
        const sportAdventure = await SportAdventure.findById(adventureId);
        if (!sportAdventure) {
            console.log(`Sport Adventure not found for ID: ${adventureId}`);
            return res.status(404).json({ message: 'Sport Adventure not found.' });
        }
        console.log(`Found Sport Adventure for ID: ${adventureId}`);
        res.status(200).json(sportAdventure);
    } catch (error) {
        console.error('Error fetching single Sport Adventure by ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Sport Adventure ID format." });
        }
        res.status(500).json({ error: 'Failed to fetch Sport Adventure details.', details: error.message });
    }
});
// --- ENDPOINTS FOR BOOKING REQUESTS (FOR PROVIDERS) ---

// Endpoint for Provider Booking Requests - Add status check
app.get('/api/provider/:providerId/booking-requests', async (req, res) => {
    console.log(`Backend received GET request for booking requests for provider ID: ${req.params.providerId}`);
    const providerId = req.params.providerId;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    try {
        const provider = await ServiceProvider.findById(providerId);
        if (!provider) {
            console.log(`Provider not found for ID: ${providerId} when fetching booking requests.`);
            return res.status(404).json({ message: 'Provider not found.' });
        }
        // --- NEW: Check provider status (Keep this check for providers viewing their *own* booking requests) ---
        if (provider.status !== 'Approved') {
            return res.status(403).json({ error: 'Provider account is not approved to view booking requests.' });
        }
        // --- END NEW ---

        let allBookingRequests = [];

        if (provider.serviceType === 'Accommodation') {
            const providerAccommodations = await Accommodation.find({ providerId: provider._id }).select('_id');
            const accommodationIds = providerAccommodations.map(service => service._id);
            // Populate both accommodationId and roomId for accommodation bookings
            allBookingRequests = await Booking.find({ accommodationId: { $in: accommodationIds } }).populate('accommodationId').populate('roomId');
        } else if (provider.serviceType === 'Transportation') {
            const providerTransportations = await Transportation.find({ providerId: provider._id }).select('_id');
            const transportationIds = providerTransportations.map(service => service._id);
            allBookingRequests = await TransportationBooking.find({ transportationId: { $in: transportationIds } }).populate('transportationId');
        } else if (provider.serviceType === 'Sport Adventure') {
            const providerSportAdventures = await SportAdventure.find({ providerId: provider._id }).select('_id');
            const sportAdventureIds = providerSportAdventures.map(service => service._id);
            allBookingRequests = await SportAdventureBooking.find({ sportAdventureId: { $in: sportAdventureIds } }).populate('sportAdventureId');
        }

        console.log(`Found ${allBookingRequests.length} booking requests for provider ${providerId}.`);
        res.json(allBookingRequests);

    } catch (error) {
        console.error('Error fetching provider booking requests:', error);
        res.status(500).json({ error: 'Failed to fetch booking requests.', details: error.message });
    }
});

// Endpoint to Update Booking Status - Add status check AND timestamps
app.put('/api/bookings/:bookingId/status', async (req, res) => {
    console.log(`Backend received PUT request to update status for booking ID: ${req.params.bookingId}`);
    const bookingId = req.params.bookingId;
    const { status, providerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ error: "Invalid Booking ID format." });
    }
    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
    }

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status provided. Must be 'Approved' or 'Rejected'." });
    }

    try {
        // --- NEW: Check provider status (Keep this check for providers updating booking status) ---
        const provider = await ServiceProvider.findById(providerId);
        if (!provider || provider.status !== 'Approved') {
            return res.status(403).json({ error: 'Provider account is not approved to update booking status.' });
        }
        // --- END NEW ---

        let updatedBooking = null;
        let bookingModel = null;
        let bookingService = null;

        // Find the booking across all booking collections
        // For Accommodation bookings, populate both accommodationId and roomId
        let booking = await Booking.findById(bookingId).populate('accommodationId').populate('roomId');
        if (booking && booking.accommodationId?.providerId.toString() === providerId) {
            // Update status and timestamps
            updatedBooking = await Booking.findByIdAndUpdate(bookingId,
                { status: status, approvedAt: status === 'Approved' ? new Date() : undefined, rejectedAt: status === 'Rejected' ? new Date() : undefined },
                { new: true }
            );
            bookingModel = 'AccommodationBooking';
            bookingService = booking.accommodationId;
        }

        if (!updatedBooking) {
            booking = await TransportationBooking.findById(bookingId).populate('transportationId');
            if (booking && booking.transportationId?.providerId.toString() === providerId) {
                // Update status and timestamps
                updatedBooking = await TransportationBooking.findByIdAndUpdate(bookingId,
                    { status: status, approvedAt: status === 'Approved' ? new Date() : undefined, rejectedAt: status === 'Rejected' ? new Date() : undefined },
                    { new: true }
                );
                bookingModel = 'TransportationBooking';
                bookingService = booking.transportationId;
            }
        }

        if (!updatedBooking) {
            booking = await SportAdventureBooking.findById(bookingId).populate('sportAdventureId');
            if (booking && booking.sportAdventureId?.providerId.toString() === providerId) {
                // Update status and timestamps
                updatedBooking = await SportAdventureBooking.findByIdAndUpdate(bookingId,
                    { status: status, approvedAt: status === 'Approved' ? new Date() : undefined, rejectedAt: status === 'Rejected' ? new Date() : undefined },
                    { new: true }
                );
                bookingModel = 'SportAdventureBooking';
                bookingService = booking.sportAdventureId;
            }
        }


        if (!updatedBooking) {
            console.log(`Booking not found for ID: ${bookingId} or does not belong to provider ${providerId} for status update.`);
            return res.status(404).json({ message: 'Booking request not found or does not belong to this provider.' });
        }

        // Send email notification to the user about booking status change
        if (updatedBooking && updatedBooking.user_email) {
            let subject = '';
            let emailText = '';
            let serviceName = 'the service';
            let bookingDetailsSummary = '';

            if (bookingModel === 'AccommodationBooking') {
                serviceName = updatedBooking.accommodationName || (bookingService ? bookingService.accommodationName : 'Unknown Accommodation');
                bookingDetailsSummary = `
Accommodation: ${serviceName}
Room: ${updatedBooking.roomNumber} (${updatedBooking.roomType})
Price Per Night: ₹${updatedBooking.pricePerNight}
Check-in Date: ${updatedBooking.check_in_date ? new Date(updatedBooking.check_in_date).toDateString() : 'N/A'}
Check-out Date: ${updatedBooking.check_out_date ? new Date(updatedBooking.check_out_date).toDateString() : 'N/A'}
Total Guests: ${updatedBooking.total_guests !== undefined ? updatedBooking.total_guests : 'N/A'}
Total Price: ₹${updatedBooking.total_price !== undefined ? updatedBooking.total_price.toLocaleString('en-IN') : 'N/A'}
Booking Date: ${updatedBooking.booking_datetime ? new Date(updatedBooking.booking_datetime).toLocaleString() : 'N/A'}
Status Updated At: ${status === 'Approved' && updatedBooking.approvedAt ? new Date(updatedBooking.approvedAt).toLocaleString() : status === 'Rejected' && updatedBooking.rejectedAt ? new Date(updatedBooking.rejectedAt).toLocaleString() : 'N/A'}
`;
            } else if (bookingModel === 'TransportationBooking') {
                serviceName = updatedBooking.transportationName || (bookingService ? (bookingService.model || bookingService.transport_type) : 'Unknown Transportation');
                bookingDetailsSummary = `
Transportation: ${serviceName}
Date of Travel: ${updatedBooking.date_of_travel ? new Date(updatedBooking.date_of_travel).toDateString() : 'N/A'}
Total Passengers: ${updatedBooking.total_passengers !== undefined ? updatedBooking.total_passengers : 'N/A'}
Total Price: ₹${updatedBooking.total_price !== undefined ? updatedBooking.total_price.toLocaleString('en-IN') : 'N/A'}
Booking Date: ${updatedBooking.booking_datetime ? new Date(updatedBooking.booking_datetime).toLocaleString() : 'N/A'}
Status Updated At: ${status === 'Approved' && updatedBooking.approvedAt ? new Date(updatedBooking.approvedAt).toLocaleString() : status === 'Rejected' && updatedBooking.rejectedAt ? new Date(updatedBooking.rejectedAt).toLocaleString() : 'N/A'}
`;
            } else if (bookingModel === 'SportAdventureBooking') {
                serviceName = updatedBooking.sportAdventureName || (bookingService ? bookingService.name : 'Unknown Sport Adventure');
                bookingDetailsSummary = `
Sport Adventure: ${serviceName}
Date of Activity: ${updatedBooking.date_of_activity ? new Date(updatedBooking.date_of_activity).toDateString() : 'N/A'}
Total Participants: ${updatedBooking.total_participants !== undefined ? updatedBooking.total_participants : 'N/A'}
Total Price: ₹${updatedBooking.total_price !== undefined ? updatedBooking.total_price.toLocaleString('en-IN') : 'N/A'}
Booking Date: ${updatedBooking.booking_datetime ? new Date(updatedBooking.booking_datetime).toLocaleString() : 'N/A'}
Status Updated At: ${status === 'Approved' && updatedBooking.approvedAt ? new Date(updatedBooking.approvedAt).toLocaleString() : status === 'Rejected' && updatedBooking.rejectedAt ? new Date(updatedBooking.rejectedAt).toLocaleString() : 'N/A'}
`;
            }


            if (status === 'Approved') {
                subject = `Your Booking for ${serviceName} has been Approved!`;
                emailText = `
Dear ${updatedBooking.user_name || 'User'},

Good news! Your booking for ${serviceName} has been approved.

Booking Details:
${bookingDetailsSummary}

You can now proceed with your plans.

Thank you for booking with us!

Best regards,
The [Your Website Name] Team
`;
            } else if (status === 'Rejected') {
                subject = `Your Booking for ${serviceName} has been Rejected`;
                emailText = `
Dear ${updatedBooking.user_name || 'User'},

We regret to inform you that your booking for ${serviceName} has been rejected.

Booking Details:
${bookingDetailsSummary}

If you have any questions, please contact us.

We apologize for any inconvenience this may cause.

Best regards,
The [Your Website Name] Team
`;
            }

            try {
                await transporter.sendMail({
                    from: 'maleksehban4@gmail.com', // Replace with your actual email
                    to: updatedBooking.user_email,
                    subject: subject,
                    text: emailText,
                });
                console.log(`Booking status email sent to ${updatedBooking.user_email} for booking ID: ${bookingId}`);
            } catch (emailError) {
                console.error(`Error sending booking status email to ${updatedBooking.user_email}:`, emailError);
            }
        }

        res.json({ message: 'Booking status updated successfully!', booking: updatedBooking });

    } catch (error) {
        console.error('Error updating booking status:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Booking ID format." });
        }
        res.status(500).json({ error: 'Failed to update booking status.', details: error.message });
    }
});

// ✅ Get All Bookings for a Specific Sport Adventure
app.get("/api/sports-adventures/:adventureId/bookings", async (req, res) => {
    const { adventureId } = req.params;

    try {
        const bookings = await SportAdventureBooking.find({ adventureId });
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings for sport adventure:", error);
        res.status(500).json({ message: "Failed to fetch bookings." });
    }
});
// GET Provider Profile by ID - No change needed, it already excludes password
app.get('/api/providers/:providerId', async (req, res) => {
    console.log(`Backend received GET request for single provider ID: ${req.params.providerId}`);
    const providerId = req.params.providerId;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    try {
        // Find the service provider by ID, excluding the password field
        const provider = await ServiceProvider.findById(providerId).select('-password');

        if (!provider) {
            console.log(`Provider not found for ID: ${providerId}`);
            return res.status(404).json({ message: 'Provider not found.' });
        }

        console.log(`Found provider for ID: ${providerId}`);
        res.status(200).json(provider);

    } catch (error) {
        console.error('Error fetching single provider by ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Provider ID format." });
        }
        res.status(500).json({ error: 'Failed to fetch provider details.', details: error.message });
    }
});

// --- NEW SERVICE PROVIDER ENDPOINT: Request OTP for Password Change ---
app.post("/api/providers/:providerId/send-otp-password-change", async (req, res) => {
    console.log(`Backend received POST request to send OTP for password change for provider ID: ${req.params.providerId}`);
    const { currentPassword, newPassword } = req.body;
    const providerId = req.params.providerId;

    // Authorization: Ensure the requesting provider matches the URL providerId
    if (req.providerId.toString() !== providerId) {
        return res.status(403).json({ message: 'Forbidden: You are not authorized to perform this action for another provider.' });
    }

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    // Basic validation
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required." });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    try {
        const provider = await ServiceProvider.findById(providerId);
        if (!provider) {
            return res.status(404).json({ message: "Provider not found." });
        }

        // --- Verify current password ---
        // Assuming currentPassword is NOT hashed for Super Admin (as per earlier instructions)
        // If you *were* using bcrypt, it would be: const isMatch = await bcrypt.compare(currentPassword, provider.password);
        const isMatch = (currentPassword === provider.password); // Direct comparison for unhashed passwords

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid current password." });
        }

        // --- Generate OTP ---
        const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
        const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        // Store OTP and its expiry in the provider document
        provider.otp = otp;
        provider.otpExpiry = otpExpiry;
        provider.newPasswordTemp = newPassword; // Temporarily store new password for verification step

        await provider.save();
        console.log(`OTP generated and saved for provider ${providerId}: ${otp}`);

        // --- Send OTP to provider's email ---
        const mailOptions = {
            from: 'maleksehban4@gmail.com', // Use your configured email
            to: provider.email,
            subject: 'Password Change OTP for Travel Booking Platform',
            html: `
                <p>Dear ${provider.ownerFullName || provider.businessName || 'Service Provider'},</p>
                <p>You have requested to change your password for the Travel Booking Platform. Your One-Time Password (OTP) is:</p>
                <h3><strong>${otp}</strong></h3>
                <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,<br>The Travel Booking Platform Team</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${provider.email}`);

        res.status(200).json({ message: "OTP sent to your registered email for password change." });

    } catch (error) {
        console.error('Error sending OTP for password change:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Provider ID format." });
        }
        res.status(500).json({ error: 'Failed to send OTP.', details: error.message });
    }
});

// --- NEW SERVICE PROVIDER ENDPOINT: Verify OTP and Change Password ---
app.put("/api/providers/:providerId/verify-otp-and-change-password", async (req, res) => {
    console.log(`Backend received PUT request to verify OTP and change password for provider ID: ${req.params.providerId}`);
    const { otp, newPassword } = req.body;
    const providerId = req.params.providerId;

    // Authorization: Ensure the requesting provider matches the URL providerId
    if (req.providerId.toString() !== providerId) {
        return res.status(403).json({ message: 'Forbidden: You are not authorized to perform this action for another provider.' });
    }

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    if (!otp || !newPassword) {
        return res.status(400).json({ error: "OTP and new password are required." });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long." });
    }

    try {
        const provider = await ServiceProvider.findById(providerId);
        if (!provider) {
            return res.status(404).json({ message: "Provider not found." });
        }

        // --- Verify OTP and Expiry ---
        if (!provider.otp || !provider.otpExpiry || provider.otp !== otp || Date.now() > provider.otpExpiry) {
            return res.status(400).json({ error: "Invalid or expired OTP." });
        }

        // --- Verify newPasswordTemp matches newPassword from this request ---
        if (provider.newPasswordTemp !== newPassword) {
            // This is a security check: ensure the new password provided now matches the one stored with the OTP.
            // This prevents someone from intercepting the OTP and setting a *different* new password.
            return res.status(400).json({ error: "New password mismatch. Please retry the password change process." });
        }


        // --- Update Password ---
        // Assuming currentPassword is NOT hashed for Super Admin (as per earlier instructions)
        // If you *were* using bcrypt, it would be: provider.password = await bcrypt.hash(newPassword, 10);
        provider.password = newPassword; // Direct assignment for unhashed passwords

        // Clear OTP related fields after successful password change
        provider.otp = undefined;
        provider.otpExpiry = undefined;
        provider.newPasswordTemp = undefined;

        await provider.save();
        console.log(`Password successfully changed for provider ${providerId}`);

        res.status(200).json({ message: "Password changed successfully!" });

    } catch (error) {
        console.error('Error verifying OTP or changing password:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Provider ID format." });
        }
        res.status(500).json({ error: 'Failed to change password.', details: error.message });
    }
});


// --- NEW ENDPOINT: Get Single Service Provider by ID ---
// This endpoint will be used by the Service Provider Dashboard to fetch their own details.
app.get('/api/providers/:providerId', async (req, res) => {
    console.log(`Backend received GET request for single provider ID: ${req.params.providerId}`);
    const providerId = req.params.providerId;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    try {
        // Find the service provider by ID, excluding the password field
        const provider = await ServiceProvider.findById(providerId).select('-password');

        if (!provider) {
            console.log(`Provider not found for ID: ${providerId}`);
            return res.status(404).json({ message: 'Provider not found.' });
        }

        console.log(`Found provider for ID: ${providerId}`);
        res.status(200).json(provider);

    } catch (error) {
        console.error('Error fetching single provider by ID:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Provider ID format." });
        }
        res.status(500).json({ error: 'Failed to fetch provider details.', details: error.message });
    }
});
// --- END NEW ENDPOINT ---


// 🔹 Route for a Provider to Add a New Accommodation - UPDATED FOR MULTI-ROOM
app.post("/api/provider/:providerId/accommodations", upload, async (req, res) => {
    console.log(`Backend received POST request for adding accommodation for provider ${req.params.providerId}`);
    const providerId = req.params.providerId;
    const { rooms, ...accommodationData } = req.body;
    const mainImageFile = req.files && req.files['image'] ? req.files['image'][0] : null;

    let parsedRooms = [];
    if (rooms) {
        try {
            parsedRooms = JSON.parse(rooms);
        } catch (parseError) {
            console.error('Error parsing rooms JSON:', parseError);
            return res.status(400).json({ error: "Invalid rooms data format. Must be a valid JSON string." });
        }
    }

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    if (!accommodationData.accommodationType || !accommodationData.accommodationName ||
        !accommodationData.ownerName || !accommodationData.address) {
        return res.status(400).json({ error: 'Missing required fields for main accommodation details.' });
    }

    if (!parsedRooms || parsedRooms.length === 0) {
        return res.status(400).json({ error: 'At least one room detail is required for the accommodation.' });
    }

    try {
        const provider = await ServiceProvider.findById(providerId);
        if (!provider) {
            return res.status(404).json({ error: 'Provider not found.' });
        }
        if (provider.status !== 'Approved') {
            return res.status(403).json({ error: 'Provider account is not approved to add services.' });
        }
        if (provider.serviceType !== 'Accommodation') {
            return res.status(403).json({ error: 'Provider is not authorized to add Accommodation services.' });
        }

        // Generate unique accommodation ID
        const prefix = accommodationTypePrefixes[accommodationData.accommodationType] || 'A';
        let generatedAccommodationId;
        let counter = 0;
        const maxRetries = 10;

        while (counter < maxRetries) {
            const last = await Accommodation.findOne({ accommodationID: new RegExp(`^${prefix}\\d+$`) })
                .sort({ accommodationID: -1 })
                .limit(1);

            const nextNumber = last ? parseInt(last.accommodationID.replace(prefix, '')) + 1 : 1;
            generatedAccommodationId = `${prefix}${String(nextNumber).padStart(2, '0')}`;
            const exists = await Accommodation.findOne({ accommodationID: generatedAccommodationId });

            if (!exists) break;
            counter++;
        }

        if (counter === maxRetries) {
            return res.status(500).json({ error: 'Failed to generate unique Accommodation ID.' });
        }

        // Step 1: Save the Accommodation first
        const newAccommodation = new Accommodation({
            providerId: providerId,
            accommodationID: generatedAccommodationId,
            accommodationType: accommodationData.accommodationType,
            accommodationName: accommodationData.accommodationName,
            ownerName: accommodationData.ownerName,
            address: accommodationData.address,
            image: mainImageFile ? mainImageFile.filename : (accommodationData.image || ''),
            termsAndConditions: accommodationData.termsAndConditions || '',
            nearbyLocations: accommodationData.nearbyLocations || '',
            rooms: [] // To be added next
        });

        await newAccommodation.save();

        // Step 2: Save rooms with the generated accommodation ID
        const roomImageFiles = req.files['roomImages'] || [];
        const roomIds = [];

        for (let i = 0; i < parsedRooms.length; i++) {
            const room = parsedRooms[i];
            const roomImage = roomImageFiles[i]?.filename || '';

            const newRoom = new Room({
                accommodationId: newAccommodation._id,
                roomNumber: room.roomNumber,
                roomType: room.roomType,
                pricePerNight: parseFloat(room.pricePerNight),
                numberOfBeds: parseInt(room.numberOfBeds),
                roomFacilities: room.roomFacilities || [],
                roomAmenities: room.roomAmenities || [],
                description: room.description || '',
                image: roomImage
            });

            await newRoom.save();
            roomIds.push(newRoom._id);
        }

        // Step 3: Update accommodation with room references
        newAccommodation.rooms = roomIds;
        await newAccommodation.save();

        console.log("Accommodation and rooms successfully created.");
        res.status(201).json(newAccommodation);

    } catch (error) {
        console.error("Error adding accommodation:", error);
        res.status(500).json({ error: 'Failed to add accommodation.', details: error.message });
    }
});

// 🔹 Route for a Provider to Get Their Accommodations - MODIFIED (Populate rooms)
app.get("/api/provider/:providerId/accommodations", async (req, res) => {
    console.log(`Backend received GET request for provider ${req.params.providerId}'s accommodations`);
    const providerId = req.params.providerId;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format." });
    }

    try {
        const provider = await ServiceProvider.findById(providerId);
        if (!provider) {
            console.log(`Provider not found for ID: ${providerId} when fetching accommodations.`);
            return res.status(404).json({ message: 'Provider not found.' });
        }
        if (provider.serviceType !== 'Accommodation') {
            return res.status(403).json({ error: 'Provider is not authorized to view Accommodation services.' });
        }

        // Populate the 'rooms' array with actual Room documents
        const accommodations = await Accommodation.find({ providerId: providerId }).populate('rooms');
        console.log(`Found ${accommodations.length} accommodations for provider ${providerId}.`);
        res.status(200).json(accommodations);

    } catch (error) {
        console.error("Error fetching accommodations for provider:", providerId, error);
        res.status(500).json({ error: "Failed to fetch accommodations", details: error.message });
    }
});


app.put('/api/providers/:id', upload, async (req, res) => {
    console.log(`Backend received PUT request for provider profile ID: ${req.params.id}`);
    const providerId = req.params.id; // Get ID from URL parameter

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(400).json({ error: "Invalid Provider ID format provided." });
    }

    // Prepare update data from req.body
    const updateData = { ...req.body };
    console.log("Update Data received:", updateData);

    // Frontend sends 'contactNumber' but schema expects 'phoneNumber'
    if (updateData.contactNumber) {
        updateData.phoneNumber = updateData.contactNumber;
        delete updateData.contactNumber; // Remove the old field name
    }

    // Handle nested JSON strings from FormData if they were sent as such
    // In ProviderProfile.js, only transportationDetails and sportAdventureDetails are stringified.
    if (updateData.transportationDetails) {
        try {
            updateData.transportationDetails = JSON.parse(updateData.transportationDetails);
        } catch (e) {
            console.error("Failed to parse transportationDetails:", e);
            return res.status(400).json({ error: "Invalid format for transportation details." });
        }
    }
    if (updateData.sportAdventureDetails) {
        try {
            updateData.sportAdventureDetails = JSON.parse(updateData.sportAdventureDetails);
        } catch (e) {
            console.error("Failed to parse sportAdventureDetails:", e);
            return res.status(400).json({ error: "Invalid format for sport adventure details." });
        }
    }
    // Handle arrays that might be stringified (like typeOfAdventureActivity, roomTypesOffered etc.)
    // Although current ProviderProfile.js doesn't edit these, if it did, they'd be stringified.
    for (const key of ['roomTypesOffered', 'facilitiesAvailable', 'typeOfAdventureActivity']) {
        if (updateData[key] && typeof updateData[key] === 'string') {
            try {
                updateData[key] = JSON.parse(updateData[key]);
            } catch (e) {
                console.error(`Failed to parse array field ${key}:`, e);
                return res.status(400).json({ error: `Invalid format for ${key}.` });
            }
        }
    }


    // Frontend currently sends document/image paths as strings, not new files for update.
    // If you plan to allow re-uploading documents/service photos, you'd need logic here
    // similar to the ServiceProvider signup route to handle req.files and delete old files.
    // For now, we assume these fields are either kept as is or cleared from the frontend
    // by sending an empty string. Multer has already parsed them, so they are in req.body.


    try {
        // Find the provider and update
        // We select the password to keep it in the document object, even though we don't update it.
        // This prevents Mongoose from thinking it's missing if you just update other fields.
        const updatedProvider = await ServiceProvider.findByIdAndUpdate(
            providerId,
            { $set: updateData }, // Use $set to update only specified fields
            { new: true, runValidators: true } // Return the updated document and run schema validators
        ).select('-password'); // Exclude password from the response

        if (!updatedProvider) {
            console.log(`Provider not found for update ID: ${providerId}`);
            return res.status(404).json({ message: "Provider not found." });
        }

        console.log("Provider profile updated successfully:", updatedProvider._id);
        res.status(200).json({ message: "Profile updated successfully!", provider: updatedProvider });

    } catch (error) {
        console.error("Error updating provider profile:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Provider ID format." });
        }
        res.status(500).json({ error: "Failed to update profile. Please try again.", details: error.message });
    }
});
// --- NEW ENDPOINT: Update Accommodation Booking Status ---
app.put('/api/accommodation-bookings/:id/status', async (req, res) => {
    console.log(`Backend received PUT request to update accommodation booking status for ID: ${req.params.id}`);
    const bookingId = req.params.id;
    const { status } = req.body; // Expecting 'Approved' or 'Rejected'
    const providerId = req.body.providerId; // Passed from frontend for authorization

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
        return res.status(400).json({ error: "Invalid Booking ID format." });
    }
    if (!status || !['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid status provided. Must be 'Approved' or 'Rejected'." });
    }
    if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
        return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
    }

    try {
        const booking = await Booking.findById(bookingId).populate('accommodationId');
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        // Authorization check: Ensure the booking belongs to the logged-in provider's accommodation
        if (!booking.accommodationId || booking.accommodationId.providerId.toString() !== providerId) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to update this booking." });
        }

        if (booking.status !== 'Pending') {
            return res.status(400).json({ message: `Booking is already ${booking.status}.` });
        }

        const updateFields = { status: status };
        if (status === 'Approved') {
            updateFields.approvedAt = new Date();
            updateFields.rejectedAt = undefined; // Clear if previously rejected
        } else if (status === 'Rejected') {
            updateFields.rejectedAt = new Date();
            updateFields.approvedAt = undefined; // Clear if previously approved
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            updateFields,
            { new: true, runValidators: true }
        ).populate('accommodationId');

        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found after update." });
        }

        // Send email notification to user
        const mailOptions = {
            from: 'maleksehban4@gmail.com', // Replace with your actual email
            to: updatedBooking.user_email,
            subject: `Your Accommodation Booking for ${updatedBooking.accommodationName} is ${status}`,
            html: `
                <p>Dear ${updatedBooking.user_name},</p>
                <p>Your booking for ${updatedBooking.accommodationName} (Room ${updatedBooking.roomNumber}, ${updatedBooking.roomType}) has been <strong>${status}</strong>.</p>
                <p><strong>Booking Details:</strong></p>
                <ul>
                    <li>Check-in: ${new Date(updatedBooking.check_in_date).toLocaleDateString()}</li>
                    <li>Check-out: ${new Date(updatedBooking.check_out_date).toLocaleDateString()}</li>
                    <li>Guests: ${updatedBooking.total_guests}</li>
                    <li>Total Price: ₹${updatedBooking.total_price.toLocaleString('en-IN')}</li>
                    <li>Booking ID: ${updatedBooking._id}</li>
                </ul>
                <p>Thank you for booking with us!</p>
            `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`Booking status updated to ${status} and email sent for booking ID: ${updatedBooking._id}`);

        // The error is here: `updatedUpdatedBooking`
        res.json({ message: `Booking ${status} successfully.`, booking: updatedBooking });        // It should be:
        // res.json({ message: `Booking ${status} successfully.`, booking: updatedBooking });

    } catch (error) {
        console.error(`Error updating accommodation booking status for ${bookingId}:`, error);
        if (error.name === 'CastError') {
            return res.status(400).json({ error: "Invalid Booking ID format." });
        }
        res.status(500).json({ error: 'Failed to update booking status.', details: error.message });
    }
});