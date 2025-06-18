import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * This component protects admin routes by checking if the admin is logged in.
 * If not authenticated, it redirects to the admin login page.
 */
const AdminProtectedRoute = ({ children }) => {
  const isAdminLoggedIn = localStorage.getItem('adminEmail'); // adjust if you use a different key

  if (!isAdminLoggedIn) {
    // Redirect unauthenticated users to admin login
    return <Navigate to="/admin_login" replace />;
  }

  // Allow access if admin is logged in
  return children;
};

export default AdminProtectedRoute;
