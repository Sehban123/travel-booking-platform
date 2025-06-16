// --- NEW: Admin Get All Pending Service Provider Applications ---
// app.get('/api/admin/pending-provider-applications', async (req, res) => {
//     try {
//         const pendingApplications = await ServiceProvider.find({ status: 'Pending' }).select('-password'); // Exclude password
//         console.log(`Found ${pendingApplications.length} pending service provider applications.`);
//         res.json(pendingApplications);
//     } catch (err) {
//         console.error('Error fetching pending service provider applications:', err);
//         res.status(500).json({ error: 'Failed to fetch pending applications.', details: err.message });
//     }
// });

// // --- NEW: Admin Reject Service Provider Application ---
// app.put('/api/admin/service-provider-applications/:id/reject', async (req, res) => {
//     const { id } = req.params;
//     const { adminId, remarks } = req.body; // Assuming adminId is passed for 'verifiedBy'

//     try {
//         const provider = await ServiceProvider.findById(id);
//         if (!provider) {
//             return res.status(404).json({ error: 'Service provider application not found.' });
//         }
//         if (provider.status !== 'Pending') {
//             return res.status(400).json({ error: `Application is already ${provider.status}.` });
//         }

//         provider.status = 'Rejected';
//         provider.verifiedBy = adminId || 'Admin'; // Assign admin ID or a default
//         provider.verificationDate = new Date();
//         provider.remarks = remarks || 'Rejected by admin.';
//         // No password or payment status changes on rejection

//         await provider.save();
//         console.log(`Service Provider Application Rejected for ID: ${id}.`);

//         // --- Send Email Notification to the Service Provider ---
//         const mailOptions = {
//             from: 'maleksehban4@gmail.com', // Replace with your email
//             to: provider.email,
//             subject: 'Your Service Provider Application Status',
//             html: `
//                 <p>Dear ${provider.ownerFullName},</p>
//                 <p>We regret to inform you that your application to become a service provider on our platform has been <strong>rejected</strong>.</p>
//                 <p>Reason: ${remarks || 'No specific reason provided.'}</p>
//                 <p>If you have any questions or would like to appeal this decision, please contact us.</p>
//                 <p>Thank you for your interest.</p>
//                 <p>Best regards,<br>The [Your Website Name] Team</p>
//             `,
//         };

//         await transporter.sendMail(mailOptions);
//         console.log(`Rejection email sent to service provider: ${provider.email}`);

//         res.json({ message: 'Application rejected successfully.' });

//     } catch (err) {
//         console.error('Error rejecting service provider application:', err);
//         if (err.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid application ID format." });
//         }
//         res.status(500).json({ error: 'Failed to reject application.', details: err.message });
//     }
// });


// // --- NEW: Admin Approve Service Provider Application ---
// app.put('/api/admin/service-provider-applications/:id/approve', async (req, res) => {
//     const { id } = req.params;
//     const { adminId, remarks } = req.body; // Assuming adminId is passed for 'verifiedBy'

//     try {
//         const provider = await ServiceProvider.findById(id);
//         if (!provider) {
//             return res.status(404).json({ error: 'Service provider application not found.' });
//         }
//         if (provider.status !== 'Pending') {
//             return res.status(400).json({ error: `Application is already ${provider.status}.` });
//         }

//         // Generate a temporary password
//         const generateRandomPassword = () => crypto.randomBytes(4).toString('hex'); // Generates an 8-character hex string
//         const tempPassword = generateRandomPassword();
//         // In a real application, you would hash this password (e.g., with bcrypt)
//         // For this example, we're storing it plain for simplicity (NOT RECOMMENDED FOR PRODUCTION)
//         provider.password = tempPassword;
//         provider.status = 'Approved';
//         provider.verifiedBy = adminId || 'Admin'; // Assign admin ID or a default
//         provider.verificationDate = new Date();
//         provider.remarks = remarks || 'Approved by admin.';
//         provider.paymentStatus = 'Pending'; // Set payment status to pending after approval

//         await provider.save();
//         console.log(`Service Provider Application Approved for ID: ${id}. Temp password generated.`);

//         // --- Send Email Notification to the Service Provider ---
//         const mailOptions = {
//             from: 'maleksehban4@gmail.com', // Replace with your email
//             to: provider.email,
//             subject: 'Your Service Provider Application Has Been Approved!',
//             html: `
//                 <p>Dear ${provider.ownerFullName},</p>
//                 <p>Good news! Your application to become a service provider on our platform has been <strong>approved</strong>.</p>
//                 <p>Your temporary password for login is: <strong>${tempPassword}</strong></p>
//                 <p>Please log in to your dashboard using your email (${provider.email}) and this temporary password. You will be prompted to complete the payment step after logging in.</p>
//                 <p>After successful payment, you can set your permanent password and start managing your services.</p>
//                 <p>Thank you for joining us!</p>
//                 <p>Best regards,<br>The [Your Website Name] Team</p>
//             `,
//         };

