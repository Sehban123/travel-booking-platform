// src/components/BusinessTravel.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import './css/BusinessTravel.css';

const BusinessTravel = () => {
  return (
    <div className="business-travel-container">
      <h1>Business Travel Solutions</h1>

      <p>
        Welcome to our Business Travel hub. We understand the unique needs of corporate travelers,
        and we're here to make your business trips efficient, comfortable, and productive.
      </p>

      <div className="business-features">
        <div className="feature-card">
          <h3>Tailored Accommodation</h3>
          <p>Access to hotels with business centers, meeting facilities, and reliable high-speed internet in key business locations.</p>
        </div>
        <div className="feature-card">
          <h3>Flexible Transportation</h3>
          <p>Book flights, trains, and car rentals with flexible options to suit your schedule. Airport transfers available.</p>
        </div>
        <div className="feature-card">
          <h3>Streamlined Booking</h3>
          <p>Efficient booking process designed for business needs. (Future: Corporate accounts & centralized billing options).</p>
        </div>
         <div className="feature-card">
          <h3>Dedicated Support</h3>
          <p>Get assistance for your travel arrangements from our dedicated support team.</p>
        </div>
      </div>

      <div className="corporate-inquiry">
        <h2>Planning a Corporate Event or Executive Trip?</h2>
        <p>
          Tell us about your requirements, and we'll help you create a tailored package including
          Travel, Accommodation, Transport, Venue Booking, and more.
        </p>
        {/* --- Link to the Business Inquiry Form --- */}
        <Link to="/business/inquiry" className="inquiry-button">
            Submit an Inquiry
        </Link>
      </div>

       {/* Optional: Link back to general services or highlight relevant sections */}
       <div className="business-links">
            <p>Explore our standard <a href="/">Accommodation options</a> or <a href="/transportation">Transportation services</a> which can be included in business packages.</p>
       </div>

    </div>
  );
};

export default BusinessTravel;