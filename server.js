const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const nodemailer = require("nodemailer");
const crypto = require('crypto'); // Needed for password generation and OTP
const multer = require("multer"); // Import multer
const fs = require('fs'); // Import fs for file operations (like deleting old images)
require('dotenv').config(); // Load .env
const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:3000',  // ✅ Exact origin of your React frontend
    credentials: true                 // ✅ Allow credentials (cookies, authorization headers)
}));

// --- Serve static files from the 'src/images' directory ---
// We will also fix these paths below to remove the triple 'src'
// app.use('/images', express.static(path.join(__dirname, 'src', 'images')));
// app.use('/documents', express.static(path.join(__dirname, 'src', 'documents')));

// console.log(`Serving static images from: ${path.join(__dirname, 'src/images')}`); // <-- NOTE: console.log itself still has 'src/images'
// console.log(`Serving static documents from: ${path.join(__dirname, 'src/documents')}`); // <-- NOTE: console.log itself still has 'src/documents'
// // Serve React build files
// app.use(express.static(path.join(__dirname, 'build')));


// --- Multer Setup for Image Uploads ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        // CORRECTED PATHS: If server.js runs from /opt/render/project/src/,
        // then images and documents are directly in that directory.
        if (file.fieldname === 'image' || file.fieldname.startsWith('roomImages') || file.fieldname === 'servicePhotos') {
            uploadPath = path.join(__dirname, 'images'); // FIXED: Removed 'src' here
        } else if (['aadharPanCard', 'businessRegistrationCertificate', 'bankAccountDetails', 'gstNumber'].includes(file.fieldname)) {
            uploadPath = path.join(__dirname, 'documents'); // FIXED: Removed 'src' here
        } else {
            console.error(`Multer Destination Error: Unexpected fieldname received: "${file.fieldname}". Original filename: "${file.originalname}"`);
            return cb(new Error(`Multer Error: Unexpected fieldname "${file.fieldname}".`), false);
        }

        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage }).fields([
    { name: 'aadharPanCard', maxCount: 1 },
    { name: 'businessRegistrationCertificate', maxCount: 1 },
    { name: 'bankAccountDetails', maxCount: 1 },
    { name: 'gstNumber', maxCount: 1 },
    { name: 'servicePhotos', maxCount: 5 },
    { name: 'image', maxCount: 1 },
    { name: 'roomImages', maxCount: 20 }
]);

const uploadSingle = multer({ storage: storage });


// NEW: Multer instance for single file uploads.
// This 'uploadSingle' instance is used for:
// 1. Transportation forms (single vehicle image)
// 2. Sport Adventure forms (single activity image)
const emailUser = process.env.EMAIL_USER; // This is correct
const emailPass = process.env.EMAIL_PASS; // This is correct

// --- Nodemailer Setup for Sending Emails ---
// IMPORTANT: Replace with your actual email service credentials and settings

// Transporter configuration using environment variables
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for port 465, false for 587
    auth: {
        // Use the constants you defined, or directly use the correct environment variable names
        user: emailUser, // FIXED: Changed from process.env.emailUser to emailUser (constant)
        pass: emailPass, // FIXED: Changed from process.env.emailPass to emailPass (constant)
        // Alternative (if you prefer not to use the constants):
        // user: process.env.EMAIL_USER,
        // pass: process.env.EMAIL_PASS,
    },
});

// Optional: Verify transporter
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Nodemailer connection error:", error);
    } else {
        console.log("✅ Nodemailer is ready to send emails");
    }
});


// Optional: Verify transporter
transporter.verify((error, success) => {
    if (error) {
        console.error("❌ Nodemailer connection error:", error);
    } else {
        console.log("✅ Nodemailer is ready to send emails");
    }
});



// Load credentials from .env
const mongoURI = process.env.MONGODB_URI;


// MongoDB Connection (cleaned - no deprecated options)
mongoose.connect(mongoURI)
    .then(() => console.log("✅ Connected to MongoDB Atlas"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// --- Schemas and Models ---

const allowedRoomTypes = {
    Hotels: ["Standard Room", "Deluxe Room", "Suite", "Executive Suite", "Family Room", "Presidential Suite"],
    Resorts: ["Cottage", "Bungalow", "Luxury Suite", "Private Villa", "Tent", "Chalet"],
    Homestays: ["Private Room", "Entire Home/Apartment", "Shared Room", "Studio", "Basic Room", "Family Suite"],
    Villas: ["Entire Villa", "With Private Pool", "Multiple Bedrooms", "Sea-facing", "Garden View", "Luxury Villa", "Budget Villa"],
    Apartments: ["Studio Apartment", "1-Bedroom Apartment", "2-Bedroom Apartment", "3-Bedroom Apartment", "Penthouse", "Serviced Apartment"],
    Guesthouses: ["Single Room", "Double Room", "Twin Room", "Triple Room", "Dorm Room", "En-suite Room"]
};

// Map accommodation types to prefixes for ID generation
const accommodationTypePrefixes = {
    Hotels: 'H',
    Resorts: 'R',
    Homestays: 'M', // Using M for Homestays to avoid conflict if H is used for Hotels
    Villas: 'V',
    Apartments: 'A',
    Guesthouses: 'G'
    // Add other types if needed
};

// Map transportation types to prefixes for ID generation
const transportationTypePrefixes = {
    Car: 'TC', // Transportation Car
    Bus: 'TB', // Transportation Bus
    Train: 'TT', // Transportation Train
    Flight: 'TF', // Transportation Flight
    Boat: 'TO', // Transportation Boat (using O for Ocean/Other)
    // Add other transportation types if needed
    Other: 'TX' // Default/Other Transportation
};

// Map sport adventure types to prefixes for ID generation
const sportAdventureTypePrefixes = {
    Hiking: 'SH', // Sport Hiking
    Trekking: 'ST', // Sport Trekking
    Climbing: 'SC', // Sport Climbing
    WaterSports: 'SW', // Sport Water Sports
    AdventureSports: 'SA', // Sport Adventure Sports
    // Add other sport adventure types if needed
    Other: 'SX' // Default/Other Sport Adventure
};

// --- Super Admin Schema ---
const superAdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    // --- Added fields for OTP for Super Admin ---
    otp: { type: String },
    otpExpires: { type: Date }
    // WARNING: Password is NOT hashed in this schema as per instruction.
    // This is INSECURE for production environments.
});

// No pre-save middleware for hashing password (as per instruction)

// No comparePassword method using bcrypt (as per instruction)

const SuperAdmin = mongoose.model('SuperAdmin', superAdminSchema);


// Service Provider Schema - MAJOR UPDATE
const serviceProviderSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null }, // Will be set after approval/payment, or generated

    // Onboarding/Verification Status
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    applicationDate: { type: Date, default: Date.now },
    verifiedBy: { type: String }, // Admin who verified
    verificationDate: { type: Date },
    remarks: { type: String }, // Admin remarks
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Skipped'], default: 'Pending' }, // 'Skipped' if no payment required

    // Basic Information (Common to all Service Providers)
    businessName: { type: String, required: true },
    ownerFullName: { type: String, required: true },
    serviceType: { type: String, enum: ['Accommodation', 'Transportation', 'Sport Adventure'], required: true },
    businessRegistrationNumber: { type: String }, // Optional
    phoneNumber: { type: String, required: true },
    whatsappNumber: { type: String },
    email: { type: String, required: true },
    alternateContactPerson: { type: String },
    fullBusinessAddress: { type: String, required: true },
    state: { type: String, required: true },
    city: { type: String, required: true },
    pinCode: { type: String, required: true },
    websiteSocialMediaLink: { type: String },
    preferredModeOfContact: { type: String, enum: ['Phone', 'Email', 'WhatsApp'], required: true },

    // Section A: Accommodation Information (Conditional - now empty for signup)
    accommodationDetails: {
        // No specific fields here for the signup form
        // These fields will be populated in the dashboard after approval
    },

    // Section B: Transportation (Conditional - now empty for signup)
    transportationDetails: {
        // No specific fields here for the signup form
    },

    // Section C: Sport Adventure Provider Information (Conditional - now empty for signup)
    sportAdventureDetails: {
        // No specific fields here for the signup form
    },

    // Document Uploads (Stored as filenames)
    aadharPanCard: { type: String, required: true }, // Filename
    businessRegistrationCertificate: { type: String }, // Filename, optional
    bankAccountDetails: { type: String, required: true }, // Filename
    gstNumber: { type: String }, // Filename, optional
    servicePhotos: { type: [String] }, // CHANGED TO ARRAY of Strings to match frontend sending multiple files

}, { timestamps: true }); // Add timestamps for creation/update dates

const ServiceProvider = mongoose.model("ServiceProvider", serviceProviderSchema);

// --- NEW: Room Schema for multi-room accommodations ---
const roomSchema = new mongoose.Schema({
    accommodationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Accommodation', required: true },
    roomNumber: { type: String, required: true },
    roomType: { type: String, required: true }, // e.g., "Standard Room", "Deluxe Room"
    pricePerNight: { type: Number, required: true, min: 0 },
    numberOfBeds: { type: Number, required: true, min: 1 },
    roomFacilities: { type: [String], default: [] }, // e.g., "AC", "TV"
    roomAmenities: { type: [String], default: [] },  // e.g., "Mini-bar", "Coffee/Tea Maker"
    description: { type: String },
    image: { type: String }, // Filename for this specific room's image
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);


// --- Accommodation Schema (UPDATED for multi-room support) ---
const accommodationSchema = new mongoose.Schema({
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true },
    accommodationID: { type: String, required: true, unique: true }, // Still required and unique in DB
    accommodationType: { type: String, enum: Object.keys(allowedRoomTypes), required: true },
    accommodationName: { type: String, required: true },
    ownerName: { type: String, required: true },
    address: { type: String, required: true },
    image: { type: String }, // Main accommodation image
    termsAndConditions: { type: String, default: "" },
    nearbyLocations: { type: String, default: "" },
    rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }] // Reference to multiple Room documents
}, { timestamps: true }); // Added timestamps option

const Accommodation = mongoose.model("Accommodation", accommodationSchema);

// --- Booking Schema (Updated with Timestamps) ---
const bookingSchema = new mongoose.Schema({
    accommodationId: { type: mongoose.Schema.Types.ObjectId, ref: "Accommodation", required: true },
    // If you want to store room-specific details directly in booking, you'll need to pass them from frontend
    // For now, it refers to the parent accommodation and assumes room details are looked up.
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true }, // Reference to the specific room booked
    accommodationName: { type: String, required: true }, // Added field for accommodation name
    roomNumber: { type: String, required: true }, // Store room number directly
    roomType: { type: String, required: true }, // Store room type directly
    pricePerNight: { type: Number, required: true }, // Store price directly
    user_name: { type: String, required: true },
    user_mobile: { type: String, required: true },
    user_email: { type: String, required: true }, // Added user_email field
    check_in_date: { type: Date, required: true },
    check_out_date: { type: Date, required: true },
    total_guests: { type: Number, required: true, min: 1 },
    duration: Number, // This should be calculated on frontend based on dates
    total_price: { type: Number, required: true, min: 0 },
    booking_datetime: { type: Date, default: Date.now }, // Already exists
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    // --- Added fields for Approval/Rejection Timestamps ---
    approvedAt: { type: Date },
    rejectedAt: { type: Date }
});
const Booking = mongoose.model("Booking", bookingSchema);

// --- Transportation Schema (Added Timestamps) ---
const transportationSchema = new mongoose.Schema({
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true }, // Re-added
    id: { type: String, required: true, unique: true }, // Added required and unique constraint
    driver_name: { type: String, required: true },
    transport_type: { type: String, required: true },
    model: { type: String },
    price_per_day: { type: Number, required: true, min: 0 },
    rating: { type: String },
    image: { type: String }, // Image field to store the file path/name
    features: { type: [String], default: [] },
    termsAndConditions: { type: String },
    // These fields are part of the Transportation *service* schema, not the provider application schema
    vehicleType: [{ type: String }],
    acAvailable: { type: String },
    permitType: { type: String },
    insuranceValidTill: { type: Date },
}, { timestamps: true }); // Added timestamps option

const Transportation = mongoose.model("Transportation", transportationSchema);

// --- Transportation Booking Schema (Updated with Timestamps) ---
const transportationBookingSchema = new mongoose.Schema({
    transportationId: { type: mongoose.Schema.Types.ObjectId, ref: "Transportation", required: true },
    transportationName: { type: String, required: true }, // Added field for transportation name
    user_name: { type: String, required: true },
    user_mobile: { type: String, required: true },
    user_email: { type: String, required: true }, // Added user_email field
    date_of_travel: { type: Date, required: true },
    total_passengers: { type: Number, required: true, min: 1 },
    total_price: { type: Number, required: true, min: 0 },
    booking_datetime: { type: Date, default: Date.now }, // Already exists
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    // --- Added fields for Approval/Rejection Timestamps ---
    approvedAt: { type: Date },
    rejectedAt: { type: Date }
});
const TransportationBooking = mongoose.model("TransportationBooking", transportationBookingSchema);

// --- Sport Adventure Schema (Added Timestamps) ---
const sportAdventureSchema = new mongoose.Schema({
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true }, // Re-added
    id: { type: String, required: true, unique: true }, // Added required and unique constraint
    type: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    rating: { type: String },
    image: { type: String }, // Image field to store the file path/name
    termsAndConditions: { type: [String], default: [] },
    minimumAge: { type: Number, required: true, min: 0 }
}, { timestamps: true });

const SportAdventure = mongoose.model("SportAdventure", sportAdventureSchema);

// --- Sport Adventure Booking Schema (Updated with Timestamps) ---
const sportAdventureBookingSchema = new mongoose.Schema({
    sportAdventureId: { type: mongoose.Types.ObjectId, ref: "SportAdventure", required: true },
    sportAdventureName: { type: String, required: true }, // Added field for sport adventure name
    user_name: { type: String, required: true },
    user_mobile: { type: String, required: true },
    user_email: { type: String, required: true }, // Added user_email field
    date_of_activity: { type: Date, required: true },
    total_participants: { type: Number, required: true, min: 1 },
    total_price: { type: Number, required: true, min: 0 },
    participantsDetails: [
        {
            name: { type: String, required: true },
            age: { type: Number, required: true, min: 1 }
        }
    ],
    booking_datetime: { type: Date, default: Date.now }, // Already exists
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    // --- Added fields for Approval/Rejection Timestamps ---
    approvedAt: { type: Date },
    rejectedAt: { type: Date }
});
const SportAdventureBooking = mongoose.model("SportAdventureBooking", sportAdventureBookingSchema);

// --- Business Inquiry Schema (Added Timestamps) ---
const businessInquirySchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    contactName: { type: String, required: true },
    contactMobile: { type: String, required: true },
    contactEmail: { type: String },
    eventType: { type: String },
    eventDate: { type: Date },
    numAttendees: { type: Number, min: 1 },
    servicesNeeded: { type: [String], default: [] },
    details: { type: String },
    location: { type: String },
    inquiryDate: { type: Date, default: Date.now }
}, { timestamps: true }); // Added timestamps option

const BusinessInquiry = mongoose.model("BusinessInquiry", businessInquirySchema);



// --- GENERAL BOOKING ENDPOINTS (Likely for User Side) ---
// Keeping these as they might be used by other parts of the application
// 🔹 Route for Accommodation Bookings - UPDATED for RoomId
// app.post("/api/accommodation-bookings", async (req, res) => {
//     console.log("Backend received POST request for accommodation booking:", req.body);
//     try {
//         const bookingData = req.body;
//         if (!bookingData || !bookingData.user_email || !bookingData.accommodationName || !bookingData.roomId || !bookingData.roomNumber || !bookingData.roomType || !bookingData.pricePerNight) {
//             console.error("Accommodation booking received empty request body or missing required fields (email, accommodationName, roomId, roomNumber, roomType, pricePerNight).");
//             return res.status(400).json({ error: "Request body is missing or required fields (user email, accommodation name, room ID, room number, room type, price per night) are missing." });
//         }
//         if (!mongoose.Types.ObjectId.isValid(bookingData.accommodationId)) {
//             console.error("Accommodation booking received invalid accommodationId in body:", bookingData.accommodationId);
//             return res.status(400).json({ error: "Invalid Accommodation ID provided for booking." });
//         }
//         if (!mongoose.Types.ObjectId.isValid(bookingData.roomId)) {
//             console.error("Accommodation booking received invalid roomId in body:", bookingData.roomId);
//             return res.status(400).json({ error: "Invalid Room ID provided for booking." });
//         }

//         const newBooking = new Booking(bookingData);
//         await newBooking.save();
//         console.log("Accommodation booking saved successfully.");
//         res.status(201).json({ message: "Booking successful!" });
//     } catch (error) {
//         console.error("Accommodation booking error:", error);
//         console.error("Accommodation booking error details:", error.message, error.stack);
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         res.status(500).json({ error: "Failed to book accommodation", details: error.message });
//     }
// });


// // 🔹 Route for Transportation Bookings
// app.post("/api/transportation-bookings", async (req, res) => {
//     console.log("Backend received POST request for transportation booking:", req.body);
//     try {
//         const bookingData = req.body;
//         if (!bookingData || !bookingData.user_email || !bookingData.transportationName) {
//             console.error("Transportation booking received empty request body or missing required fields (email, transportationName).");
//             return res.status(400).json({ error: "Request body is missing or required fields (user email, transportation name) are missing." });
//         }
//         if (!mongoose.Types.ObjectId.isValid(bookingData.transportationId)) {
//             console.error("Transportation booking received invalid transportationId in body:", bookingData.transportationId);
//             return res.status(400).json({ error: "Invalid Transportation ID provided for booking." });
//         }