//         await transporter.sendMail(mailOptions);
//         console.log(`Approval email sent to service provider: ${provider.email}`);

//         res.json({ message: 'Application approved successfully. Temporary password sent to provider via email.' });

//     } catch (err) {
//         console.error('Error approving service provider application:', err);
//         if (err.name === 'CastError') {
//             return res.status(400).json({ error: "Invalid application ID format." });
//         }
//         res.status(500).json({ error: 'Failed to approve application.', details: err.message });
//     }
// });
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

// 🔹 Route to GET a single Sport Adventure by ID
app.get("/api/sports-adventures/:id", async (req, res) => {
    console.log(`Backend received GET request for /api/sports-adventures/${req.params.id}`);
    try {
        const adventureId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(adventureId)) {
            console.error("Backend received invalid ObjectId format for sport adventure:", adventureId);
            return res.status(400).json({ error: "Invalid Sport Adventure ID format provided." });
        }

        const adventure = await SportAdventure.findById(adventureId);

        if (!adventure) {
            console.log("Sport Adventure not found for ID:", adventureId);
            return res.status(404).json({ message: "Sport Adventure not found" });
        }

        console.log("Found Sport Adventure:", adventure._id);
        res.json(adventure);

    } catch (error) {
        console.error("Error fetching single sport adventure by _id:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// --- NEW: Service Provider Login ---
app.post('/api/provider/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        const provider = await ServiceProvider.findOne({ email });

        if (!provider) {
            return res.status(401).json({ error: 'Invalid credentials or account not found.' });
        }

        // Check password (NOT hashed for this example, but should be in production)
        if (password !== provider.password) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Check application status
        if (provider.status === 'Pending') {
            return res.status(403).json({ error: 'Your application is pending review. Please wait for approval.' });
        }
        if (provider.status === 'Rejected') {
            return res.status(403).json({ error: 'Your application has been rejected. Please contact support.' });
        }

        // Check payment status (if payment is required)
        if (provider.paymentStatus === 'Pending') {
            // If payment is pending, redirect them to a payment page or instruct them to pay
            return res.status(202).json({
                message: 'Login successful, but payment is pending. Please complete your payment.',
                providerId: provider._id,
                serviceType: provider.serviceType, // Add serviceType to response
                paymentRequired: true
            });
        }

        // If status is Approved and paymentStatus is Paid (or Skipped)
        console.log(`Service Provider login successful for email: ${email}`);
        res.status(200).json({
            message: 'Login successful.',
            providerId: provider._id,
            serviceType: provider.serviceType,
            paymentRequired: false // No payment required for this login
        });

    } catch (err) {
        console.error('Server error during provider login:', err);
        res.status(500).json({ error: 'Server error during login.' });
    }
});
app.post('/api/service-provider-applications', upload, async (req, res) => {
    // 'upload' middleware handles parsing multipart/form-data and populating req.files and req.body

    // Check if files were uploaded and get their filenames
    const servicePhotosFilename = req.files['servicePhotos'] ? req.files['servicePhotos'][0].filename : null;
    const aadharPanCardFilename = req.files['aadharPanCard'] ? req.files['aadharPanCard'][0].filename : null;
    const businessRegistrationCertificateFilename = req.files['businessRegistrationCertificate'] ? req.files['businessRegistrationCertificate'][0].filename : null;
    const bankAccountDetailsFilename = req.files['bankAccountDetails'] ? req.files['bankAccountDetails'][0].filename : null;
    const gstNumberFilename = req.files['gstNumber'] ? req.files['gstNumber'][0].filename : null;

    const {
        businessName, ownerFullName, serviceType, businessRegistrationNumber,
        phoneNumber, whatsappNumber, email, alternateContactPerson,
        fullBusinessAddress, state, city, pinCode, websiteSocialMediaLink,
        preferredModeOfContact,
        // Specific service detail fields are no longer expected directly from req.body for signup
        // They are now handled in the dashboard forms.
    } = req.body;

    // Basic validation for common required fields
    if (!businessName || !ownerFullName || !serviceType || !phoneNumber || !email || !fullBusinessAddress || !state || !city || !pinCode || !preferredModeOfContact || !aadharPanCardFilename || !bankAccountDetailsFilename) {
        // Clean up uploaded files if validation fails
        if (req.files) {
            for (const key in req.files) {
                req.files[key].forEach(file => {
                    fs.unlink(file.path, (err) => {
                        if (err) console.error('Error deleting file:', file.path, err);
                    });
                });
            }
        }
        return res.status(400).json({ error: 'Missing required basic information or mandatory documents.' });
    }

    try {
        // Check if a service provider with this email already exists
        const existingProvider = await ServiceProvider.findOne({ email });
        if (existingProvider) {
            // Clean up uploaded files if email already exists
            if (req.files) {
                for (const key in req.files) {
                    req.files[key].forEach(file => {
                        fs.unlink(file.path, (err) => {
                            if (err) console.error('Error deleting file:', file.path, err);
                        });
                    });
                }
            }
            return res.status(409).json({ error: 'An application with this email already exists.' });
        }

        let newServiceProviderData = {
            businessName, ownerFullName, serviceType, businessRegistrationNumber,
            phoneNumber, whatsappNumber, email, alternateContactPerson,
            fullBusinessAddress, state, city, pinCode, websiteSocialMediaLink,
            preferredModeOfContact,
            aadharPanCard: aadharPanCardFilename,
            bankAccountDetails: bankAccountDetailsFilename,
            gstNumber: gstNumberFilename, // Optional
            servicePhotos: servicePhotosFilename, // Optional, depending on service type
            status: 'Pending', // Default status
            applicationDate: new Date(),
            // Initialize service details as empty objects for the signup application
            accommodationDetails: {},
            transportationDetails: {},
            sportAdventureDetails: {},
        };

        // No need to process specific service details from req.body here anymore
        // as they are removed from the signup form.

        const newServiceProvider = new ServiceProvider(newServiceProviderData);
        await newServiceProvider.save();

        console.log('New Service Provider Application Submitted:', newServiceProvider.email);
        res.status(201).json({ message: 'Application submitted successfully! Please await admin review.', providerId: newServiceProvider._id });

    } catch (err) {
        console.error('Error submitting service provider application:', err);
        // Clean up uploaded files if an error occurs during database save
        if (req.files) {
            for (const key in req.files) {
                req.files[key].forEach(file => {
                    fs.unlink(file.path, (err) => {
                        if (err) console.error('Error deleting file (cleanup):', file.path, err);
                    });
                });
            }
        }
        res.status(500).json({ error: 'Failed to submit application.', details: err.message });
    }
});
app.post("/api/bookings/accommodation", async (req, res) => {
    console.log("Received POST request for Accommodation Booking:", req.body);
    const {
        accommodationId,
        roomId, // Make sure roomId is sent from the frontend
        accommodationName,
        roomNumber,
        roomType,
        pricePerNight,
        user_name,
        user_mobile,
        user_email,
        check_in_date,
        check_out_date,
        total_guests,
        duration, // Calculated on frontend
        total_price // Calculated on frontend
    } = req.body;

    // Basic validation
    if (!accommodationId || !roomId || !accommodationName || !roomNumber || !roomType ||
        typeof pricePerNight !== 'number' || pricePerNight <= 0 ||
        !user_name || !user_mobile || !user_email || !check_in_date || !check_out_date ||
        total_guests < 1 || total_price <= 0) {
        return res.status(400).json({ error: "Missing required fields for accommodation booking." });
    }

    if (!mongoose.Types.ObjectId.isValid(accommodationId)) {
        return res.status(400).json({ error: "Invalid Accommodation ID format." });
    }
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({ error: "Invalid Room ID format." });
    }

    try {
        // Optional: Verify if accommodation and room exist and are available
        const accommodation = await Accommodation.findById(accommodationId);
        if (!accommodation) {
            return res.status(404).json({ error: "Accommodation not found." });
        }
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: "Selected room not found." });
        }

        const newBooking = new Booking({
            accommodationId,
            roomId,
            accommodationName,
            roomNumber,
            roomType,
            pricePerNight,
            user_name,
            user_mobile,
            user_email,
            check_in_date: new Date(check_in_date),
            check_out_date: new Date(check_out_date),
            total_guests,
            duration,
            total_price
        });

        await newBooking.save();
        console.log("Accommodation booking successfully created:", newBooking._id);
        res.status(201).json({ message: "Accommodation booking confirmed successfully!", booking: newBooking });
    } catch (error) {
        console.error("Error creating accommodation booking:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ error: "Validation failed", details: messages.join(', ') });
        }
        res.status(500).json({ error: "Failed to create accommodation booking.", details: error.message });
    }
});
