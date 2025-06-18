// src/components/Admin/AdminSidebar.js
import React from 'react';
import './css/AdminSidebar.css';

const AdminSidebar = ({ onNavigate, currentModule, onLogout }) => {
  return (
    <div className="admin-sidebar">
      <h2>Admin Panel</h2>
      <ul>
        <li className={currentModule === 'summary' ? 'active' : ''}>
          <button onClick={() => onNavigate('summary')}>Dashboard Summary</button>
        </li>
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
        <li className={currentModule === 'service-providers' ? 'active' : ''}>
          <button onClick={() => onNavigate('service-providers')}>All Service Providers</button>
        </li>
        <li className={currentModule === 'pending-providers' ? 'active' : ''}>
          <button onClick={() => onNavigate('pending-providers')}>Pending Providers</button>
        </li>
      </ul>

      {/* ✅ Logout button outside the UL for semantic correctness */}
      <div className="admin-logout-button">
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to log out?")) {
              onLogout();
            }
          }}
          className="logout-btn"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