//         const newBooking = new TransportationBooking(bookingData);
//         await newBooking.save();
//         console.log("Transportation booking saved successfully.");
//         res.status(201).json({ message: "Booking successful!" });
//     } catch (error) {
//         console.error("Transportation booking error:", error);
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         res.status(500).json({ error: "Failed to book transportation", details: error.message });
//     }
// });


// // 🔹 Route for Sport Adventure Bookings
// app.post("/api/sport-adventure-bookings", async (req, res) => {
//     console.log("Backend received POST request for sport adventure booking:", req.body);
//     try {
//         const bookingData = req.body;
//         if (!bookingData || !bookingData.user_email || !bookingData.sportAdventureName) {
//             console.error("Sport adventure booking received empty request body or missing required fields (email, sportAdventureName).");
//             return res.status(400).json({ error: "Request body is missing or required fields (user email, sport adventure name) are missing." });
//         }
//         if (!mongoose.Types.ObjectId.isValid(bookingData.sportAdventureId)) {
//             console.error("Sport adventure booking received invalid sportAdventureId in body:", bookingData.sportAdventureId);
//             return res.status(400).json({ error: "Invalid Sport Adventure ID provided for booking." });
//         }
//         if (!bookingData.participantsDetails || !Array.isArray(bookingData.participantsDetails) || bookingData.participantsDetails.length === 0) {
//             return res.status(400).json({ error: "Participants details are required and must be an array." });
//         }


//         const newBooking = new SportAdventureBooking(bookingData);
//         await newBooking.save();
//         console.log("Sport adventure booking saved successfully.");
//         res.status(201).json({ message: "Booking successful!" });
//     } catch (error) {
//         console.error("Sport adventure booking error:", error);
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         res.status(500).json({ error: "Failed to book sport adventure", details: error.message });
//     }
// });


// // 🔹 Business Inquiry Submission
// app.post("/api/business-inquiries", async (req, res) => {
//     console.log("Backend received POST request for business inquiry:", req.body);
//     try {
//         const inquiryData = req.body;
//         if (!inquiryData || !inquiryData.companyName || !inquiryData.contactName || !inquiryData.contactMobile || !inquiryData.location) {
//             return res.status(400).json({ error: "Required inquiry fields are missing (Company Name, Contact Name, Mobile, Location)." });
//         }

//         if (inquiryData.servicesNeeded && !Array.isArray(inquiryData.servicesNeeded)) {
//             return res.status(400).json({ error: "Services Needed must be an array." });
//         }

//         if (inquiryData.eventDate) {
//             const date = new Date(inquiryData.eventDate);
//             if (isNaN(date.getTime())) {
//                 return res.status(400).json({ error: "Invalid eventDate format." });
//             }
//         }

//         const newInquiry = new BusinessInquiry(inquiryData);
//         await newInquiry.save();
//         console.log("Business inquiry saved successfully.");
//         res.status(201).json({ message: "Business inquiry submitted successfully!" });

//     }
//     // Changed `error` variable in catch block to avoid conflict with `error` defined globally
//     catch (err) {
//         console.error("Business inquiry submission error:", err);
//         if (err.name === 'ValidationError') {
//             const messages = Object.values(err.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         res.status(500).json({ error: "Failed to submit business inquiry", details: err.message });
//     }
// });


// 🔹 Route to GET all Accommodations - UPDATED (Populate rooms)
// app.get("/api/accommodations", async (req, res) => {
//     try {
//         const accommodations = await Accommodation.find().populate('rooms');
//         res.status(200).json(accommodations);
//     } catch (error) {
//         console.error("Error fetching accommodations:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });


// // 🔹 Route to GET all Transportation items
// app.get("/api/transportations", async (req, res) => {
//     console.log("Backend received GET request for all flat transportation items");
//     try {
//         const transportations = await Transportation.find();
//         console.log(`Found ${transportations.length} flat transportation items.`);
//         res.json(transportations);
//     } catch (error) {
//         console.error("Error fetching flat transportation items:", error);
//         res.status(500).json({ error: "Internal Server Error", details: error.message });
//     }
// });


// // 🔹 Route to GET all Sport Adventures
// app.get("/api/sports-adventures", async (req, res) => {
//     console.log("Backend received GET request for /api/sports-adventures");
//     try {
//         const adventures = await SportAdventure.find();
//         console.log(`Found ${adventures.length} sport adventures.`);
//         res.json(adventures);
//     } catch (error) {
//         console.error("Error fetching sport adventures:", error);
//         res.status(500).json({ error: "Internal Server Error", details: error.message });
//     }
// });



// ======================= ADMIN ROUTES =======================
// --- NEW ADMIN SUMMARY ENDPOINTS (COUNTS) ---
// Get counts for all data categories
// app.get('/api/admin/summary-counts', async (req, res) => {
//     console.log("Backend received GET request for admin summary counts");
//     try {
//         const providerCounts = await ServiceProvider.aggregate([
//             {
//                 $group: {
//                     _id: "$status",
//                     count: { $sum: 1 }
//                 }
//             }
//         ]);

//         const totalProviders = await ServiceProvider.countDocuments();
//         const totalAccommodations = await Accommodation.countDocuments();
//         const totalTransportations = await Transportation.countDocuments();
//         const totalSportAdventures = await SportAdventure.countDocuments();
//         const totalBusinessInquiries = await BusinessInquiry.countDocuments();
//         const totalBookings = await Booking.countDocuments();
//         const totalTransportationBookings = await TransportationBooking.countDocuments();
//         const totalSportAdventureBookings = await SportAdventureBooking.countDocuments();


//         // Format provider counts
//         const formattedProviderCounts = {
//             Total: totalProviders,
//             Pending: 0,
//             Approved: 0,
//             Rejected: 0
//         };
//         providerCounts.forEach(item => {
//             if (item._id) { // Ensure _id is not null/undefined
//                 formattedProviderCounts[item._id] = item.count;
//             }
//         });


//         res.status(200).json({
//             providers: formattedProviderCounts,
//             accommodations: { Total: totalAccommodations },
//             transportations: { Total: totalTransportations },
//             sportAdventures: { Total: totalSportAdventures },
//             businessInquiries: { Total: totalBusinessInquiries },
//             bookings: { Total: totalBookings },
//             transportationBookings: { Total: totalTransportationBookings },
//             sportAdventureBookings: { Total: totalSportAdventureBookings }
//         });

//     } catch (err) {
//         console.error('Error fetching admin summary counts:', err);
//         res.status(500).json({ error: 'Failed to fetch summary data.', details: err.message });
//     }
// });
// // --- END NEW ADMIN SUMMARY ENDPOINTS ---

// // --- NEW ENDPOINT: Get Pending Service Provider Applications (For Admin) ---
// app.get('/api/admin/pending-providers', async (req, res) => {
//     console.log("Backend received GET request for pending service provider applications (Admin)");
//     try {
//         // Find all service providers with status 'Pending'
//         const pendingProviders = await ServiceProvider.find({ status: 'Pending' }).select('-password'); // Exclude passwords

//         console.log(`Found ${pendingProviders.length} pending service provider applications.`);
//         res.json(pendingProviders);

//     } catch (err) {
//         console.error('Error fetching pending service provider applications:', err);
//         res.status(500).json({ error: 'Failed to fetch pending applications.', details: err.message });
//     }
// });
// // --- END NEW ENDPOINT ---


// // --- NEW ENDPOINT: Approve Service Provider Application (For Admin) - UPDATED with timestamp ---
// app.post('/api/admin/providers/:providerId/approve', async (req, res) => {
//     console.log(`Backend received POST request to approve provider application for ID: ${req.params.providerId}`);
//     const providerId = req.params.providerId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     try {
//         // Find the provider application
//         const provider = await ServiceProvider.findById(providerId);

//         if (!provider) {
//             console.log(`Provider application not found for ID: ${providerId} during approval.`);
//             return res.status(404).json({ message: 'Provider application not found.' });
//         }

//         // --- NEW LOG: Check provider status before validation ---
//         console.log(`Provider status for ID ${providerId} before approval check: ${provider.status}`);

//         // Check if already approved or rejected
//         if (provider.status !== 'Pending') {
//             return res.status(400).json({ message: `Application is already ${provider.status}.` });
//         }

//         // --- Generate a random password (8 characters) ---
//         // WARNING: In a production environment, you should HASH this password before saving it.
//         const generateRandomPassword = () => crypto.randomBytes(4).toString('hex'); // Generates an 8-character hex string
//         const generatedPassword = generateRandomPassword();

//         // --- Update status and set password ---
//         provider.status = 'Approved';
//         provider.password = generatedPassword; // Store the generated password (HASH THIS!)
//         provider.approvedAt = new Date(); // Set approval timestamp
//         provider.rejectedAt = undefined; // Clear rejection timestamp if it was set

//         await provider.save();
//         console.log(`Provider application approved and password set for ID: ${providerId}`);

//         // --- Send Email with Login Details to the Service Provider ---
//         const mailOptions = {
//             from: 'maleksehban4@gmail.com', // Replace with your actual email
//             to: provider.email, // Send email to the approved provider
//             subject: 'Your Service Provider Application Has Been Approved!',
//             text: `
// Dear ${provider.ownerFullName},

// Good news! Your application to become a service provider on our platform has been approved.

// You can now log in to your provider dashboard using the following details:
// Username (Email): ${provider.email}
// Your Password: ${generatedPassword}

// [Link to Provider Login Page - You'll need to create this]

// Please keep your password secure. You can change it after logging in.

// Welcome aboard!

// Best regards,
// The Travel Booking Platform Team
// `,
//             html: `
// <p>Dear ${provider.ownerFullName},</p>
// <p>Good news! Your application to become a service provider on our platform has been approved.</p>
// <p>You can now log in to your provider dashboard using the following details:</p>
// <p><strong>Username (Email):</strong> ${provider.email}</p>
// <p><strong>Your Password:</strong> ${generatedPassword}</p>
// <p><a href="http://localhost:3000/service-provider-login">Click here to log in to your dashboard</a></p>
// <p>Please keep your password secure. You can change it after logging in.</p>
// <p>Welcome aboard!</p>
// <p>Best regards,<br>The Travel Booking Platform Team</p>
// `
//         };

//         // Send the email
//         await transporter.sendMail(mailOptions); // This is the line that might cause ETIMEDOUT
//         console.log(`Approval email with password sent to service provider: ${provider.email}`);


//         res.json({ message: 'Provider application approved, password set, and email sent.' });

//     } catch (err) {
//         console.error('Error approving provider application:', err);
//         if (err.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Provider ID format." });
//         }
//         // This catch block will be hit if Nodemailer fails (ETIMEDOUT)
//         res.status(500).json({ error: 'Failed to approve application.', details: err.message });
//     }
// });

// // --- END NEW ENDPOINT ---

// // --- NEW ENDPOINT: Reject Service Provider Application (For Admin) - UPDATED with timestamp ---
// app.post('/api/admin/providers/:providerId/reject', async (req, res) => {
//     console.log(`Backend received POST request to reject provider application for ID: ${req.params.providerId}`);
//     const providerId = req.params.providerId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     try {
//         // Find the provider application
//         const provider = await ServiceProvider.findById(providerId);

//         if (!provider) {
//             console.log(`Provider application not found for ID: ${providerId} during rejection.`);
//             return res.status(404).json({ message: 'Provider application not found.' });
//         }

//         // Check if already approved or rejected
//         if (provider.status !== 'Pending') {
//             return res.status(400).json({ message: `Application is already ${provider.status}.` });
//         }

//         // --- Update status to 'Rejected' ---
//         provider.status = 'Rejected';
//         // Clear password field if it was somehow set prematurely (shouldn't happen with new flow)
//         provider.password = undefined;
//         provider.rejectedAt = new Date(); // Set rejection timestamp
//         provider.approvedAt = undefined; // Clear approval timestamp

//         await provider.save();
//         console.log(`Provider application rejected for ID: ${providerId}`);

//         // --- Optional: Send Email Notification to the Service Provider about rejection ---
//         const mailOptions = {
//             from: 'maleksehban4@gmail.com', // Replace with your email
//             to: provider.email, // Send email to the rejected provider
//             subject: 'Your Service Provider Application Status',
//             text: `
// Dear ${provider.name},

// We regret to inform you that your application to become a service provider on our platform has been rejected.

// If you have any questions or would like to appeal this decision, please contact us.

// Thank you for your interest.

// Best regards,
// The [Your Website Name] Team
// `,
//         };

//         // Send the email
//         await transporter.sendMail(mailOptions);
//         console.log(`Rejection email sent to service provider: ${provider.email}`);


//         res.json({ message: 'Provider application rejected.' });

//     } catch (err) {
//         console.error('Error rejecting provider application:', err);
//         if (err.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Provider ID format." });
//         }
//         res.status(500).json({ error: 'Failed to reject application.', details: err.message });
//     }
// });
// --- END NEW ENDPOINT ---

// --- NEW ENDPOINT: Get All Service Providers with Populated Services (For Admin) ---
// This endpoint is fine as is, it now includes the 'status' field implicitly.
// We might want a separate endpoint for *only* pending providers for the new admin view.
// app.get('/api/admin/service-providers', async (req, res) => {
//     console.log("Backend received GET request for all service providers with services (Admin)");
//     try {
//         // Find all service providers
//         const serviceProviders = await ServiceProvider.find({}).select('-password'); // Exclude passwords

//         // Manually populate services for each provider based on their serviceType
//         const providersWithServices = await Promise.all(serviceProviders.map(async (provider) => {
//             let services = [];
//             if (provider.serviceType === 'Accommodation') {
//                 services = await Accommodation.find({ providerId: provider._id }).populate('rooms'); // Populate rooms here too
//             } else if (provider.serviceType === 'Transportation') {
//                 services = await Transportation.find({ providerId: provider._id });
//             } else if (provider.serviceType === 'Sport Adventure') {
//                 services = await SportAdventure.find({ providerId: provider._id });
//             }
//             // Return provider object with services added as a new property
//             return {
//                 ...provider.toObject(), // Convert Mongoose document to plain object
//                 services: services
//             };
//         }));


//         console.log(`Found ${providersWithServices.length} service providers.`);
//         res.json(providersWithServices);

//     } catch (err) {
//         console.error('Error fetching all service providers with services:', err);
//         res.status(500).json({ error: 'Failed to fetch service providers.', details: err.message });
//     }
// });
// // --- END NEW ENDPOINT ---


// // --- NEW ENDPOINT: Send OTP for Super Admin Password Change ---
// app.post('/api/admin/:adminId/send-otp-password-change', async (req, res) => {
//     console.log(`Backend received POST request to send OTP for password change for admin ID: ${req.params.adminId}`);
//     const adminId = req.params.adminId;
//     const { currentPassword } = req.body; // Only need current password to verify identity

//     // Basic input validation
//     if (!currentPassword) {
//         return res.status(400).json({ error: 'Current password is required.' });
//     }

//     if (!mongoose.Types.ObjectId.isValid(adminId)) {
//         return res.status(400).json({ error: "Invalid Admin ID format." });
//     }

//     try {
//         // Find the admin
//         const admin = await SuperAdmin.findById(adminId);
//         if (!admin) {
//             console.log(`Admin not found for ID: ${adminId} when sending OTP.`);
//             return res.status(404).json({ message: 'Admin not found.' });
//         }

//         // Compare the provided password with the stored plain text password (as requested)
//         // WARNING: This is insecure. Use hashed passwords in production.
//         // This is done as per your explicit instruction to NOT use bcrypt.
//         // For production, ALWAYS use bcrypt or a similar hashing library.
//         if (currentPassword !== admin.password) {
//             console.log(`Send OTP failed: Incorrect current password for admin ID: ${adminId}`);
//             return res.status(401).json({ error: 'Incorrect current password.' });
//         }

//         // --- Generate and Store OTP ---
//         const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
//         const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

//         admin.otp = otp;
//         admin.otpExpires = otpExpiry;
//         await admin.save();
//         console.log(`OTP generated and stored for admin ID: ${adminId}`);

//         // --- Send OTP via Email ---
//         const mailOptions = {
//             from: 'maleksehban4@gmail.com', // Replace with your actual email
//             to: admin.email, // Send OTP to the admin's registered email
//             subject: 'Your OTP for Password Change',
//             text: `
// Dear Admin,

// You requested to change your password. Your One-Time Password (OTP) is:

// ${otp}

// This OTP is valid for the next 10 minutes. Please use it to complete your password change.

// If you did not request a password change, please ignore this email.

// Best regards,
// The [Your Website Name] Team
// `,
//         };

//         // Send the email
//         await transporter.sendMail(mailOptions);
//         console.log(`OTP email sent to ${admin.email} for admin ID: ${adminId}`);

//         res.status(200).json({ message: 'OTP sent to your email. Please check your inbox.' });

//     } catch (err) {
//         console.error('Error sending OTP for password change:', err);
//         res.status(500).json({ error: 'Failed to send OTP. Please try again later.', details: err.message });
//     }
// });


// // --- NEW ENDPOINT: Verify OTP and Change Super Admin Password ---
// app.put('/api/admin/:adminId/verify-otp-and-change-password', async (req, res) => {
//     console.log(`Backend received PUT request to verify OTP and change password for admin ID: ${req.params.adminId}`);
//     const adminId = req.params.adminId; // Correctly access adminId from params
//     const { otp, newPassword } = req.body; // Expect OTP and new password

