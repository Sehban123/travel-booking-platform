// src/components/Admin/AdminDashboard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Ensure correct imports for all components used in renderMainContent
import AdminSidebar from './AdminSidebar';
import AdminAccommodationList from './AdminAccommodationList';
import AdminAccommodationDetails from './AdminAccommodationDetails';
import AdminSportAdventureList from './AdminSportAdventureList';
import AdminSportAdventureDetails from './AdminSportAdventureDetails';
import AdminTransportationList from './AdminTransportationList';
import AdminTransportationDetails from './AdminTransportationDetails';
import AdminBusinessInquiryList from './AdminBusinessInquiryList';
// import AdminChangePassword from './AdminChangePassword'; // Removed import
import AdminProviderList from './AdminProviderList';
import AdminProviderServices from './AdminProviderServices';
import AdminPendingProviders from './AdminPendingProviders';
// --- New: Import the AdminSummaryDashboard component ---
import AdminSummaryDashboard from './AdminSummaryDashboard';


import './css/AdminDashboard.css'; // Ensure this CSS file exists

const AdminDashboard = () => {
  const navigate = useNavigate(); // Required for navigation

  // State to manage which component is currently displayed in the main area
  // Set initial state to 'summary'
  // Format: { module: 'summary' | 'accommodation' | 'sport' | 'transport' | 'inquiry' | 'service-providers' | 'pending-providers', view: 'list' | 'details' | 'provider-services', selectedId: null | string }
  const [currentView, setCurrentView] = useState({ module: 'summary', view: 'list', selectedId: null }); // Default view is now 'summary'

  // Function to handle sidebar navigation clicks
  const handleNavigate = (module) => {
    console.log("AdminDashboard: handleNavigate called with module:", module);
    // When navigating from the sidebar, always reset to the 'list' view for that module
    // and clear any selected ID.
    // For the 'summary' module, the view is implicitly 'list'
    setCurrentView({ module: module, view: 'list', selectedId: null });
  };

  // Function to handle clicking on an item in a list view (to show details)
  const handleShowDetails = (module, id) => {
     console.log("AdminDashboard: handleShowDetails called with module:", module, "and ID:", id);
     // Set the view to 'details' for the specific module and selected item ID
     setCurrentView({ module: module, view: 'details', selectedId: id });
  };

   // Function to handle viewing services for a specific provider (called from AdminProviderList)
   const handleViewProviderServices = (providerId) => {
       console.log("AdminDashboard: handleViewProviderServices called with providerId:", providerId);
       // This is a specific view for provider services, distinct from the main module lists
       // We set the module to 'service-providers' (as it's related) and the view to 'provider-services'
       setCurrentView({ module: 'service-providers', view: 'provider-services', selectedId: providerId });
   };


  // Function to go back to the list view from details or provider services
  const handleBackToList = () => {
     console.log("AdminDashboard: handleBackToList called. Current view:", currentView);
     // Determine which list to go back to based on the current module/view
     if (currentView.view === 'provider-services') {
         // If coming from provider services, go back to the All Service Providers list
         setCurrentView({ module: 'service-providers', view: 'list', selectedId: null });
     } else {
         // If coming from a module detail view, go back to that module's list
         setCurrentView(prev => ({ ...prev, view: 'list', selectedId: null }));
     }
  };

  // Render the appropriate component based on currentView state
  const renderMainContent = () => {
    const { module, view, selectedId } = currentView;
    console.log("AdminDashboard: renderMainContent - currentView:", currentView); // Log current view state

    // Use a single top-level switch statement based on the module
    switch (module) {
      // --- New: Case for Summary Dashboard ---
      case 'summary':
        return <AdminSummaryDashboard />;

      case 'accommodation':
        return view === 'list' ? (
          <AdminAccommodationList onShowDetails={(id) => handleShowDetails('accommodation', id)} />
        ) : (
          <AdminAccommodationDetails accommodationId={selectedId} onBackToList={handleBackToList} />
        );

      case 'transport':
        return view === 'list' ? (
          <AdminTransportationList onShowDetails={(id) => handleShowDetails('transport', id)} />
        ) : (
          <AdminTransportationDetails transportationId={selectedId} onBackToList={handleBackToList} />
        );

      case 'sport':
        return view === 'list' ? (
          <AdminSportAdventureList onShowDetails={(id) => handleShowDetails('sport', id)} />
        ) : (
          <AdminSportAdventureDetails adventureId={selectedId} onBackToList={handleBackToList} />
        );

      case 'inquiry':
        // Inquiry list doesn't have details view yet, so always render the list
        return <AdminBusinessInquiryList />;

      case 'service-providers':
        // This module handles both the list of all providers and the services for a specific provider
        return view === 'list' ? (
             // Pass the handleViewProviderServices function down to AdminProviderList
             <AdminProviderList onViewServices={handleViewProviderServices} />
        ) : view === 'provider-services' && selectedId ? (
             // Render the specific provider services component when view is 'provider-services'
             // Pass the selectedId (which is the providerId) and the back function
             <AdminProviderServices providerId={selectedId} onBackToList={handleBackToList} />
        ) : (
             // Fallback for service-providers module if view/selectedId is unexpected
             <div>Select a service provider from the list.</div>
        );

      case 'pending-providers':
        // This module renders the list of pending providers
        // It's a standalone list view
        return <AdminPendingProviders />;

      // --- Removed case for Admin Change Password ---
      // case 'admin-change-password':
      //   return <AdminChangePassword />;

      default:
        // Default message when no module is selected or recognized
        // This case should ideally not be reached if a default module is set in useState
        return <div>Select a module from the sidebar.</div>;
    }
  };

const handleLogout = () => {
  localStorage.removeItem('isAdminAuthenticated');
  navigate('/admin_login');
};
  return (
    <div className="admin-dashboard-container">
      {/* Pass the handleNavigate function and the current module state to the sidebar */}
      <AdminSidebar onNavigate={handleNavigate} currentModule={currentView.module} />
      <div className="admin-main-content">
        {renderMainContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
