// src/components/Admin/AdminSidebar.js
import React from 'react';
import './css/AdminSidebar.css'; // Create this CSS file

const AdminSidebar = ({ onNavigate, currentModule }) => {
  return (
    <div className="admin-sidebar">
      <h2>Admin Panel</h2>
      <ul>
        {/* --- New: Link to Dashboard Summary --- */}
        <li className={currentModule === 'summary' ? 'active' : ''}>
          <button onClick={() => onNavigate('summary')}>Dashboard Summary</button>
        </li>
        {/* Navigation links for different admin views */}
        <li className={currentModule === 'accommodation' ? 'active' : ''}>
          <button onClick={() => onNavigate('accommodation')}>Accommodations</button>
        </li>
        <li className={currentModule === 'transport' ? 'active' : ''}>
          <button onClick={() => onNavigate('transport')}>Transportation</button>
        </li>
        <li className={currentModule === 'sport' ? 'active' : ''}>
          <button onClick={() => onNavigate('sport')}>Sport Adventures</button>
        </li>
         <li className={currentModule === 'inquiry' ? 'active' : ''}>
          <button onClick={() => onNavigate('inquiry')}>Business Inquiries</button>
        </li>
        {/* --- Service Provider Management Links --- */}
         <li className={currentModule === 'service-providers' ? 'active' : ''}>
          <button onClick={() => onNavigate('service-providers')}>All Service Providers</button>
        </li>
         <li className={currentModule === 'pending-providers' ? 'active' : ''}>
          <button onClick={() => onNavigate('pending-providers')}>Pending Providers</button>
        </li>
        {/* --- Removed Change Password Link --- */}
        {/* <li className={currentModule === 'admin-change-password' ? 'active' : ''}>
          <button onClick={() => onNavigate('admin-change-change-password')}>Change Password</button>
        </li> */}
        {/* Add other admin links here (e.g., Users, Bookings Overview) */}
      </ul>
    </div>
  );
};

export default AdminSidebar;