//     if (!otp || !newPassword) {
//         return res.status(400).json({ error: 'OTP and new password are required.' });
//     }

//     // Validate new password length (as requested)
//     if (newPassword.length < 8) {
//         return res.status(400).json({ error: 'New password length must be at least 8 characters.' });
//     }


//     if (!mongoose.Types.ObjectId.isValid(adminId)) {
//         return res.status(400).json({ error: "Invalid Admin ID format." });
//     }

//     try {
//         // Find the admin
//         const admin = await SuperAdmin.findById(adminId);
//         if (!admin) {
//             console.log(`Admin not found for ID: ${adminId} during OTP verification.`);
//             return res.status(404).json({ message: 'Admin not found.' });
//         }

//         // --- Verify OTP and Expiry ---
//         if (!admin.otp || admin.otp !== otp) {
//             console.log(`OTP verification failed: Invalid OTP for admin ID: ${adminId}`);
//             // Clear OTP fields on incorrect attempt for security
//             admin.otp = undefined;
//             admin.otpExpires = undefined;
//             await admin.save();
//             return res.status(400).json({ error: 'Invalid OTP.' });
//         }

//         if (admin.otpExpires < new Date()) {
//             console.log(`OTP verification failed: OTP expired for admin ID: ${adminId}`);
//             // Clear OTP fields on expiry
//             admin.otp = undefined;
//             admin.otpExpires = undefined;
//             await admin.save();
//             return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
//         }

//         // If OTP is valid and not expired, update the password
//         // WARNING: Still storing plain text password. HASH THIS IN PRODUCTION!
//         admin.password = newPassword;
//         // Clear OTP fields after successful password change
//         admin.otp = undefined;
//         admin.otpExpires = undefined;

//         await admin.save();
//         console.log(`Password changed successfully for admin ID: ${adminId}`);

//         res.json({ message: 'Password changed successfully.' });

//     } catch (err) {
//         console.error('Error verifying OTP and changing password:', err);
//         res.status(500).json({ error: 'Failed to change password.', details: err.message });
//     }
// });
// // --- NEW: Admin Get Single Service Provider Application Details ---
// app.get('/api/admin/service-provider-applications/:id', async (req, res) => {
//     try {
//         const { id } = req.params;
//         const application = await ServiceProvider.findById(id).select('-password'); // Exclude password
//         if (!application) {
//             return res.status(404).json({ error: 'Application not found.' });
//         }
//         res.json(application);
//     } catch (err) {
//         console.error('Error fetching single service provider application:', err);
//         if (err.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid application ID format." });
//         }
//         res.status(500).json({ error: 'Failed to fetch application details.', details: err.message });
//     }
// });
// // --- Super Admin Login Route ---
// app.post('/api/admin/login', async (req, res) => {
//     console.log("Backend received POST request for Super Admin login");
//     const { email, password } = req.body;

//     // Basic validation
//     if (!email || !password) {
//         return res.status(400).json({ error: 'Email and password are required' });
//     }

//     try {
//         // 1. Find the super admin by email
//         const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() }); // Use lowercase for lookup

//         // If super admin not found
//         if (!superAdmin) {
//             // Use a generic error message for security (don't reveal if email exists)
//             console.log(`Super Admin login failed: User not found for email: ${email}`);
//             return res.status(401).json({ error: 'Invalid credentials' });
//         }

//         // 2. Compare the provided password with the stored plain text password (as requested)
//         // WARNING: Storing and comparing plain text passwords is NOT secure.
//         // This is done as per your explicit instruction to NOT use bcrypt.
//         // For production, ALWAYS use bcrypt or a similar hashing library.
//         if (password !== superAdmin.password) {
//             // Use a generic error message for security
//             console.log(`Super Admin login failed: Incorrect password for email: ${email}`);
//             return res.status(401).json({ error: 'Invalid credentials' });
//         }

//         // 3. If credentials are valid
//         console.log(`Super Admin login successful for email: ${email}`);
//         // Successful login - You might want to implement session management or JWT here
//         // For this example, we'll just send a success status.
//         // In a real application, you'd generate a token and send it back.

//         // Example: Generate a JWT (requires a library like jsonwebtoken)
//         // const jwt = require('jsonwebtoken');
//         // const token = jwt.sign({ id: superAdmin._id, role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
//         // res.status(200).json({ message: 'Login successful', token: token });

//         // Simple success response for now
//         res.status(200).json({ message: 'Login successful', adminId: superAdmin._id }); // Optionally send admin ID

//     } catch (err) {
//         console.error('Server error during admin login:', err);
//         res.status(500).json({ error: 'Server error during login' });
//     }
// });


// // 🔹 Get All Business Inquiries (Likely for Admin)
// app.get("/api/business-inquiries", async (req, res) => {
//     console.log("Backend received GET request for all business inquiries");
//     try {
//         const inquiries = await BusinessInquiry.find();
//         console.log(`Found ${inquiries.length} business inquiries.`);
//         res.json(inquiries);
//     } catch (error) {
//         console.error("Error fetching business inquiries:", error);
//         res.status(500).json({ error: "Internal Server Error", details: error.message });
//     }
// });

// ======================= SERVICE PROVIDER ====================================================================

// --- Service Provider Login Endpoint - MODIFIED (Check status) ---
// app.post('/api/provider/login', async (req, res) => {
//     console.log("Backend received POST request for Service Provider login");
//     const { email, password } = req.body;
//     if (!email || !password) { return res.status(400).json({ error: 'Email and password are required.' }); }
//     try {
//         const serviceProvider = await ServiceProvider.findOne({ email });
//         if (!serviceProvider) {
//             console.log(`Login failed: Provider not found for email: ${email}`);
//             return res.status(401).json({ error: 'Invalid email or password.' });
//         }
//         if (serviceProvider.status !== 'Approved') {
//             console.log(`Login failed: Provider not approved for email: ${email}. Status: ${serviceProvider.status}`);
//             let message = 'Your application is pending review.';
//             if (serviceProvider.status === 'Rejected') { message = 'Your application has been rejected.'; }
//             return res.status(403).json({ error: message });
//         }
//         if (password !== serviceProvider.password) {
//             console.log(`Login failed: Incorrect password for email: ${email}`);
//             return res.status(401).json({ error: 'Invalid email or password.' });
//         }
//         console.log(`Service Provider login successful for email: ${email}`);

//         // --- IMPORTANT CHANGE HERE: Ensure _id and serviceType are explicitly included ---
//         res.status(200).json({
//             message: 'Login successful!',
//             providerId: serviceProvider._id, // Send the _id as providerId
//             serviceType: serviceProvider.serviceType, // Send the serviceType
//             // You can include other provider details here if needed by the frontend,
//             // but these two are essential for dashboard navigation.
//             provider: { // Keep this object for general provider data, but ensure essential fields are top-level
//                 id: serviceProvider._id,
//                 email: serviceProvider.email,
//                 name: serviceProvider.ownerFullName, // Using ownerFullName as the display name
//                 mobile: serviceProvider.phoneNumber, // Using phoneNumber as mobile
//                 serviceType: serviceProvider.serviceType,
//                 status: serviceProvider.status
//             }
//         });
//     } catch (error) {
//         console.error('Error during Service Provider login:', error);
//         res.status(500).json({ error: 'An error occurred during login. Please try again.', details: error.message });
//     }
// });

// // --- Endpoint for Service Provider Applications (Signup) - MODIFIED ---
// app.post('/api/become-provider', upload, async (req, res) => {
//     try {
//         console.log("Backend received POST request for 'Become a Provider' application");
//         console.log("Request body (from multer):", req.body);
//         console.log("Request files (from multer):", req.files);

//         const {
//             businessName,
//             ownerFullName,
//             email,
//             phoneNumber,
//             fullBusinessAddress,
//             businessRegistrationNumber,
//             whatsappNumber,
//             state,
//             city,
//             pinCode,
//             websiteSocialMediaLink,
//             preferredModeOfContact,
//             serviceType
//         } = req.body;

//         // --- START DUPLICATE CHECK ---
//         // Check if email already exists
//         const existingEmailProvider = await ServiceProvider.findOne({ email });
//         if (existingEmailProvider) {
//             console.log(`Application failed: Email already registered: ${email}`);
//             // Clean up uploaded files if an error occurs early
//             if (req.files) {
//                 Object.values(req.files).forEach(fileArray => {
//                     fileArray.forEach(file => fs.unlinkSync(file.path));
//                 });
//             }
//             return res.status(409).json({ message: 'Email already registered. Please use a different email or log in.' });
//         }

//         // Check if business name already exists (case-insensitive for robustness)
//         const existingBusinessNameProvider = await ServiceProvider.findOne({
//             businessName: { $regex: new RegExp(`^${businessName}$`, 'i') }
//         });
//         if (existingBusinessNameProvider) {
//             console.log(`Application failed: Business Name already registered: ${businessName}`);
//             if (req.files) {
//                 Object.values(req.files).forEach(fileArray => {
//                     fileArray.forEach(file => fs.unlinkSync(file.path));
//                 });
//             }
//             return res.status(409).json({ message: 'Business Name already registered. Please use a different name.' });
//         }

//         // Check if phone number already exists
//         const existingPhoneNumberProvider = await ServiceProvider.findOne({ phoneNumber });
//         if (existingPhoneNumberProvider) {
//             console.log(`Application failed: Phone Number already registered: ${phoneNumber}`);
//             if (req.files) {
//                 Object.values(req.files).forEach(fileArray => {
//                     fileArray.forEach(file => fs.unlinkSync(file.path));
//                 });
//             }
//             return res.status(409).json({ message: 'Phone Number already registered. Please use a different number.' });
//         }
//         // --- END DUPLICATE CHECK ---

//         // Extract uploaded file names safely (this part remains the same)
//         const aadharPanCard = req.files?.aadharPanCard?.[0]?.filename || null;
//         const businessRegistrationCertificate = req.files?.businessRegistrationCertificate?.[0]?.filename || null;
//         const bankAccountDetails = req.files?.bankAccountDetails?.[0]?.filename || null;
//         const gstNumber = req.files?.gstNumber?.[0]?.filename || null;
//         const servicePhotos = req.files?.servicePhotos?.map(file => file.filename) || [];

//         // Basic validation for required fields (this part remains the same)
//         if (!email || !businessName || !ownerFullName || !phoneNumber || !fullBusinessAddress || !serviceType || !state || !city || !pinCode || !preferredModeOfContact || servicePhotos.length === 0) {
//             // If validation fails after duplicate checks, still clean up files
//             if (req.files) {
//                 Object.values(req.files).forEach(fileArray => {
//                     fileArray.forEach(file => fs.unlinkSync(file.path));
//                 });
//             }
//             return res.status(400).json({ message: 'Missing required fields or documents. Please ensure all mandatory fields are filled and documents are uploaded.' });
//         }

//         const newApplication = new ServiceProvider({
//             businessName,
//             ownerFullName,
//             email,
//             phoneNumber,
//             fullBusinessAddress,
//             businessRegistrationNumber,
//             whatsappNumber,
//             state,
//             city,
//             pinCode,
//             websiteSocialMediaLink,
//             preferredModeOfContact,
//             serviceType,
//             aadharPanCard,
//             businessRegistrationCertificate,
//             bankAccountDetails,
//             gstNumber,
//             servicePhotos
//         });

//         await newApplication.save();
//         res.status(201).json({ message: 'Application submitted successfully. We will review your application and get back to you soon!', providerId: newApplication._id });

//     } catch (error) {
//         console.error("Error during provider application submission:", error);
//         // Ensure files are cleaned up if an error occurs during save or later
//         if (req.files) {
//             Object.values(req.files).forEach(fileArray => {
//                 fileArray.forEach(file => fs.unlinkSync(file.path));
//             });
//         }
//         // Enhanced Mongoose validation error handling
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed:", details: messages.join(', ') });
//         }
//         res.status(500).json({ message: 'Server error', error: error.message });
//     }
// });


