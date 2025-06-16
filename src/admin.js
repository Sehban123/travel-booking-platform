// --- NEW ADMIN SUMMARY ENDPOINTS (COUNTS) ---
// Get counts for all data categories
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
// --- END NEW ENDPOINT ---

// --- NEW ENDPOINT: Get All Service Providers with Populated Services (For Admin) ---
// This endpoint is fine as is, it now includes the 'status' field implicitly.
// We might want a separate endpoint for *only* pending providers for the new admin view.
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