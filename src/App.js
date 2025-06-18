import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import axios from 'axios'; // Import axios here to set defaults
import { Navigate } from 'react-router-dom';

import Navbar from './Navbar'; // Assuming your Navbar is in ./Navbar.js
import HomePage from './Home'; // Import the HomePage component
import Accommodation from './Accommodation';
import AccommodationBooking from './AccommodationBooking';
import Transportation from './Transportation';
import TransportationBooking from './TransportationBooking';
import SportsAdventure from './SportsAdventure';
import SportAdventureBooking from './SportAdventureBooking';
import BusinessTravel from './BusinessTravel'; // Import BusinessTravel landing page
import BusinessInquiryForm from './BusinessInquiryForm'; // Import the new Inquiry Form component
import AdminDashboard from './AdminDashboard'; // Import the Admin Dashboard component
import ServiceProviderLoginPage from './ServiceProviderLogin';
import ServiceProviderDashboard from './ServiceproviderDashboard'; // Import the new ServiceProviderDashboard
import AdminLogin from './AdminLogin';
import CustomerLogin from './CustomerLogin'; // Your new combined customer auth component
import AdminProtectedRoute from './AdminProtectedRoute';

// Set axios to NOT send cookies with every request globally, as authentication is removed.
// This resolves the CORS error related to Access-Control-Allow-Credentials.
axios.defaults.withCredentials = false;

// Create a new component to handle layout and conditional Navbar rendering
const AppLayout = () => {
  const location = useLocation(); // Get the current location - now inside the Router context

  // --- NEW LOGGING FOR DEBUGGING NAVIGATION ---
  useEffect(() => {
    console.log("AppLayout: Current pathname changed to:", location.pathname);
    // You can also inspect the state passed with navigation if any:
    // console.log("AppLayout: Current location state:", location.state);
  }, [location.pathname]); // Re-run this effect whenever location.pathname changes

  // Define routes where the Navbar should NOT be shown
  const noNavbarRoutes = [
    '/provider-dashboard/:providerId',
    '/admin_dashboard',
    '/admin_login',
    '/service-provider-login',
    '/customer-login' // Assuming this is the route for your combined customer login/signup
  ];

  // Check if the current path is in the noNavbarRoutes array
  const showNavbar = !noNavbarRoutes.some(route => {
    // For routes with parameters, use a regex to match
    if (route.includes(':')) {
      const regex = new RegExp(`^${route.replace(/:\w+/g, '[^/]+')}$`);
      return regex.test(location.pathname);
    }
    return location.pathname === route;
  });
  const isAdminAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';

  return (
    <>
      {showNavbar && <Navbar />} {/* Conditionally render the Navbar */}
      <div className="main-content"> {/* Optional: Add a class for main content styling */}
        <Routes>
          {/* --- Public Routes --- */}
          <Route path="/" element={<HomePage />} />
          <Route path="/customer-login" element={<CustomerLogin />} />
          <Route path="/accommodations" element={<Accommodation />} />
          <Route path="/accommodation-booking/:accommodationId" element={<AccommodationBooking />} />
          <Route path="/transportation" element={<Transportation />} />
          <Route path="/transportation-booking/:transportId" element={<TransportationBooking />} />
          <Route path="/sports-adventure" element={<SportsAdventure />} />
          <Route path="/sports-booking/:activityId" element={<SportAdventureBooking />} />
          <Route path="/business" element={<BusinessTravel />} />
          <Route path="/business/inquiry" element={<BusinessInquiryForm />} />

          {/* ✅ Admin Routes */}
          <Route path="/admin_login" element={<AdminLogin />} />
          <Route
            path="/admin_dashboard"
            element={
              isAdminAuthenticated ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/admin_login" replace />
              )
            }
          />

          {/* ✅ Service Provider Routes */}
          <Route path="/service-provider-login" element={<ServiceProviderLoginPage />} />
          <Route path="/provider-dashboard/:providerId" element={<ServiceProviderDashboard />} />
        </Routes>




      </div>
    </>
  );
};


function App() {
  return (
    <Router>
      {/* Render the AppLayout component inside the Router */}
      <AppLayout />
    </Router>
  );
}

export default App;