// // 🔹 Route for a Provider to Add New Transportation - Add status check
// app.post("/api/provider/:providerId/transportations", uploadSingle.single('image'), async (req, res) => {
//     console.log(`Backend received POST request for adding transportation for provider ${req.params.providerId}`);
//     const providerId = req.params.providerId;
//     const transportationData = req.body;
//     const imageFile = req.file;
//     let generatedId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         if (imageFile) fs.unlinkSync(imageFile.path);
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     if (!transportationData.driver_name || !transportationData.transport_type || !transportationData.model ||
//         !transportationData.price_per_day || !imageFile) {
//         if (imageFile) fs.unlinkSync(imageFile.path);
//         return res.status(400).json({ error: 'Missing required fields or image file.' });
//     }

//     try {
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider) {
//             console.log(`Provider not found for ID: ${providerId} when adding transportation.`);
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(404).json({ message: 'Provider not found.' });
//         }
//         // --- NEW: Check provider status (Keep this check for providers adding their *own* services) ---
//         if (provider.status !== 'Approved') {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(403).json({ error: 'Provider account is not approved to add services.' });
//         }
//         // --- END NEW ---
//         if (provider.serviceType !== 'Transportation') {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(403).json({ error: 'Provider is not authorized to add Transportation services.' });
//         }

//         // --- Generate Unique Transportation ID --- (Existing logic)
//         const type = transportationData.transport_type;
//         const prefix = transportationTypePrefixes[type] || 'TX';
//         let counter = 0;
//         const maxRetries = 10;

//         while (counter < maxRetries) {
//             const lastTransportation = await Transportation.findOne({ id: new RegExp(`^${prefix}\\d+$`) })
//                 .sort({ id: -1 })
//                 .limit(1);

//             let nextNumber = 1;
//             if (lastTransportation) {
//                 const lastId = lastTransportation.id;
//                 const lastNumber = parseInt(lastId.replace(prefix, ''), 10);
//                 if (!isNaN(lastNumber)) {
//                     nextNumber = lastNumber + 1;
//                 }
//             }
//             generatedId = `${prefix}${String(nextNumber).padStart(2, '0')}`;
//             const existingTransportationWithId = await Transportation.findOne({ id: generatedId });
//             if (!existingTransportationWithId) {
//                 break;
//             }
//             console.warn(`Generated duplicate Transportation ID: ${generatedId}. Retrying...`);
//             counter++;
//             if (counter === maxRetries) {
//                 if (imageFile) fs.unlinkSync(imageFile.path);
//                 throw new Error('Failed to generate a unique Transportation ID after multiple retries.');
//             }
//         }
//         // --- End Generate Unique Transportation ID ---


//         const newTransportationData = {
//             ...transportationData,
//             providerId: providerId,
//             id: generatedId,
//             image: imageFile.filename
//         };

//         newTransportationData.price_per_day = parseFloat(newTransportationData.price_per_day);
//         if (newTransportationData.rating !== undefined) newTransportationData.rating = parseFloat(newTransportationData.rating);

//         if (newTransportationData.features && typeof newTransportationData.features === 'string') {
//             newTransportationData.features = newTransportationData.features.split(',').map(item => item.trim()).filter(item => item);
//         } else if (newTransportationData.features === '') {
//             newTransportationData.features = [];
//         } else if (!Array.isArray(newTransportationData.features)) {
//             newTransportationData.features = [];
//         }


//         const newTransportation = new Transportation(newTransportationData);
//         await newTransportation.save();
//         console.log("New transportation saved for provider:", providerId, newTransportation._id, "with ID:", generatedId);
//         res.status(201).json(newTransportation);

//     } catch (error) {
//         console.error("Error adding transportation for provider:", providerId, error);
//         if (imageFile) fs.unlinkSync(imageFile.path);
//         if (error.code === 11000) {
//             return res.status(409).json({ error: `Transportation with this generated ID already exists. Please try again.` });
//         }
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         res.status(500).json({ error: "Failed to add transportation", details: error.message });
//     }
// });


// // 🔹 Route for a Provider to Get Their Transportation - MODIFIED (Removed status check for Admin view)
// app.get("/api/provider/:providerId/transportations", async (req, res) => {
//     console.log(`Backend received GET request for provider ${req.params.providerId}'s transportations`);
//     const providerId = req.params.providerId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     try {
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider) {
//             console.log(`Provider not found for ID: ${providerId} when fetching transportations.`);
//             return res.status(404).json({ message: 'Provider not found.' });
//         }
//         // --- REMOVED: Provider status check here to allow Admin to fetch ---
//         // if (provider.status !== 'Approved') {
//         //      return res.status(403).json({ error: 'Provider account is not approved to view services.' });
//         // }
//         // --- END REMOVED ---
//         if (provider.serviceType !== 'Transportation') {
//             return res.status(403).json({ error: 'Provider is not authorized to view Transportation services.' });
//         }

//         const transportations = await Transportation.find({ providerId: providerId });
//         console.log(`Found ${transportations.length} transportations for provider ${providerId}.`);
//         res.status(200).json(transportations);

//     } catch (error) {
//         console.error("Error fetching transportations for provider:", providerId, error);
//         res.status(500).json({ error: "Failed to fetch transportations", details: error.message });
//     }
// });


// // 🔹 Route to UPDATE an Accommodation by ID - UPDATED FOR MULTI-ROOM
// app.put("/api/accommodations/:id", upload, async (req, res) => {
//     console.log(`Backend received PUT request for accommodation ID: ${req.params.id}`);
//     const accommodationId = req.params.id;
//     const { rooms, ...updateData } = req.body; // Destructure rooms from body
//     const mainImageFile = req.files && req.files['image'] ? req.files['image'][0] : null;

//     let parsedRooms = [];
//     if (rooms) {
//         try {
//             parsedRooms = JSON.parse(rooms);
//         } catch (parseError) {
//             console.error('Error parsing rooms JSON for update:', parseError);
//             if (mainImageFile) fs.unlinkSync(mainImageFile.path);
//             if (req.files && req.files['roomImages']) {
//                 req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
//             }
//             return res.status(400).json({ error: "Invalid rooms data format. Must be a valid JSON string." });
//         }
//     }

//     if (!mongoose.Types.ObjectId.isValid(accommodationId)) {
//         if (mainImageFile) fs.unlinkSync(mainImageFile.path);
//         if (req.files && req.files['roomImages']) {
//             req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
//         }
//         return res.status(400).json({ error: "Invalid Accommodation ID format provided." });
//     }

//     const providerId = updateData.providerId; // Provider ID for authorization
//     if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
//         if (mainImageFile) fs.unlinkSync(mainImageFile.path);
//         if (req.files && req.files['roomImages']) {
//             req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
//         }
//         return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
//     }

//     try {
//         const accommodation = await Accommodation.findOne({ _id: accommodationId, providerId: providerId }).populate('rooms');
//         if (!accommodation) {
//             if (mainImageFile) fs.unlinkSync(mainImageFile.path);
//             if (req.files && req.files['roomImages']) {
//                 req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
//             }
//             return res.status(404).json({ message: "Accommodation not found or does not belong to this provider." });
//         }

//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider || provider.status !== 'Approved') {
//             if (mainImageFile) fs.unlinkSync(mainImageFile.path);
//             if (req.files && req.files['roomImages']) {
//                 req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
//             }
//             return res.status(403).json({ error: 'Provider account is not approved to modify services.' });
//         }

//         // --- Handle Main Accommodation Image ---
//         if (mainImageFile) {
//             const oldImagePath = path.join(__dirname, 'src', 'images', accommodation.image);
//             if (accommodation.image && fs.existsSync(oldImagePath)) {
//                 fs.unlink(oldImagePath, (err) => {
//                     if (err) console.error(`Error deleting old main accommodation image file: ${oldImagePath}`, err);
//                     else console.log(`Deleted old main accommodation image file: ${oldImagePath}`);
//                 });
//             }
//             updateData.image = mainImageFile.filename;
//         } else if (updateData.image === '' && accommodation.image) { // Frontend explicitly cleared image
//             const oldImagePath = path.join(__dirname, 'src', 'images', accommodation.image);
//             if (fs.existsSync(oldImagePath)) {
//                 fs.unlink(oldImagePath, (err) => {
//                     if (err) console.error(`Error deleting old main accommodation image file (cleared): ${oldImagePath}`, err);
//                     else console.log(`Deleted old main accommodation image file (cleared): ${oldImagePath}`);
//                 });
//             }
//             updateData.image = '';
//         } else if (updateData.image === undefined) { // No new image, and not explicitly cleared
//             updateData.image = accommodation.image; // Keep existing image
//         }

//         delete updateData.providerId; // Prevent providerId from being updated
//         delete updateData.accommodationID; // Prevent accommodationID from being updated

//         // --- Handle Rooms Update ---
//         const existingRoomIds = accommodation.rooms.map(room => room._id.toString());
//         const updatedRoomIds = [];
//         const roomImageFiles = req.files['roomImages'] || [];

//         for (let i = 0; i < parsedRooms.length; i++) {
//             const roomData = parsedRooms[i];
//             const roomImageFile = roomImageFiles[i]; // Corresponding file for this room

//             if (roomData._id && existingRoomIds.includes(roomData._id)) {
//                 // Existing room: Update it
//                 const roomToUpdate = await Room.findById(roomData._id);
//                 if (roomToUpdate) {
//                     const roomUpdateFields = {
//                         roomNumber: roomData.roomNumber,
//                         roomType: roomData.roomType,
//                         pricePerNight: parseFloat(roomData.pricePerNight),
//                         numberOfBeds: parseInt(roomData.numberOfBeds, 10),
//                         roomFacilities: roomData.roomFacilities,
//                         roomAmenities: roomData.roomAmenities,
//                         description: roomData.description,
//                     };

//                     // Handle room-specific image update
//                     if (roomImageFile) {
//                         const oldRoomImagePath = path.join(__dirname, 'src', 'images', roomToUpdate.image);
//                         if (roomToUpdate.image && fs.existsSync(oldRoomImagePath)) {
//                             fs.unlink(oldRoomImagePath, (err) => {
//                                 if (err) console.error(`Error deleting old room image file: ${oldRoomImagePath}`, err);
//                                 else console.log(`Deleted old room image file: ${oldRoomImagePath}`);
//                             });
//                         }
//                         roomUpdateFields.image = roomImageFile.filename;
//                     } else if (roomData.existingRoomImageUrl === '' && roomToUpdate.image) { // Frontend explicitly cleared room image
//                         const oldRoomImagePath = path.join(__dirname, 'src', 'images', roomToUpdate.image);
//                         if (fs.existsSync(oldRoomImagePath)) {
//                             fs.unlink(oldRoomImagePath, (err) => {
//                                 if (err) console.error(`Error deleting old room image file (cleared): ${oldRoomImagePath}`, err);
//                                 else console.log(`Deleted old room image file (cleared): ${oldRoomImagePath}`);
//                             });
//                         }
//                         roomUpdateFields.image = '';
//                     } else if (!roomImageFile && roomData.existingRoomImageUrl) { // Keep existing if no new file and old URL provided
//                         roomUpdateFields.image = roomData.existingRoomImageUrl.split('/').pop();
//                     } else if (!roomImageFile && !roomData.existingRoomImageUrl) { // No new file, no existing, set to empty
//                         roomUpdateFields.image = '';
//                     }


//                     await Room.findByIdAndUpdate(roomData._id, roomUpdateFields, { new: true, runValidators: true });
//                     updatedRoomIds.push(roomData._id);
//                 } else {
//                     console.warn(`Room with ID ${roomData._id} not found during update, skipping.`);
//                 }
//             } else {
//                 // New room: Create it
//                 const newRoomData = {
//                     accommodationId: accommodationId, // Link to this accommodation
//                     roomNumber: roomData.roomNumber,
//                     roomType: roomData.roomType,
//                     pricePerNight: parseFloat(roomData.pricePerNight),
//                     numberOfBeds: parseInt(roomData.numberOfBeds, 10),
//                     roomFacilities: roomData.roomFacilities,
//                     roomAmenities: roomData.roomAmenities,
//                     description: roomData.description,
//                     image: roomImageFile ? roomImageFile.filename : (roomData.existingRoomImageUrl ? roomData.existingRoomImageUrl.split('/').pop() : '')
//                 };
//                 const newRoom = new Room(newRoomData);
//                 await newRoom.save();
//                 updatedRoomIds.push(newRoom._id);
//             }
//         }

//         // Delete rooms that were removed by the frontend
//         const roomsToDelete = existingRoomIds.filter(id => !updatedRoomIds.includes(id));
//         for (const roomId of roomsToDelete) {
//             const roomToDelete = await Room.findById(roomId);
//             if (roomToDelete && roomToDelete.image) {
//                 const oldRoomImagePath = path.join(__dirname, 'src', 'images', roomToDelete.image);
//                 if (fs.existsSync(oldRoomImagePath)) {
//                     fs.unlink(oldRoomImagePath, (err) => {
//                         if (err) console.error(`Error deleting old room image file on removal: ${oldRoomImagePath}`, err);
//                         else console.log(`Deleted old room image file on removal: ${oldRoomImagePath}`);
//                     });
//                 }
//             }
//             await Room.findByIdAndDelete(roomId);
//         }

//         // Update the main accommodation's rooms array
//         updateData.rooms = updatedRoomIds;

//         const updatedAccommodation = await Accommodation.findByIdAndUpdate(
//             accommodationId,
//             updateData,
//             { new: true, runValidators: true }
//         ).populate('rooms'); // Populate rooms to return complete data

//         if (!updatedAccommodation) {
//             return res.status(404).json({ message: "Accommodation not found" });
//         }

//         console.log("Accommodation updated:", updatedAccommodation._id);
//         res.json(updatedAccommodation);

//     } catch (error) {
//         console.error("Error updating accommodation:", error);
//         if (mainImageFile) fs.unlinkSync(mainImageFile.path);
//         if (req.files && req.files['roomImages']) {
//             req.files['roomImages'].forEach(file => fs.unlinkSync(file.path));
//         }

//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Accommodation ID format" });
//         }
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         res.status(500).json({ error: "Failed to update accommodation", details: error.message });
//     }
// });

// // 🔹 Route to DELETE an Accommodation by ID - UPDATED FOR MULTI-ROOM
// app.delete("/api/accommodations/:id", async (req, res) => {
//     console.log(`Backend received DELETE request for accommodation ID: ${req.params.id}`);
//     try {
//         const accommodationId = req.params.id;
//         const providerId = req.body.providerId; // Expect providerId in the body for authorization

//         if (!mongoose.Types.ObjectId.isValid(accommodationId)) {
//             return res.status(400).json({ error: "Invalid Accommodation ID format provided." });
//         }
//         if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
//             return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
//         }


//         const accommodation = await Accommodation.findOne({ _id: accommodationId, providerId: providerId }).populate('rooms');
//         if (!accommodation) {
//             return res.status(404).json({ message: "Accommodation not found or does not belong to this provider." });
//         }
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider || provider.status !== 'Approved') {
//             return res.status(403).json({ error: 'Provider account is not approved to delete services.' });
//         }

//         // Delete associated room images and room documents
//         for (const room of accommodation.rooms) {
//             if (room.image) {
//                 const roomImagePath = path.join(__dirname, 'src', 'images', room.image);
//                 if (fs.existsSync(roomImagePath)) {
//                     fs.unlink(roomImagePath, (err) => {
//                         if (err) console.error(`Error deleting room image file: ${roomImagePath}`, err);
//                         else console.log(`Deleted room image file: ${roomImagePath}`);
//                     });
//                 }
//             }
//             await Room.findByIdAndDelete(room._id);
//         }

//         // Delete the main accommodation image
//         if (accommodation.image) {
//             const imagePath = path.join(__dirname, 'src', 'images', accommodation.image);
//             if (fs.existsSync(imagePath)) {
//                 fs.unlink(imagePath, (err) => {
//                     if (err) console.error(`Error deleting main accommodation image file: ${imagePath}`, err);
//                     else console.log(`Deleted main accommodation image file: ${imagePath}`);
//                 });
//             }
//         }

//         await Accommodation.findByIdAndDelete(accommodationId);

//         console.log("Accommodation and its associated rooms deleted:", accommodationId);
//         res.json({ message: "Accommodation deleted successfully" });

//     } catch (error) {
//         console.error("Error deleting accommodation:", error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Accommodation ID format" });
//         }
//         res.status(500).json({ error: "Failed to delete accommodation", details: error.message });
//     }
// });

// // 🔹 Route to get bookings for a specific Accommodation ID (Likely for User Side or Admin) - UPDATED for RoomId
// app.get("/api/accommodations/:id/bookings", async (req, res) => {
//     console.log(`Backend received GET request for bookings for accommodation ID: ${req.params.id}`);
//     try {
//         const accommodationId = req.params.id;

//         if (!mongoose.Types.ObjectId.isValid(accommodationId)) {
//             console.error("Backend received invalid ObjectId format for accommodation bookings:", accommodationId);
//             return res.status(400).json({ error: "Invalid Accommodation ID format provided." });
//         }

//         // Populate both accommodationId and roomId
//         const bookings = await Booking.find({ accommodationId: accommodationId }).populate('roomId');
//         console.log(`Found ${bookings.length} bookings for accommodation ID: ${accommodationId}`);
//         res.json(bookings);

//     } catch (error) {
//         console.error("Error fetching bookings for accommodation:", error);
//         res.status(500).json({ error: "Internal Server Error", details: error.message });
//     }
// });

// // 🔹 Route to GET a single Accommodation by ID - UPDATED (Populate rooms)
// app.get("/api/accommodations/:id", async (req, res) => {
//     try {
//         const accommodation = await Accommodation.findById(req.params.id).populate('rooms');
//         if (!accommodation) return res.status(404).json({ message: "Accommodation not found" });
//         res.json(accommodation);
//     } catch (error) {
//         console.error("Error fetching accommodation:", error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Accommodation ID format" });
//         }
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// });
// // 🔹 Route to UPDATE a Transportation item by ID - Add status check
// app.put("/api/transportation/:id", uploadSingle.single('image'), async (req, res) => {
//     console.log(`Backend received PUT request for transportation ID: ${req.params.id}`);
//     const imageFile = req.file;
//     try {
//         const transportationId = req.params.id;
//         const updateData = req.body;
//         const providerId = updateData.providerId;


//         if (!mongoose.Types.ObjectId.isValid(transportationId)) {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(400).json({ error: "Invalid Transportation ID format provided." });
//         }
//         if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
//         }


//         const transportation = await Transportation.findOne({ _id: transportationId, providerId: providerId });
//         if (!transportation) {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(404).json({ message: "Transportation not found or does not belong to this provider." });
//         }
//         // --- NEW: Check provider status (Keep this check for providers updating their *own* services) ---
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider || provider.status !== 'Approved') {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(403).json({ error: 'Provider account is not approved to modify services.' });
//         }
//         // --- END NEW ---

//         if (imageFile) {
//             const oldImagePath = path.join(__dirname, 'src', 'images', transportation.image);
//             if (transportation.image && fs.existsSync(oldImagePath)) {
//                 fs.unlink(oldImagePath, (err) => {
//                     if (err) console.error(`Error deleting old image file: ${oldImagePath}`, err);
//                     else console.log(`Deleted old image file on transportation update: ${oldImagePath}`);
//                 });
//             }
//             updateData.image = imageFile.filename;
//         } else {
//             // If no new image is uploaded, check if the frontend explicitly sent empty/null for image
//             if (updateData.image === undefined) {
//                 // If image field is not in updateData, keep the old image
//                 updateData.image = transportation.image;
//             } else if (updateData.image === null || updateData.image === '') {
//                 // If frontend explicitly sent empty/null, delete the old image and set image to empty string
//                 const oldImagePath = path.join(__dirname, 'src', 'images', transportation.image);
//                 if (transportation.image && fs.existsSync(oldImagePath)) {
//                     fs.unlink(oldImagePath, (err) => {
//                         if (err) console.error(`Error deleting old image file: ${oldImagePath}`, err);
//                         else console.log(`Deleted old image file because frontend sent empty image: ${oldImagePath}`);
//                     });
//                 }
//                 updateData.image = '';
//             }
//         }


//         delete updateData.providerId; // Prevent providerId from being updated
//         delete updateData.id; // Prevent transportation ID from being updated

//         if (updateData.price_per_day !== undefined) updateData.price_per_day = parseFloat(updateData.price_per_day);
//         if (updateData.rating !== undefined) updateData.rating = parseFloat(updateData.rating);

//         if (updateData.features && typeof updateData.features === 'string') {
//             updateData.features = updateData.features.split(',').map(item => item.trim()).filter(item => item);
//         } else if (updateData.features === '') {
//             updateData.features = [];
//         } else if (!Array.isArray(updateData.features)) {
//             updateData.features = [];
//         }


//         const updatedTransportation = await Transportation.findByIdAndUpdate(
//             transportationId,
//             updateData,
//             { new: true, runValidators: true }
//         );

//         if (!updatedTransportation) {
//             return res.status(404).json({ message: "Transportation not found" });
//         }

//         console.log("Transportation updated:", updatedTransportation._id);
//         res.json(updatedTransportation);

//     } catch (error) {
//         console.error("Error updating transportation:", error);
//         if (imageFile) fs.unlinkSync(imageFile.path);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Transportation ID format" });
//         }
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         res.status(500).json({ error: "Failed to update transportation", details: error.message });
//     }
// });
// // 🔹 Route to DELETE a Transportation item by ID - Add status check
// app.delete("/api/transportation/:id", async (req, res) => {
//     console.log(`Backend received DELETE request for transportation ID: ${req.params.id}`);
//     try {
//         const transportationId = req.params.id;
//         const providerId = req.body.providerId; // Expect providerId in the body for authorization

//         if (!mongoose.Types.ObjectId.isValid(transportationId)) {
//             return res.status(400).json({ error: "Invalid Transportation ID format provided." });
//         }
//         if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
//             return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
//         }

//         const transportation = await Transportation.findOne({ _id: transportationId, providerId: providerId });
//         if (!transportation) {
//             return res.status(404).json({ message: "Transportation not found or does not belong to this provider." });
//         }
//         // --- NEW: Check provider status (Keep this check for providers deleting their *own* services) ---
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider || provider.status !== 'Approved') {
//             return res.status(403).json({ error: 'Provider account is not approved to delete services.' });
//         }
//         // --- END NEW ---

//         const result = await Transportation.findByIdAndDelete(transportationId);

//         // Delete the associated image file
//         if (transportation.image) {
//             const imagePath = path.join(__dirname, 'src', 'images', transportation.image);
//             fs.unlink(imagePath, (err) => {
//                 if (err) console.error(`Error deleting old image file: ${imagePath}`, err);
//                 else console.log(`Deleted old image file on transportation deletion: ${imagePath}`);
//             });
//         }


//         console.log("Transportation deleted:", transportationId);
//         res.json({ message: "Transportation deleted successfully" });

//     } catch (error) {
//         console.error("Error deleting transportation:", error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Transportation ID format" });
//         }
//         res.status(500).json({ error: "Failed to delete transportation", details: error.message });
//     }
// });


// 🔹 Route to GET a single Transportation item by its Mongoose _id
// app.get("/api/transportation/:id", async (req, res) => {
//     console.log(`Backend received GET request for flat transportation item ID: ${req.params.id}`);
//     try {
//         const transportationItemId = req.params.id;

//         if (!mongoose.Types.ObjectId.isValid(transportationItemId)) {
//             console.error("Backend received invalid ObjectId format for flat transportation item:", transportationItemId);
//             return res.status(400).json({ error: "Invalid Transportation Item ID format provided." });
//         }

//         const transportItem = await Transportation.findById(transportationItemId);

//         if (!transportItem) {
//             console.log("Flat Transportation item not found for ID:", transportationItemId);
//             return res.status(404).json({ message: "Transportation item not found" });
//         }

//         console.log("Found Flat Transportation item:", transportItem._id);
//         res.json(transportItem);

//     } catch (error) {
//         console.error("Error fetching single flat transportation item by _id:", error);
//         res.status(500).json({ error: "Internal Server Error", details: error.message });
//     }
// });
// 🔹 Route for a Provider to Add New Sport Adventure - Add status check
// app.post("/api/provider/:providerId/sports-adventures", uploadSingle.single('image'), async (req, res) => {
//     console.log(`Backend received POST request for adding sport adventure for provider ${req.params.providerId}`);
//     const providerId = req.params.providerId;
//     const adventureData = req.body;
//     const imageFile = req.file;
//     let generatedId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         if (imageFile) fs.unlinkSync(imageFile.path);
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     if (!adventureData.type || !adventureData.name || !adventureData.description ||
//         !adventureData.location || !adventureData.price || !imageFile || adventureData.minimumAge === undefined) {
//         if (imageFile) fs.unlinkSync(imageFile.path);
//         return res.status(400).json({ error: 'Missing required fields or image file.' });
//     }

//     try {
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider) {
//             console.log(`Provider not found for ID: ${providerId} when adding sport adventure.`);
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(404).json({ message: 'Provider not found.' });
//         }
//         // --- NEW: Check provider status (Keep this check for providers adding their *own* services) ---
//         if (provider.status !== 'Approved') {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(403).json({ error: 'Provider account is not approved to add services.' });
//         }
//         // --- END NEW ---
//         if (provider.serviceType !== 'Sport Adventure') {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(403).json({ error: 'Provider is not authorized to add Sport Adventure services.' });
//         }

//         // --- Generate Unique Sport Adventure ID --- (Existing logic)
//         const type = adventureData.type;
//         const prefix = sportAdventureTypePrefixes[type] || 'SA';
//         let counter = 0;
//         const maxRetries = 10;

//         while (counter < maxRetries) {
//             const lastAdventure = await SportAdventure.findOne({ id: new RegExp(`^${prefix}\\d+$`) })
//                 .sort({ id: -1 })
//                 .limit(1);

//             let nextNumber = 1;
//             if (lastAdventure) {
//                 const lastId = lastAdventure.id;
//                 const lastNumber = parseInt(lastId.replace(prefix, ''), 10);
//                 if (!isNaN(lastNumber)) {
//                     nextNumber = lastNumber + 1;
//                 }
//             }
//             generatedId = `${prefix}${String(nextNumber).padStart(2, '0')}`;
//             const existingAdventureWithId = await SportAdventure.findOne({ id: generatedId });
//             if (!existingAdventureWithId) {
//                 break;
//             }
//             console.warn(`Generated duplicate Sport Adventure ID: ${generatedId}. Retrying...`);
//             counter++;
//             if (counter === maxRetries) {
//                 if (imageFile) fs.unlinkSync(imageFile.path);
//                 throw new Error('Failed to generate a unique Sport Adventure ID after multiple retries.');
//             }
//         }
//         // --- End Generate Unique Sport Adventure ID ---


//         const newAdventureData = {
//             ...adventureData,
//             providerId: providerId,
//             id: generatedId,
//             image: imageFile.filename
//         };

//         newAdventureData.price = parseFloat(newAdventureData.price);
//         newAdventureData.minimumAge = parseInt(newAdventureData.minimumAge, 10);
//         if (newAdventureData.rating !== undefined) newAdventureData.rating = parseFloat(newAdventureData.rating);

//         if (newAdventureData.termsAndConditions && typeof newAdventureData.termsAndConditions === 'string') {
//             newAdventureData.termsAndConditions = newAdventureData.termsAndConditions.split(',').map(term => term.trim()).filter(term => term);
//         } else if (newAdventureData.termsAndConditions === '') {
//             newAdventureData.termsAndConditions = [];
//         } else if (!Array.isArray(newAdventureData.termsAndConditions)) {
//             newAdventureData.termsAndConditions = [];
//         }


//         const newAdventure = new SportAdventure(newAdventureData);
//         await newAdventure.save();
//         console.log("New sport adventure saved for provider:", providerId, newAdventure._id, "with ID:", generatedId);
//         res.status(201).json(newAdventure);

//     } catch (error) {
//         console.error("Error adding sport adventure for provider:", providerId, error);
//         if (imageFile) fs.unlinkSync(imageFile.path);
//         if (error.code === 11000) {
//             return res.status(409).json({ error: `Sport Adventure with this generated ID already exists. Please try again.` });
//         }
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         res.status(500).json({ error: "Failed to add sport adventure", details: error.message });
//     }
// });

// // 🔹 Route for a Provider to Get Their Sport Adventures - MODIFIED (Removed status check for Admin view)
// app.get("/api/provider/:providerId/sports-adventures", async (req, res) => {
//     console.log(`Backend received GET request for provider ${req.params.providerId}'s sport adventures`);
//     const providerId = req.params.providerId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     try {
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider) {
//             console.log(`Provider not found for ID: ${providerId} when fetching sport adventures.`);
//             return res.status(404).json({ message: 'Provider not found.' });
//         }
//         // --- REMOVED: Provider status check here to allow Admin to fetch ---
//         // if (provider.status !== 'Approved') {
//         //      return res.status(403).json({ error: 'Provider account is not approved to view services.' });
//         // }
//         // --- END REMOVED ---
//         if (provider.serviceType !== 'Sport Adventure') {
//             return res.status(403).json({ error: 'Provider is not authorized to view Sport Adventure services.' });
//         }

//         const adventures = await SportAdventure.find({ providerId: providerId });
//         console.log(`Found ${adventures.length} sport adventures for provider ${providerId}.`);
//         res.status(200).json(adventures);

//     } catch (error) {
//         console.error("Error fetching sport adventures for provider:", providerId, error);
//         res.status(500).json({ error: "Failed to fetch sport adventures", details: error.message });
//     }
// });


// // 🔹 Route to UPDATE a Sport Adventure by ID - Add status check
// app.put("/api/sports-adventures/:id", uploadSingle.single('image'), async (req, res) => {
//     console.log(`Backend received PUT request for sport adventure ID: ${req.params.id}`);
//     const imageFile = req.file;
//     try {
//         const adventureId = req.params.id;
//         const updateData = req.body;
//         const providerId = updateData.providerId;


//         if (!mongoose.Types.ObjectId.isValid(adventureId)) {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(400).json({ error: "Invalid Sport Adventure ID format provided." });
//         }
//         if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
//         }

//         const adventure = await SportAdventure.findOne({ _id: adventureId, providerId: providerId });
//         if (!adventure) {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(404).json({ message: "Sport Adventure not found or does not belong to this provider." });
//         }
//         // --- NEW: Check provider status (Keep this check for providers updating their *own* services) ---
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider || provider.status !== 'Approved') {
//             if (imageFile) fs.unlinkSync(imageFile.path);
//             return res.status(403).json({ error: 'Provider account is not approved to modify services.' });
//         }
//         // --- END NEW ---

//         if (imageFile) {
//             const oldImagePath = path.join(__dirname, 'src', 'images', adventure.image);
//             if (adventure.image && fs.existsSync(oldImagePath)) {
//                 fs.unlink(oldImagePath, (err) => {
//                     if (err) console.error(`Error deleting old image file: ${oldImagePath}`, err);
//                     else console.log(`Deleted old image file on sport adventure update: ${oldImagePath}`);
//                 });
//             }
//             updateData.image = imageFile.filename;
//         } else {
//             // If no new image is uploaded, check if the frontend explicitly sent empty/null for image
//             if (updateData.image === undefined) {
//                 // If image field is not in updateData, keep the old image
//                 updateData.image = adventure.image;
//             } else if (updateData.image === null || updateData.image === '') {
//                 // If frontend explicitly sent empty/null, delete the old image and set image to empty string
//                 const oldImagePath = path.join(__dirname, 'src', 'images', adventure.image);
//                 if (fs.existsSync(oldImagePath)) {
//                     fs.unlink(oldImagePath, (err) => {
//                         if (err) console.error(`Error deleting old image file (cleared): ${oldImagePath}`, err);
//                         else console.log(`Deleted old image file because frontend sent empty image: ${oldImagePath}`);
//                     });
//                 }
//                 updateData.image = '';
//             }
//         }


//         delete updateData.providerId; // Prevent providerId from being updated
//         delete updateData.id; // Prevent sport adventure ID from being updated

//         if (updateData.price !== undefined) updateData.price = parseFloat(updateData.price);
//         if (updateData.minimumAge !== undefined) updateData.minimumAge = parseInt(updateData.minimumAge, 10);
//         if (updateData.rating !== undefined) updateData.rating = parseFloat(updateData.rating);

//         if (updateData.termsAndConditions && typeof updateData.termsAndConditions === 'string') {
//             updateData.termsAndConditions = updateData.termsAndConditions.split(',').map(term => term.trim()).filter(term => term);
//         } else if (updateData.termsAndConditions === '') {
//             updateData.termsAndConditions = [];
//         } else if (!Array.isArray(updateData.termsAndConditions)) {
//             updateData.termsAndConditions = [];
//         }


//         const updatedAdventure = await SportAdventure.findByIdAndUpdate(
//             adventureId,
//             updateData,
//             { new: true, runValidators: true }
//         );

//         if (!updatedAdventure) {
//             return res.status(404).json({ message: "Sport Adventure not found" });
//         }

//         console.log("Sport Adventure updated:", updatedAdventure._id);
//         res.json(updatedAdventure);

//     } catch (error) {
//         console.error("Error updating sport adventure:", error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Sport Adventure ID format" });
//         }
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         res.status(500).json({ error: "Failed to update sport adventure", details: error.message });
//     }
// });

// // 🔹 Route to DELETE a Sport Adventure by ID - Add status check
// app.delete("/api/sports-adventures/:id", async (req, res) => {
//     console.log(`Backend received DELETE request for sport adventure ID: ${req.params.id}`);
//     try {
//         const adventureId = req.params.id;
//         const providerId = req.body.providerId; // Expect providerId in the body for authorization

//         if (!mongoose.Types.ObjectId.isValid(adventureId)) {
//             return res.status(400).json({ error: "Invalid Sport Adventure ID format provided." });
//         }
//         if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
//             return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
//         }

//         const adventure = await SportAdventure.findOne({ _id: adventureId, providerId: providerId });
//         if (!adventure) {
//             return res.status(404).json({ message: "Sport Adventure not found or does not belong to this provider." });
//         }
//         // --- NEW: Check provider status (Keep this check for providers deleting their *own* services) ---
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider || provider.status !== 'Approved') {
//             return res.status(403).json({ error: 'Provider account is not approved to delete services.' });
//         }
//         // --- END NEW ---

//         const result = await SportAdventure.findByIdAndDelete(adventureId);

//         // Delete the associated image file
//         if (adventure.image) {
//             const imagePath = path.join(__dirname, 'src', 'images', adventure.image);
//             fs.unlink(imagePath, (err) => {
//                 if (err) console.error(`Error deleting old image file: ${imagePath}`, err);
//                 else console.log(`Deleted old image file on sport adventure deletion: ${imagePath}`);
//             });
//         }


//         console.log("Sport Adventure deleted:", adventureId);
//         res.json({ message: "Sport Adventure deleted successfully" });

//     } catch (error) {
//         console.error("Error deleting sport adventure:", error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Sport Adventure ID format" });
//         }
//         res.status(500).json({ error: "Failed to delete sport adventure", details: error.message });
//     }
// });

// // --- NEW ENDPOINT: Get Single Sport Adventure by ID (Public) ---
// app.get("/api/sports-adventures/:id", async (req, res) => {
//     console.log(`Backend received GET request for single Sport Adventure ID: ${req.params.id}`);
//     const adventureId = req.params.id;

//     if (!mongoose.Types.ObjectId.isValid(adventureId)) {
//         return res.status(400).json({ error: "Invalid Sport Adventure ID format." });
//     }

//     try {
//         const sportAdventure = await SportAdventure.findById(adventureId);
//         if (!sportAdventure) {
//             console.log(`Sport Adventure not found for ID: ${adventureId}`);
//             return res.status(404).json({ message: 'Sport Adventure not found.' });
//         }
//         console.log(`Found Sport Adventure for ID: ${adventureId}`);
//         res.status(200).json(sportAdventure);
//     } catch (error) {
//         console.error('Error fetching single Sport Adventure by ID:', error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Sport Adventure ID format." });
//         }
//         res.status(500).json({ error: 'Failed to fetch Sport Adventure details.', details: error.message });
//     }
// });
// // --- ENDPOINTS FOR BOOKING REQUESTS (FOR PROVIDERS) ---

// // Endpoint for Provider Booking Requests - Add status check
// app.get('/api/provider/:providerId/booking-requests', async (req, res) => {
//     console.log(`Backend received GET request for booking requests for provider ID: ${req.params.providerId}`);
//     const providerId = req.params.providerId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     try {
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider) {
//             console.log(`Provider not found for ID: ${providerId} when fetching booking requests.`);
//             return res.status(404).json({ message: 'Provider not found.' });
//         }
//         // --- NEW: Check provider status (Keep this check for providers viewing their *own* booking requests) ---
//         if (provider.status !== 'Approved') {
//             return res.status(403).json({ error: 'Provider account is not approved to view booking requests.' });
//         }
//         // --- END NEW ---

//         let allBookingRequests = [];

//         if (provider.serviceType === 'Accommodation') {
//             const providerAccommodations = await Accommodation.find({ providerId: provider._id }).select('_id');
//             const accommodationIds = providerAccommodations.map(service => service._id);
//             // Populate both accommodationId and roomId for accommodation bookings
//             allBookingRequests = await Booking.find({ accommodationId: { $in: accommodationIds } }).populate('accommodationId').populate('roomId');
//         } else if (provider.serviceType === 'Transportation') {
//             const providerTransportations = await Transportation.find({ providerId: provider._id }).select('_id');
//             const transportationIds = providerTransportations.map(service => service._id);
//             allBookingRequests = await TransportationBooking.find({ transportationId: { $in: transportationIds } }).populate('transportationId');
//         } else if (provider.serviceType === 'Sport Adventure') {
//             const providerSportAdventures = await SportAdventure.find({ providerId: provider._id }).select('_id');
//             const sportAdventureIds = providerSportAdventures.map(service => service._id);
//             allBookingRequests = await SportAdventureBooking.find({ sportAdventureId: { $in: sportAdventureIds } }).populate('sportAdventureId');
//         }

//         console.log(`Found ${allBookingRequests.length} booking requests for provider ${providerId}.`);
//         res.json(allBookingRequests);

//     } catch (error) {
//         console.error('Error fetching provider booking requests:', error);
//         res.status(500).json({ error: 'Failed to fetch booking requests.', details: error.message });
//     }
// });
// // ✅ Get All Bookings for a Specific Sport Adventure
// app.get("/api/sports-adventures/:adventureId/bookings", async (req, res) => {
//     const { adventureId } = req.params;

//     try {
//         const bookings = await SportAdventureBooking.find({ adventureId });
//         res.json(bookings);
//     } catch (error) {
//         console.error("Error fetching bookings for sport adventure:", error);
//         res.status(500).json({ message: "Failed to fetch bookings." });
//     }
// });
// // Endpoint to Update Booking Status - Add status check AND timestamps
// app.put('/api/bookings/:bookingId/status', async (req, res) => {
//     console.log(`Backend received PUT request to update status for booking ID: ${req.params.bookingId}`);
//     const bookingId = req.params.bookingId;
//     const { status, providerId } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(bookingId)) {
//         return res.status(400).json({ error: "Invalid Booking ID format." });
//     }
//     if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
//     }

//     if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
//         return res.status(400).json({ error: "Invalid status provided. Must be 'Approved' or 'Rejected'." });
//     }

//     try {
//         // --- NEW: Check provider status (Keep this check for providers updating booking status) ---
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider || provider.status !== 'Approved') {
//             return res.status(403).json({ error: 'Provider account is not approved to update booking status.' });
//         }
//         // --- END NEW ---

//         let updatedBooking = null;
//         let bookingModel = null;
//         let bookingService = null;

//         // Find the booking across all booking collections
//         // For Accommodation bookings, populate both accommodationId and roomId
//         let booking = await Booking.findById(bookingId).populate('accommodationId').populate('roomId');
//         if (booking && booking.accommodationId?.providerId.toString() === providerId) {
//             // Update status and timestamps
//             updatedBooking = await Booking.findByIdAndUpdate(bookingId,
//                 { status: status, approvedAt: status === 'Approved' ? new Date() : undefined, rejectedAt: status === 'Rejected' ? new Date() : undefined },
//                 { new: true }
//             );
//             bookingModel = 'AccommodationBooking';
//             bookingService = booking.accommodationId;
//         }

//         if (!updatedBooking) {
//             booking = await TransportationBooking.findById(bookingId).populate('transportationId');
//             if (booking && booking.transportationId?.providerId.toString() === providerId) {
//                 // Update status and timestamps
//                 updatedBooking = await TransportationBooking.findByIdAndUpdate(bookingId,
//                     { status: status, approvedAt: status === 'Approved' ? new Date() : undefined, rejectedAt: status === 'Rejected' ? new Date() : undefined },
//                     { new: true }
//                 );
//                 bookingModel = 'TransportationBooking';
//                 bookingService = booking.transportationId;
//             }
//         }

//         if (!updatedBooking) {
//             booking = await SportAdventureBooking.findById(bookingId).populate('sportAdventureId');
//             if (booking && booking.sportAdventureId?.providerId.toString() === providerId) {
//                 // Update status and timestamps
//                 updatedBooking = await SportAdventureBooking.findByIdAndUpdate(bookingId,
//                     { status: status, approvedAt: status === 'Approved' ? new Date() : undefined, rejectedAt: status === 'Rejected' ? new Date() : undefined },
//                     { new: true }
//                 );
//                 bookingModel = 'SportAdventureBooking';
//                 bookingService = booking.sportAdventureId;
//             }
//         }


//         if (!updatedBooking) {
//             console.log(`Booking not found for ID: ${bookingId} or does not belong to provider ${providerId} for status update.`);
//             return res.status(404).json({ message: 'Booking request not found or does not belong to this provider.' });
//         }

//         // Send email notification to the user about booking status change
//         if (updatedBooking && updatedBooking.user_email) {
//             let subject = '';
//             let emailText = '';
//             let serviceName = 'the service';
//             let bookingDetailsSummary = '';

//             if (bookingModel === 'AccommodationBooking') {
//                 serviceName = updatedBooking.accommodationName || (bookingService ? bookingService.accommodationName : 'Unknown Accommodation');
//                 bookingDetailsSummary = `
// Accommodation: ${serviceName}
// Room: ${updatedBooking.roomNumber} (${updatedBooking.roomType})
// Price Per Night: ₹${updatedBooking.pricePerNight}
// Check-in Date: ${updatedBooking.check_in_date ? new Date(updatedBooking.check_in_date).toDateString() : 'N/A'}
// Check-out Date: ${updatedBooking.check_out_date ? new Date(updatedBooking.check_out_date).toDateString() : 'N/A'}
// Total Guests: ${updatedBooking.total_guests !== undefined ? updatedBooking.total_guests : 'N/A'}
// Total Price: ₹${updatedBooking.total_price !== undefined ? updatedBooking.total_price.toLocaleString('en-IN') : 'N/A'}
// Booking Date: ${updatedBooking.booking_datetime ? new Date(updatedBooking.booking_datetime).toLocaleString() : 'N/A'}
// Status Updated At: ${status === 'Approved' && updatedBooking.approvedAt ? new Date(updatedBooking.approvedAt).toLocaleString() : status === 'Rejected' && updatedBooking.rejectedAt ? new Date(updatedBooking.rejectedAt).toLocaleString() : 'N/A'}
// `;
//             } else if (bookingModel === 'TransportationBooking') {
//                 serviceName = updatedBooking.transportationName || (bookingService ? (bookingService.model || bookingService.transport_type) : 'Unknown Transportation');
//                 bookingDetailsSummary = `
// Transportation: ${serviceName}
// Date of Travel: ${updatedBooking.date_of_travel ? new Date(updatedBooking.date_of_travel).toDateString() : 'N/A'}
// Total Passengers: ${updatedBooking.total_passengers !== undefined ? updatedBooking.total_passengers : 'N/A'}
// Total Price: ₹${updatedBooking.total_price !== undefined ? updatedBooking.total_price.toLocaleString('en-IN') : 'N/A'}
// Booking Date: ${updatedBooking.booking_datetime ? new Date(updatedBooking.booking_datetime).toLocaleString() : 'N/A'}
// Status Updated At: ${status === 'Approved' && updatedBooking.approvedAt ? new Date(updatedBooking.approvedAt).toLocaleString() : status === 'Rejected' && updatedBooking.rejectedAt ? new Date(updatedBooking.rejectedAt).toLocaleString() : 'N/A'}
// `;
//             } else if (bookingModel === 'SportAdventureBooking') {
//                 serviceName = updatedBooking.sportAdventureName || (bookingService ? bookingService.name : 'Unknown Sport Adventure');
//                 bookingDetailsSummary = `
// Sport Adventure: ${serviceName}
// Date of Activity: ${updatedBooking.date_of_activity ? new Date(updatedBooking.date_of_activity).toDateString() : 'N/A'}
// Total Participants: ${updatedBooking.total_participants !== undefined ? updatedBooking.total_participants : 'N/A'}
// Total Price: ₹${updatedBooking.total_price !== undefined ? updatedBooking.total_price.toLocaleString('en-IN') : 'N/A'}
// Booking Date: ${updatedBooking.booking_datetime ? new Date(updatedBooking.booking_datetime).toLocaleString() : 'N/A'}
// Status Updated At: ${status === 'Approved' && updatedBooking.approvedAt ? new Date(updatedBooking.approvedAt).toLocaleString() : status === 'Rejected' && updatedBooking.rejectedAt ? new Date(updatedBooking.rejectedAt).toLocaleString() : 'N/A'}
// `;
//             }


//             if (status === 'Approved') {
//                 subject = `Your Booking for ${serviceName} has been Approved!`;
//                 emailText = `
// Dear ${updatedBooking.user_name || 'User'},

// Good news! Your booking for ${serviceName} has been approved.

// Booking Details:
// ${bookingDetailsSummary}

// You can now proceed with your plans.

// Thank you for booking with us!

// Best regards,
// The [Your Website Name] Team
// `;
//             } else if (status === 'Rejected') {
//                 subject = `Your Booking for ${serviceName} has been Rejected`;
//                 emailText = `
// Dear ${updatedBooking.user_name || 'User'},

// We regret to inform you that your booking for ${serviceName} has been rejected.

// Booking Details:
// ${bookingDetailsSummary}

// If you have any questions, please contact us.

// We apologize for any inconvenience this may cause.

// Best regards,
// The [Your Website Name] Team
// `;
//             }

//             try {
//                 await transporter.sendMail({
//                     from: 'maleksehban4@gmail.com', // Replace with your actual email
//                     to: updatedBooking.user_email,
//                     subject: subject,
//                     text: emailText,
//                 });
//                 console.log(`Booking status email sent to ${updatedBooking.user_email} for booking ID: ${bookingId}`);
//             } catch (emailError) {
//                 console.error(`Error sending booking status email to ${updatedBooking.user_email}:`, emailError);
//             }
//         }

//         res.json({ message: 'Booking status updated successfully!', booking: updatedBooking });

//     } catch (error) {
//         console.error('Error updating booking status:', error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Booking ID format." });
//         }
//         res.status(500).json({ error: 'Failed to update booking status.', details: error.message });
//     }
// });


// // GET Provider Profile by ID - No change needed, it already excludes password
// app.get('/api/providers/:providerId', async (req, res) => {
//     console.log(`Backend received GET request for single provider ID: ${req.params.providerId}`);
//     const providerId = req.params.providerId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     try {
//         // Find the service provider by ID, excluding the password field
//         const provider = await ServiceProvider.findById(providerId).select('-password');

//         if (!provider) {
//             console.log(`Provider not found for ID: ${providerId}`);
//             return res.status(404).json({ message: 'Provider not found.' });
//         }

//         console.log(`Found provider for ID: ${providerId}`);
//         res.status(200).json(provider);

//     } catch (error) {
//         console.error('Error fetching single provider by ID:', error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Provider ID format." });
//         }
//         res.status(500).json({ error: 'Failed to fetch provider details.', details: error.message });
//     }
// });

// // --- NEW SERVICE PROVIDER ENDPOINT: Request OTP for Password Change ---
// app.post("/api/providers/:providerId/send-otp-password-change", async (req, res) => {
//     console.log(`Backend received POST request to send OTP for password change for provider ID: ${req.params.providerId}`);
//     const { currentPassword, newPassword } = req.body;
//     const providerId = req.params.providerId;

//     // Authorization: Ensure the requesting provider matches the URL providerId
//     if (req.providerId.toString() !== providerId) {
//         return res.status(403).json({ message: 'Forbidden: You are not authorized to perform this action for another provider.' });
//     }

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     // Basic validation
//     if (!currentPassword || !newPassword) {
//         return res.status(400).json({ error: "Current password and new password are required." });
//     }

//     if (newPassword.length < 8) {
//         return res.status(400).json({ error: "New password must be at least 8 characters long." });
//     }

//     try {
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider) {
//             return res.status(404).json({ message: "Provider not found." });
//         }

//         // --- Verify current password ---
//         // Assuming currentPassword is NOT hashed for Super Admin (as per earlier instructions)
//         // If you *were* using bcrypt, it would be: const isMatch = await bcrypt.compare(currentPassword, provider.password);
//         const isMatch = (currentPassword === provider.password); // Direct comparison for unhashed passwords

//         if (!isMatch) {
//             return res.status(401).json({ error: "Invalid current password." });
//         }

//         // --- Generate OTP ---
//         const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
//         const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

//         // Store OTP and its expiry in the provider document
//         provider.otp = otp;
//         provider.otpExpiry = otpExpiry;
//         provider.newPasswordTemp = newPassword; // Temporarily store new password for verification step

//         await provider.save();
//         console.log(`OTP generated and saved for provider ${providerId}: ${otp}`);

//         // --- Send OTP to provider's email ---
//         const mailOptions = {
//             from: 'maleksehban4@gmail.com', // Use your configured email
//             to: provider.email,
//             subject: 'Password Change OTP for Travel Booking Platform',
//             html: `
//                 <p>Dear ${provider.ownerFullName || provider.businessName || 'Service Provider'},</p>
//                 <p>You have requested to change your password for the Travel Booking Platform. Your One-Time Password (OTP) is:</p>
//                 <h3><strong>${otp}</strong></h3>
//                 <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
//                 <p>If you did not request this, please ignore this email.</p>
//                 <p>Best regards,<br>The Travel Booking Platform Team</p>
//             `,
//         };

//         await transporter.sendMail(mailOptions);
//         console.log(`OTP email sent to ${provider.email}`);

//         res.status(200).json({ message: "OTP sent to your registered email for password change." });

//     } catch (error) {
//         console.error('Error sending OTP for password change:', error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Provider ID format." });
//         }
//         res.status(500).json({ error: 'Failed to send OTP.', details: error.message });
//     }
// });

// // --- NEW SERVICE PROVIDER ENDPOINT: Verify OTP and Change Password ---
// app.put("/api/providers/:providerId/verify-otp-and-change-password", async (req, res) => {
//     console.log(`Backend received PUT request to verify OTP and change password for provider ID: ${req.params.providerId}`);
//     const { otp, newPassword } = req.body;
//     const providerId = req.params.providerId;

//     // Authorization: Ensure the requesting provider matches the URL providerId
//     if (req.providerId.toString() !== providerId) {
//         return res.status(403).json({ message: 'Forbidden: You are not authorized to perform this action for another provider.' });
//     }

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     if (!otp || !newPassword) {
//         return res.status(400).json({ error: "OTP and new password are required." });
//     }

//     if (newPassword.length < 8) {
//         return res.status(400).json({ error: "New password must be at least 8 characters long." });
//     }

//     try {
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider) {
//             return res.status(404).json({ message: "Provider not found." });
//         }

//         // --- Verify OTP and Expiry ---
//         if (!provider.otp || !provider.otpExpiry || provider.otp !== otp || Date.now() > provider.otpExpiry) {
//             return res.status(400).json({ error: "Invalid or expired OTP." });
//         }

//         // --- Verify newPasswordTemp matches newPassword from this request ---
//         if (provider.newPasswordTemp !== newPassword) {
//             // This is a security check: ensure the new password provided now matches the one stored with the OTP.
//             // This prevents someone from intercepting the OTP and setting a *different* new password.
//             return res.status(400).json({ error: "New password mismatch. Please retry the password change process." });
//         }


//         // --- Update Password ---
//         // Assuming currentPassword is NOT hashed for Super Admin (as per earlier instructions)
//         // If you *were* using bcrypt, it would be: provider.password = await bcrypt.hash(newPassword, 10);
//         provider.password = newPassword; // Direct assignment for unhashed passwords

//         // Clear OTP related fields after successful password change
//         provider.otp = undefined;
//         provider.otpExpiry = undefined;
//         provider.newPasswordTemp = undefined;

//         await provider.save();
//         console.log(`Password successfully changed for provider ${providerId}`);

//         res.status(200).json({ message: "Password changed successfully!" });

//     } catch (error) {
//         console.error('Error verifying OTP or changing password:', error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Provider ID format." });
//         }
//         res.status(500).json({ error: 'Failed to change password.', details: error.message });
//     }
// });


// // --- NEW ENDPOINT: Get Single Service Provider by ID ---
// // This endpoint will be used by the Service Provider Dashboard to fetch their own details.
// app.get('/api/providers/:providerId', async (req, res) => {
//     console.log(`Backend received GET request for single provider ID: ${req.params.providerId}`);
//     const providerId = req.params.providerId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     try {
//         // Find the service provider by ID, excluding the password field
//         const provider = await ServiceProvider.findById(providerId).select('-password');

//         if (!provider) {
//             console.log(`Provider not found for ID: ${providerId}`);
//             return res.status(404).json({ message: 'Provider not found.' });
//         }

//         console.log(`Found provider for ID: ${providerId}`);
//         res.status(200).json(provider);

//     } catch (error) {
//         console.error('Error fetching single provider by ID:', error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Provider ID format." });
//         }
//         res.status(500).json({ error: 'Failed to fetch provider details.', details: error.message });
//     }
// });
// // --- END NEW ENDPOINT ---


// // 🔹 Route for a Provider to Add a New Accommodation - UPDATED FOR MULTI-ROOM
// app.post("/api/provider/:providerId/accommodations", upload, async (req, res) => {
//     console.log(`Backend received POST request for adding accommodation for provider ${req.params.providerId}`);
//     const providerId = req.params.providerId;
//     const { rooms, ...accommodationData } = req.body;
//     const mainImageFile = req.files && req.files['image'] ? req.files['image'][0] : null;

//     let parsedRooms = [];
//     if (rooms) {
//         try {
//             parsedRooms = JSON.parse(rooms);
//         } catch (parseError) {
//             console.error('Error parsing rooms JSON:', parseError);
//             return res.status(400).json({ error: "Invalid rooms data format. Must be a valid JSON string." });
//         }
//     }

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     if (!accommodationData.accommodationType || !accommodationData.accommodationName ||
//         !accommodationData.ownerName || !accommodationData.address) {
//         return res.status(400).json({ error: 'Missing required fields for main accommodation details.' });
//     }

//     if (!parsedRooms || parsedRooms.length === 0) {
//         return res.status(400).json({ error: 'At least one room detail is required for the accommodation.' });
//     }

//     try {
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider) {
//             return res.status(404).json({ error: 'Provider not found.' });
//         }
//         if (provider.status !== 'Approved') {
//             return res.status(403).json({ error: 'Provider account is not approved to add services.' });
//         }
//         if (provider.serviceType !== 'Accommodation') {
//             return res.status(403).json({ error: 'Provider is not authorized to add Accommodation services.' });
//         }

//         // Generate unique accommodation ID
//         const prefix = accommodationTypePrefixes[accommodationData.accommodationType] || 'A';
//         let generatedAccommodationId;
//         let counter = 0;
//         const maxRetries = 10;

//         while (counter < maxRetries) {
//             const last = await Accommodation.findOne({ accommodationID: new RegExp(`^${prefix}\\d+$`) })
//                 .sort({ accommodationID: -1 })
//                 .limit(1);

//             const nextNumber = last ? parseInt(last.accommodationID.replace(prefix, '')) + 1 : 1;
//             generatedAccommodationId = `${prefix}${String(nextNumber).padStart(2, '0')}`;
//             const exists = await Accommodation.findOne({ accommodationID: generatedAccommodationId });

//             if (!exists) break;
//             counter++;
//         }

//         if (counter === maxRetries) {
//             return res.status(500).json({ error: 'Failed to generate unique Accommodation ID.' });
//         }

//         // Step 1: Save the Accommodation first
//         const newAccommodation = new Accommodation({
//             providerId: providerId,
//             accommodationID: generatedAccommodationId,
//             accommodationType: accommodationData.accommodationType,
//             accommodationName: accommodationData.accommodationName,
//             ownerName: accommodationData.ownerName,
//             address: accommodationData.address,
//             image: mainImageFile ? mainImageFile.filename : (accommodationData.image || ''),
//             termsAndConditions: accommodationData.termsAndConditions || '',
//             nearbyLocations: accommodationData.nearbyLocations || '',
//             rooms: [] // To be added next
//         });

//         await newAccommodation.save();

//         // Step 2: Save rooms with the generated accommodation ID
//         const roomImageFiles = req.files['roomImages'] || [];
//         const roomIds = [];

//         for (let i = 0; i < parsedRooms.length; i++) {
//             const room = parsedRooms[i];
//             const roomImage = roomImageFiles[i]?.filename || '';

//             const newRoom = new Room({
//                 accommodationId: newAccommodation._id,
//                 roomNumber: room.roomNumber,
//                 roomType: room.roomType,
//                 pricePerNight: parseFloat(room.pricePerNight),
//                 numberOfBeds: parseInt(room.numberOfBeds),
//                 roomFacilities: room.roomFacilities || [],
//                 roomAmenities: room.roomAmenities || [],
//                 description: room.description || '',
//                 image: roomImage
//             });

//             await newRoom.save();
//             roomIds.push(newRoom._id);
//         }

//         // Step 3: Update accommodation with room references
//         newAccommodation.rooms = roomIds;
//         await newAccommodation.save();

//         console.log("Accommodation and rooms successfully created.");
//         res.status(201).json(newAccommodation);

//     } catch (error) {
//         console.error("Error adding accommodation:", error);
//         res.status(500).json({ error: 'Failed to add accommodation.', details: error.message });
//     }
// });

// // 🔹 Route for a Provider to Get Their Accommodations - MODIFIED (Populate rooms)
// app.get("/api/provider/:providerId/accommodations", async (req, res) => {
//     console.log(`Backend received GET request for provider ${req.params.providerId}'s accommodations`);
//     const providerId = req.params.providerId;

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format." });
//     }

//     try {
//         const provider = await ServiceProvider.findById(providerId);
//         if (!provider) {
//             console.log(`Provider not found for ID: ${providerId} when fetching accommodations.`);
//             return res.status(404).json({ message: 'Provider not found.' });
//         }
//         if (provider.serviceType !== 'Accommodation') {
//             return res.status(403).json({ error: 'Provider is not authorized to view Accommodation services.' });
//         }

//         // Populate the 'rooms' array with actual Room documents
//         const accommodations = await Accommodation.find({ providerId: providerId }).populate('rooms');
//         console.log(`Found ${accommodations.length} accommodations for provider ${providerId}.`);
//         res.status(200).json(accommodations);

//     } catch (error) {
//         console.error("Error fetching accommodations for provider:", providerId, error);
//         res.status(500).json({ error: "Failed to fetch accommodations", details: error.message });
//     }
// });


// app.put('/api/providers/:id', upload, async (req, res) => {
//     console.log(`Backend received PUT request for provider profile ID: ${req.params.id}`);
//     const providerId = req.params.id; // Get ID from URL parameter

//     if (!mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(400).json({ error: "Invalid Provider ID format provided." });
//     }

//     // Prepare update data from req.body
//     const updateData = { ...req.body };
//     console.log("Update Data received:", updateData);

//     // Frontend sends 'contactNumber' but schema expects 'phoneNumber'
//     if (updateData.contactNumber) {
//         updateData.phoneNumber = updateData.contactNumber;
//         delete updateData.contactNumber; // Remove the old field name
//     }

//     // Handle nested JSON strings from FormData if they were sent as such
//     // In ProviderProfile.js, only transportationDetails and sportAdventureDetails are stringified.
//     if (updateData.transportationDetails) {
//         try {
//             updateData.transportationDetails = JSON.parse(updateData.transportationDetails);
//         } catch (e) {
//             console.error("Failed to parse transportationDetails:", e);
//             return res.status(400).json({ error: "Invalid format for transportation details." });
//         }
//     }
//     if (updateData.sportAdventureDetails) {
//         try {
//             updateData.sportAdventureDetails = JSON.parse(updateData.sportAdventureDetails);
//         } catch (e) {
//             console.error("Failed to parse sportAdventureDetails:", e);
//             return res.status(400).json({ error: "Invalid format for sport adventure details." });
//         }
//     }
//     // Handle arrays that might be stringified (like typeOfAdventureActivity, roomTypesOffered etc.)
//     // Although current ProviderProfile.js doesn't edit these, if it did, they'd be stringified.
//     for (const key of ['roomTypesOffered', 'facilitiesAvailable', 'typeOfAdventureActivity']) {
//         if (updateData[key] && typeof updateData[key] === 'string') {
//             try {
//                 updateData[key] = JSON.parse(updateData[key]);
//             } catch (e) {
//                 console.error(`Failed to parse array field ${key}:`, e);
//                 return res.status(400).json({ error: `Invalid format for ${key}.` });
//             }
//         }
//     }


//     // Frontend currently sends document/image paths as strings, not new files for update.
//     // If you plan to allow re-uploading documents/service photos, you'd need logic here
//     // similar to the ServiceProvider signup route to handle req.files and delete old files.
//     // For now, we assume these fields are either kept as is or cleared from the frontend
//     // by sending an empty string. Multer has already parsed them, so they are in req.body.


//     try {
//         // Find the provider and update
//         // We select the password to keep it in the document object, even though we don't update it.
//         // This prevents Mongoose from thinking it's missing if you just update other fields.
//         const updatedProvider = await ServiceProvider.findByIdAndUpdate(
//             providerId,
//             { $set: updateData }, // Use $set to update only specified fields
//             { new: true, runValidators: true } // Return the updated document and run schema validators
//         ).select('-password'); // Exclude password from the response

//         if (!updatedProvider) {
//             console.log(`Provider not found for update ID: ${providerId}`);
//             return res.status(404).json({ message: "Provider not found." });
//         }

//         console.log("Provider profile updated successfully:", updatedProvider._id);
//         res.status(200).json({ message: "Profile updated successfully!", provider: updatedProvider });

//     } catch (error) {
//         console.error("Error updating provider profile:", error);
//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
//         }
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Provider ID format." });
//         }
//         res.status(500).json({ error: "Failed to update profile. Please try again.", details: error.message });
//     }
// });
// --- NEW ENDPOINT: Update Accommodation Booking Status ---
// app.put('/api/accommodation-bookings/:id/status', async (req, res) => {
//     console.log(`Backend received PUT request to update accommodation booking status for ID: ${req.params.id}`);
//     const bookingId = req.params.id;
//     const { status } = req.body; // Expecting 'Approved' or 'Rejected'
//     const providerId = req.body.providerId; // Passed from frontend for authorization

//     if (!mongoose.Types.ObjectId.isValid(bookingId)) {
//         return res.status(400).json({ error: "Invalid Booking ID format." });
//     }
//     if (!status || !['Approved', 'Rejected'].includes(status)) {
//         return res.status(400).json({ error: "Invalid status provided. Must be 'Approved' or 'Rejected'." });
//     }
//     if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) {
//         return res.status(401).json({ error: "Valid providerId is required in the request body for authorization." });
//     }

//     try {
//         const booking = await Booking.findById(bookingId).populate('accommodationId');
//         if (!booking) {
//             return res.status(404).json({ message: "Booking not found." });
//         }

//         // Authorization check: Ensure the booking belongs to the logged-in provider's accommodation
//         if (!booking.accommodationId || booking.accommodationId.providerId.toString() !== providerId) {
//             return res.status(403).json({ message: "Forbidden: You are not authorized to update this booking." });
//         }

//         if (booking.status !== 'Pending') {
//             return res.status(400).json({ message: `Booking is already ${booking.status}.` });
//         }

//         const updateFields = { status: status };
//         if (status === 'Approved') {
//             updateFields.approvedAt = new Date();
//             updateFields.rejectedAt = undefined; // Clear if previously rejected
//         } else if (status === 'Rejected') {
//             updateFields.rejectedAt = new Date();
//             updateFields.approvedAt = undefined; // Clear if previously approved
//         }

//         const updatedBooking = await Booking.findByIdAndUpdate(
//             bookingId,
//             updateFields,
//             { new: true, runValidators: true }
//         ).populate('accommodationId');

//         if (!updatedBooking) {
//             return res.status(404).json({ message: "Booking not found after update." });
//         }

//         // Send email notification to user
//         const mailOptions = {
//             from: 'maleksehban4@gmail.com', // Replace with your actual email
//             to: updatedBooking.user_email,
//             subject: `Your Accommodation Booking for ${updatedBooking.accommodationName} is ${status}`,
//             html: `
//                 <p>Dear ${updatedBooking.user_name},</p>
//                 <p>Your booking for ${updatedBooking.accommodationName} (Room ${updatedBooking.roomNumber}, ${updatedBooking.roomType}) has been <strong>${status}</strong>.</p>
//                 <p><strong>Booking Details:</strong></p>
//                 <ul>
//                     <li>Check-in: ${new Date(updatedBooking.check_in_date).toLocaleDateString()}</li>
//                     <li>Check-out: ${new Date(updatedBooking.check_out_date).toLocaleDateString()}</li>
//                     <li>Guests: ${updatedBooking.total_guests}</li>
//                     <li>Total Price: ₹${updatedBooking.total_price.toLocaleString('en-IN')}</li>
//                     <li>Booking ID: ${updatedBooking._id}</li>
//                 </ul>
//                 <p>Thank you for booking with us!</p>
//             `,
//         };
//         await transporter.sendMail(mailOptions);
//         console.log(`Booking status updated to ${status} and email sent for booking ID: ${updatedBooking._id}`);

//         // The error is here: `updatedUpdatedBooking`
//         res.json({ message: `Booking ${status} successfully.`, booking: updatedBooking });        // It should be:
//         // res.json({ message: `Booking ${status} successfully.`, booking: updatedBooking });

//     } catch (error) {
//         console.error(`Error updating accommodation booking status for ${bookingId}:`, error);
//         if (error.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid Booking ID format." });
//         }
//         res.status(500).json({ error: 'Failed to update booking status.', details: error.message });
//     }
// });
// Inside server.js or imported
function registerGeneralRoutes(app) {
    app.post("/api/accommodation-bookings", async (req, res) => {
        console.log("Backend received POST request for accommodation booking:", req.body);
        try {
            const bookingData = req.body;
            if (!bookingData || !bookingData.user_email || !bookingData.accommodationName || !bookingData.roomId || !bookingData.roomNumber || !bookingData.roomType || !bookingData.pricePerNight) {
                console.error("Accommodation booking received empty request body or missing required fields (email, accommodationName, roomId, roomNumber, roomType, pricePerNight).");
                return res.status(400).json({ error: "Request body is missing or required fields (user email, accommodation name, room ID, room number, room type, price per night) are missing." });
            }
            if (!mongoose.Types.ObjectId.isValid(bookingData.accommodationId)) {
                console.error("Accommodation booking received invalid accommodationId in body:", bookingData.accommodationId);
                return res.status(400).json({ error: "Invalid Accommodation ID provided for booking." });
            }
            if (!mongoose.Types.ObjectId.isValid(bookingData.roomId)) {
                console.error("Accommodation booking received invalid roomId in body:", bookingData.roomId);
                return res.status(400).json({ error: "Invalid Room ID provided for booking." });
            }

            const newBooking = new Booking(bookingData);
            await newBooking.save();
            console.log("Accommodation booking saved successfully.");
            res.status(201).json({ message: "Booking successful!" });
        } catch (error) {
            console.error("Accommodation booking error:", error);
            console.error("Accommodation booking error details:", error.message, error.stack);
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
            }
            res.status(500).json({ error: "Failed to book accommodation", details: error.message });
        }
    });


    // 🔹 Route for Transportation Bookings
    app.post("/api/transportation-bookings", async (req, res) => {
        console.log("Backend received POST request for transportation booking:", req.body);
        try {
            const bookingData = req.body;
            if (!bookingData || !bookingData.user_email || !bookingData.transportationName) {
                console.error("Transportation booking received empty request body or missing required fields (email, transportationName).");
                return res.status(400).json({ error: "Request body is missing or required fields (user email, transportation name) are missing." });
            }
            if (!mongoose.Types.ObjectId.isValid(bookingData.transportationId)) {
                console.error("Transportation booking received invalid transportationId in body:", bookingData.transportationId);
                return res.status(400).json({ error: "Invalid Transportation ID provided for booking." });
            }

            const newBooking = new TransportationBooking(bookingData);
            await newBooking.save();
            console.log("Transportation booking saved successfully.");
            res.status(201).json({ message: "Booking successful!" });
        } catch (error) {
            console.error("Transportation booking error:", error);
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
            }
            res.status(500).json({ error: "Failed to book transportation", details: error.message });
        }
    });


    // 🔹 Route for Sport Adventure Bookings
    app.post("/api/sport-adventure-bookings", async (req, res) => {
        console.log("Backend received POST request for sport adventure booking:", req.body);
        try {
            const bookingData = req.body;
            if (!bookingData || !bookingData.user_email || !bookingData.sportAdventureName) {
                console.error("Sport adventure booking received empty request body or missing required fields (email, sportAdventureName).");
                return res.status(400).json({ error: "Request body is missing or required fields (user email, sport adventure name) are missing." });
            }
            if (!mongoose.Types.ObjectId.isValid(bookingData.sportAdventureId)) {
                console.error("Sport adventure booking received invalid sportAdventureId in body:", bookingData.sportAdventureId);
                return res.status(400).json({ error: "Invalid Sport Adventure ID provided for booking." });
            }
            if (!bookingData.participantsDetails || !Array.isArray(bookingData.participantsDetails) || bookingData.participantsDetails.length === 0) {
                return res.status(400).json({ error: "Participants details are required and must be an array." });
            }


            const newBooking = new SportAdventureBooking(bookingData);
            await newBooking.save();
            console.log("Sport adventure booking saved successfully.");
            res.status(201).json({ message: "Booking successful!" });
        } catch (error) {
            console.error("Sport adventure booking error:", error);
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
            }
            res.status(500).json({ error: "Failed to book sport adventure", details: error.message });
        }
    });


    // 🔹 Business Inquiry Submission
    app.post("/api/business-inquiries", async (req, res) => {
        console.log("Backend received POST request for business inquiry:", req.body);
        try {
            const inquiryData = req.body;
            if (!inquiryData || !inquiryData.companyName || !inquiryData.contactName || !inquiryData.contactMobile || !inquiryData.location) {
                return res.status(400).json({ error: "Required inquiry fields are missing (Company Name, Contact Name, Mobile, Location)." });
            }

            if (inquiryData.servicesNeeded && !Array.isArray(inquiryData.servicesNeeded)) {
                return res.status(400).json({ error: "Services Needed must be an array." });
            }

            if (inquiryData.eventDate) {
                const date = new Date(inquiryData.eventDate);
                if (isNaN(date.getTime())) {
                    return res.status(400).json({ error: "Invalid eventDate format." });
                }
            }

            const newInquiry = new BusinessInquiry(inquiryData);
            await newInquiry.save();
            console.log("Business inquiry saved successfully.");
            res.status(201).json({ message: "Business inquiry submitted successfully!" });

        }
        // Changed `error` variable in catch block to avoid conflict with `error` defined globally
        catch (err) {
            console.error("Business inquiry submission error:", err);
            if (err.name === 'ValidationError') {
                const messages = Object.values(err.errors).map(val => val.message);
                return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
            }
            res.status(500).json({ error: "Failed to submit business inquiry", details: err.message });
        }
    });
    app.get("/api/accommodations", async (req, res) => {
        try {
            const accommodations = await Accommodation.find().populate('rooms');
            res.status(200).json(accommodations);
        } catch (error) {
            console.error("Error fetching accommodations:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    });


    // 🔹 Route to GET all Transportation items
    app.get("/api/transportations", async (req, res) => {
        console.log("Backend received GET request for all flat transportation items");
        try {
            const transportations = await Transportation.find();
            console.log(`Found ${transportations.length} flat transportation items.`);
            res.json(transportations);
        } catch (error) {
            console.error("Error fetching flat transportation items:", error);
            res.status(500).json({ error: "Internal Server Error", details: error.message });
        }
    });


    // 🔹 Route to GET all Sport Adventures
    app.get("/api/sports-adventures", async (req, res) => {
        console.log("Backend received GET request for /api/sports-adventures");
        try {
            const adventures = await SportAdventure.find();
            console.log(`Found ${adventures.length} sport adventures.`);
            res.json(adventures);
        } catch (error) {
            console.error("Error fetching sport adventures:", error);
            res.status(500).json({ error: "Internal Server Error", details: error.message });
        }
    });
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
}

function registerServiceProviderRoutes(app) {
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

}

function registerAdminRoutes(app) {
    app.get('/api/admin/summary-counts', async (req, res) => {
        console.log("Backend received GET request for admin summary counts");
        try {
            const providerCounts = await ServiceProvider.aggregate([
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]);

            const totalProviders = await ServiceProvider.countDocuments();
            const totalAccommodations = await Accommodation.countDocuments();
            const totalTransportations = await Transportation.countDocuments();
            const totalSportAdventures = await SportAdventure.countDocuments();
            const totalBusinessInquiries = await BusinessInquiry.countDocuments();
            const totalBookings = await Booking.countDocuments();
            const totalTransportationBookings = await TransportationBooking.countDocuments();
            const totalSportAdventureBookings = await SportAdventureBooking.countDocuments();


            // Format provider counts
            const formattedProviderCounts = {
                Total: totalProviders,
                Pending: 0,
                Approved: 0,
                Rejected: 0
            };
            providerCounts.forEach(item => {
                if (item._id) { // Ensure _id is not null/undefined
                    formattedProviderCounts[item._id] = item.count;
                }
            });


            res.status(200).json({
                providers: formattedProviderCounts,
                accommodations: { Total: totalAccommodations },
                transportations: { Total: totalTransportations },
                sportAdventures: { Total: totalSportAdventures },
                businessInquiries: { Total: totalBusinessInquiries },
                bookings: { Total: totalBookings },
                transportationBookings: { Total: totalTransportationBookings },
                sportAdventureBookings: { Total: totalSportAdventureBookings }
            });

        } catch (err) {
            console.error('Error fetching admin summary counts:', err);
            res.status(500).json({ error: 'Failed to fetch summary data.', details: err.message });
        }
    });
    // --- END NEW ADMIN SUMMARY ENDPOINTS ---

    // --- NEW ENDPOINT: Get Pending Service Provider Applications (For Admin) ---
    app.get('/api/admin/pending-providers', async (req, res) => {
        console.log("Backend received GET request for pending service provider applications (Admin)");
        try {
            // Find all service providers with status 'Pending'
            const pendingProviders = await ServiceProvider.find({ status: 'Pending' }).select('-password'); // Exclude passwords

            console.log(`Found ${pendingProviders.length} pending service provider applications.`);
            res.json(pendingProviders);

        } catch (err) {
            console.error('Error fetching pending service provider applications:', err);
            res.status(500).json({ error: 'Failed to fetch pending applications.', details: err.message });
        }
    });
    // --- END NEW ENDPOINT ---


    // --- NEW ENDPOINT: Approve Service Provider Application (For Admin) - UPDATED with timestamp ---
    app.post('/api/admin/providers/:providerId/approve', async (req, res) => {
        console.log(`Backend received POST request to approve provider application for ID: ${req.params.providerId}`);
        const providerId = req.params.providerId;

        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(400).json({ error: "Invalid Provider ID format." });
        }

        try {
            // Find the provider application
            const provider = await ServiceProvider.findById(providerId);

            if (!provider) {
                console.log(`Provider application not found for ID: ${providerId} during approval.`);
                return res.status(404).json({ message: 'Provider application not found.' });
            }

            // --- NEW LOG: Check provider status before validation ---
            console.log(`Provider status for ID ${providerId} before approval check: ${provider.status}`);

            // Check if already approved or rejected
            if (provider.status !== 'Pending') {
                return res.status(400).json({ message: `Application is already ${provider.status}.` });
            }

            // --- Generate a random password (8 characters) ---
            // WARNING: In a production environment, you should HASH this password before saving it.
            const generateRandomPassword = () => crypto.randomBytes(4).toString('hex'); // Generates an 8-character hex string
            const generatedPassword = generateRandomPassword();

            // --- Update status and set password ---
            provider.status = 'Approved';
            provider.password = generatedPassword; // Store the generated password (HASH THIS!)
            provider.approvedAt = new Date(); // Set approval timestamp
            provider.rejectedAt = undefined; // Clear rejection timestamp if it was set

            await provider.save();
            console.log(`Provider application approved and password set for ID: ${providerId}`);

            // --- Send Email with Login Details to the Service Provider ---
            const mailOptions = {
                from: 'maleksehban4@gmail.com', // Replace with your actual email
                to: provider.email, // Send email to the approved provider
                subject: 'Your Service Provider Application Has Been Approved!',
                text: `
Dear ${provider.ownerFullName},

Good news! Your application to become a service provider on our platform has been approved.

You can now log in to your provider dashboard using the following details:
Username (Email): ${provider.email}
Your Password: ${generatedPassword}

[Link to Provider Login Page - You'll need to create this]

Please keep your password secure. You can change it after logging in.

Welcome aboard!

Best regards,
The Travel Booking Platform Team
`,
                html: `
<p>Dear ${provider.ownerFullName},</p>
<p>Good news! Your application to become a service provider on our platform has been approved.</p>
<p>You can now log in to your provider dashboard using the following details:</p>
<p><strong>Username (Email):</strong> ${provider.email}</p>
<p><strong>Your Password:</strong> ${generatedPassword}</p>
<p><a href="http://localhost:3000/service-provider-login">Click here to log in to your dashboard</a></p>
<p>Please keep your password secure. You can change it after logging in.</p>
<p>Welcome aboard!</p>
<p>Best regards,<br>The Travel Booking Platform Team</p>
`
            };

            // Send the email
            await transporter.sendMail(mailOptions); // This is the line that might cause ETIMEDOUT
            console.log(`Approval email with password sent to service provider: ${provider.email}`);


            res.json({ message: 'Provider application approved, password set, and email sent.' });

        } catch (err) {
            console.error('Error approving provider application:', err);
            if (err.name === 'CastError') {
                return res.status(400).json({ error: "Invalid Provider ID format." });
            }
            // This catch block will be hit if Nodemailer fails (ETIMEDOUT)
            res.status(500).json({ error: 'Failed to approve application.', details: err.message });
        }
    });

    // --- END NEW ENDPOINT ---

    // --- NEW ENDPOINT: Reject Service Provider Application (For Admin) - UPDATED with timestamp ---
    app.post('/api/admin/providers/:providerId/reject', async (req, res) => {
        console.log(`Backend received POST request to reject provider application for ID: ${req.params.providerId}`);
        const providerId = req.params.providerId;

        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            return res.status(400).json({ error: "Invalid Provider ID format." });
        }

        try {
            // Find the provider application
            const provider = await ServiceProvider.findById(providerId);

            if (!provider) {
                console.log(`Provider application not found for ID: ${providerId} during rejection.`);
                return res.status(404).json({ message: 'Provider application not found.' });
            }

            // Check if already approved or rejected
            if (provider.status !== 'Pending') {
                return res.status(400).json({ message: `Application is already ${provider.status}.` });
            }

            // --- Update status to 'Rejected' ---
            provider.status = 'Rejected';
            // Clear password field if it was somehow set prematurely (shouldn't happen with new flow)
            provider.password = undefined;
            provider.rejectedAt = new Date(); // Set rejection timestamp
            provider.approvedAt = undefined; // Clear approval timestamp

            await provider.save();
            console.log(`Provider application rejected for ID: ${providerId}`);

            // --- Optional: Send Email Notification to the Service Provider about rejection ---
            const mailOptions = {
                from: 'maleksehban4@gmail.com', // Replace with your email
                to: provider.email, // Send email to the rejected provider
                subject: 'Your Service Provider Application Status',
                text: `
Dear ${provider.name},

We regret to inform you that your application to become a service provider on our platform has been rejected.

If you have any questions or would like to appeal this decision, please contact us.

Thank you for your interest.

Best regards,
The [Your Website Name] Team
`,
            };

            // Send the email
            await transporter.sendMail(mailOptions);
            console.log(`Rejection email sent to service provider: ${provider.email}`);


            res.json({ message: 'Provider application rejected.' });

        } catch (err) {
            console.error('Error rejecting provider application:', err);
            if (err.name === 'CastError') {
                return res.status(400).json({ error: "Invalid Provider ID format." });
            }
            res.status(500).json({ error: 'Failed to reject application.', details: err.message });
        }
    });
    app.get('/api/admin/service-providers', async (req, res) => {
        console.log("Backend received GET request for all service providers with services (Admin)");
        try {
            // Find all service providers
            const serviceProviders = await ServiceProvider.find({}).select('-password'); // Exclude passwords

            // Manually populate services for each provider based on their serviceType
            const providersWithServices = await Promise.all(serviceProviders.map(async (provider) => {
                let services = [];
                if (provider.serviceType === 'Accommodation') {
                    services = await Accommodation.find({ providerId: provider._id }).populate('rooms'); // Populate rooms here too
                } else if (provider.serviceType === 'Transportation') {
                    services = await Transportation.find({ providerId: provider._id });
                } else if (provider.serviceType === 'Sport Adventure') {
                    services = await SportAdventure.find({ providerId: provider._id });
                }
                // Return provider object with services added as a new property
                return {
                    ...provider.toObject(), // Convert Mongoose document to plain object
                    services: services
                };
            }));


            console.log(`Found ${providersWithServices.length} service providers.`);
            res.json(providersWithServices);

        } catch (err) {
            console.error('Error fetching all service providers with services:', err);
            res.status(500).json({ error: 'Failed to fetch service providers.', details: err.message });
        }
    });
    // --- END NEW ENDPOINT ---


    // --- NEW ENDPOINT: Send OTP for Super Admin Password Change ---
    app.post('/api/admin/:adminId/send-otp-password-change', async (req, res) => {
        console.log(`Backend received POST request to send OTP for password change for admin ID: ${req.params.adminId}`);
        const adminId = req.params.adminId;
        const { currentPassword } = req.body; // Only need current password to verify identity

        // Basic input validation
        if (!currentPassword) {
            return res.status(400).json({ error: 'Current password is required.' });
        }

        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({ error: "Invalid Admin ID format." });
        }

        try {
            // Find the admin
            const admin = await SuperAdmin.findById(adminId);
            if (!admin) {
                console.log(`Admin not found for ID: ${adminId} when sending OTP.`);
                return res.status(404).json({ message: 'Admin not found.' });
            }

            // Compare the provided password with the stored plain text password (as requested)
            // WARNING: This is insecure. Use hashed passwords in production.
            // This is done as per your explicit instruction to NOT use bcrypt.
            // For production, ALWAYS use bcrypt or a similar hashing library.
            if (currentPassword !== admin.password) {
                console.log(`Send OTP failed: Incorrect current password for admin ID: ${adminId}`);
                return res.status(401).json({ error: 'Incorrect current password.' });
            }

            // --- Generate and Store OTP ---
            const otp = crypto.randomInt(100000, 999999).toString(); // 6-digit OTP
            const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

            admin.otp = otp;
            admin.otpExpires = otpExpiry;
            await admin.save();
            console.log(`OTP generated and stored for admin ID: ${adminId}`);

            // --- Send OTP via Email ---
            const mailOptions = {
                from: 'maleksehban4@gmail.com', // Replace with your actual email
                to: admin.email, // Send OTP to the admin's registered email
                subject: 'Your OTP for Password Change',
                text: `
Dear Admin,

You requested to change your password. Your One-Time Password (OTP) is:

${otp}

This OTP is valid for the next 10 minutes. Please use it to complete your password change.

If you did not request a password change, please ignore this email.

Best regards,
The [Your Website Name] Team
`,
            };

            // Send the email
            await transporter.sendMail(mailOptions);
            console.log(`OTP email sent to ${admin.email} for admin ID: ${adminId}`);

            res.status(200).json({ message: 'OTP sent to your email. Please check your inbox.' });

        } catch (err) {
            console.error('Error sending OTP for password change:', err);
            res.status(500).json({ error: 'Failed to send OTP. Please try again later.', details: err.message });
        }
    });


    // --- NEW ENDPOINT: Verify OTP and Change Super Admin Password ---
    app.put('/api/admin/:adminId/verify-otp-and-change-password', async (req, res) => {
        console.log(`Backend received PUT request to verify OTP and change password for admin ID: ${req.params.adminId}`);
        const adminId = req.params.adminId; // Correctly access adminId from params
        const { otp, newPassword } = req.body; // Expect OTP and new password

        if (!otp || !newPassword) {
            return res.status(400).json({ error: 'OTP and new password are required.' });
        }

        // Validate new password length (as requested)
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password length must be at least 8 characters.' });
        }


        if (!mongoose.Types.ObjectId.isValid(adminId)) {
            return res.status(400).json({ error: "Invalid Admin ID format." });
        }

        try {
            // Find the admin
            const admin = await SuperAdmin.findById(adminId);
            if (!admin) {
                console.log(`Admin not found for ID: ${adminId} during OTP verification.`);
                return res.status(404).json({ message: 'Admin not found.' });
            }

            // --- Verify OTP and Expiry ---
            if (!admin.otp || admin.otp !== otp) {
                console.log(`OTP verification failed: Invalid OTP for admin ID: ${adminId}`);
                // Clear OTP fields on incorrect attempt for security
                admin.otp = undefined;
                admin.otpExpires = undefined;
                await admin.save();
                return res.status(400).json({ error: 'Invalid OTP.' });
            }

            if (admin.otpExpires < new Date()) {
                console.log(`OTP verification failed: OTP expired for admin ID: ${adminId}`);
                // Clear OTP fields on expiry
                admin.otp = undefined;
                admin.otpExpires = undefined;
                await admin.save();
                return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
            }

            // If OTP is valid and not expired, update the password
            // WARNING: Still storing plain text password. HASH THIS IN PRODUCTION!
            admin.password = newPassword;
            // Clear OTP fields after successful password change
            admin.otp = undefined;
            admin.otpExpires = undefined;

            await admin.save();
            console.log(`Password changed successfully for admin ID: ${adminId}`);

            res.json({ message: 'Password changed successfully.' });

        } catch (err) {
            console.error('Error verifying OTP and changing password:', err);
            res.status(500).json({ error: 'Failed to change password.', details: err.message });
        }
    });
    // --- NEW: Admin Get Single Service Provider Application Details ---
    app.get('/api/admin/service-provider-applications/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const application = await ServiceProvider.findById(id).select('-password'); // Exclude password
            if (!application) {
                return res.status(404).json({ error: 'Application not found.' });
            }
            res.json(application);
        } catch (err) {
            console.error('Error fetching single service provider application:', err);
            if (err.name === 'CastError') {
                return res.status(400).json({ error: "Invalid application ID format." });
            }
            res.status(500).json({ error: 'Failed to fetch application details.', details: err.message });
        }
    });
    // --- Super Admin Login Route ---
    app.post('/api/admin/login', async (req, res) => {
        console.log("Backend received POST request for Super Admin login");
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        try {
            // 1. Find the super admin by email
            const superAdmin = await SuperAdmin.findOne({ email: email.toLowerCase() }); // Use lowercase for lookup

            // If super admin not found
            if (!superAdmin) {
                // Use a generic error message for security (don't reveal if email exists)
                console.log(`Super Admin login failed: User not found for email: ${email}`);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 2. Compare the provided password with the stored plain text password (as requested)
            // WARNING: Storing and comparing plain text passwords is NOT secure.
            // This is done as per your explicit instruction to NOT use bcrypt.
            // For production, ALWAYS use bcrypt or a similar hashing library.
            if (password !== superAdmin.password) {
                // Use a generic error message for security
                console.log(`Super Admin login failed: Incorrect password for email: ${email}`);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // 3. If credentials are valid
            console.log(`Super Admin login successful for email: ${email}`);
            // Successful login - You might want to implement session management or JWT here
            // For this example, we'll just send a success status.
            // In a real application, you'd generate a token and send it back.

            // Example: Generate a JWT (requires a library like jsonwebtoken)
            // const jwt = require('jsonwebtoken');
            // const token = jwt.sign({ id: superAdmin._id, role: 'superadmin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
            // res.status(200).json({ message: 'Login successful', token: token });

            // Simple success response for now
            res.status(200).json({ message: 'Login successful', adminId: superAdmin._id }); // Optionally send admin ID

        } catch (err) {
            console.error('Server error during admin login:', err);
            res.status(500).json({ error: 'Server error during login' });
        }
    });


    // 🔹 Get All Business Inquiries (Likely for Admin)
    app.get("/api/business-inquiries", async (req, res) => {
        console.log("Backend received GET request for all business inquiries");
        try {
            const inquiries = await BusinessInquiry.find();
            console.log(`Found ${inquiries.length} business inquiries.`);
            res.json(inquiries);
        } catch (error) {
            console.error("Error fetching business inquiries:", error);
            res.status(500).json({ error: "Internal Server Error", details: error.message });
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
}



function startExpressServer() {

    // Log current directory info for debugging on Render or locally
    console.log(`Current working directory (on Render): ${__dirname}`);

    const imagesPath = path.join(__dirname, 'src', 'images');
    const documentsPath = path.join(__dirname, 'src', 'documents');
    const buildPath = path.join(__dirname, 'build');

    console.log(`Serving static images from: ${imagesPath}`);
    console.log(`Serving static documents from: ${documentsPath}`);
    console.log(`Serving React build from: ${buildPath}`);

    if (!fs.existsSync(imagesPath)) {
        console.warn(`⚠️ WARNING: Images directory does not exist at: ${imagesPath}`);
    }
    if (!fs.existsSync(documentsPath)) {
        console.warn(`⚠️ WARNING: Documents directory does not exist at: ${documentsPath}`);
    }
    if (!fs.existsSync(buildPath)) {
        console.error(`❌ ERROR: React build directory does not exist at: ${buildPath}. Did you run 'npm run build'?`);
    }

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // 🔽 Register API Routes (make sure these are declared before static serving)
    registerGeneralRoutes(app);
    registerServiceProviderRoutes(app);
    registerAdminRoutes(app);

    // 🔽 Serve Static Folders
    app.use('/images', express.static(imagesPath));
    app.use('/documents', express.static(documentsPath));
     app.use(express.static(buildPath));

    // React fallback handler
    app.use((req, res, next) => {
        const indexPath = path.join(buildPath, 'index.html');
        if (req.method === 'GET' && fs.existsSync(indexPath) && !req.url.startsWith('/api')) {
            console.log(`➡️ Serving index.html for: ${req.url} from ${indexPath}`);
            return res.sendFile(indexPath);
        }
        next(); // For unmatched API routes or other errors
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
    });
}




// --- Check if this file is being run directly ---
if (require.main === module) {
    console.log("server.js is being run as the main module. Starting server...");
    startExpressServer();
} else {
    console.log("server.js is being required as a module. Exporting app instance.");
    module.exports = app;
}