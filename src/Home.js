import React from 'react';
// Assuming you have lucide-react installed for icons
import { Hotel, Car, Mountain, Briefcase, Handshake } from 'lucide-react';
// Import the new external CSS file
import './css/Home.css';

// Home Page Component
const HomePage = () => {
  return (
    // Use a main container class for external styling
    <div className="home-page-container">
      {/* Hero Section */}
      <div className="hero-section">
        <h1 className="hero-title">
          Your Gateway to Incredible Travel Experiences
        </h1>
        <p className="hero-subtitle">
          Discover, Book, and Explore with Ease. We connect you to the best Accommodation, Transportation, and Adventures.
        </p>
        {/* Example Call to Action Button */}
        <a
          href="/accommodations" // Placeholder link
          className="explore-button"
        >
          Start Exploring Now
        </a>
      </div>

      {/* Services Section */}
      <div className="services-section">
        {/* Accommodation Card */}
        <div className="service-card">
          {/* Icons remain as inline components */}
          <Hotel size={48} className="service-icon text-blue-500" />
          <h3 className="service-title">Accommodation</h3>
          <p className="service-description">
            Find the perfect place to stay, from cozy homestays to luxurious hotels and resorts. Book with confidence.
          </p>
          <a
            href="/accommodations" // Placeholder link
            className="service-link text-blue-600"
          >
            View Accommodations
          </a>
        </div>

        {/* Transportation Card */}
        <div className="service-card">
          <Car size={48} className="service-icon text-green-500" />
          <h3 className="service-title">Transportation</h3>
          <p className="service-description">
            Arrange hassle-free travel with our reliable transportation options, including taxis, cars, and more.
          </p>
          <a
            href="/transportation" // Placeholder link
            className="service-link text-green-600"
          >
            Find Transport
          </a>
        </div>

        {/* Sport Adventures Card */}
        <div className="service-card">
          <Mountain size={48} className="service-icon text-red-500" />
          <h3 className="service-title">Sport Adventures</h3>
          <p className="service-description">
            Embark on thrilling sport adventures and activities. Experience the excitement of the outdoors.
          </p>
          <a
            href="/sports-adventure" // Placeholder link
            className="service-link text-red-600"
          >
            Explore Adventures
          </a>
        </div>

        {/* Business Tours Card */}
        <div className="service-card">
          <Briefcase size={48} className="service-icon text-purple-500" />
          <h3 className="service-title">Business Tours & Events</h3>
          <p className="service-description">
            Plan seamless corporate travel, meetings, and events with our dedicated business inquiry service.
          </p>
          <a
            href="/business/inquiry" // Placeholder link to your business inquiry form
            className="service-link text-purple-600"
          >
            Submit Business Inquiry
          </a>
        </div>
      </div>

      {/* Become a Service Provider Section */}
      <div className="provider-section">
        <Handshake size={48} className="provider-icon text-blue-700" />
        <h3 className="provider-title">Become a Service Provider</h3>
        <p className="provider-description">
          Do you offer accommodation, transportation, or adventure services? Partner with us and reach a wider audience!
        </p>
        {/* Placeholder link - you'll need a dedicated page/form for this */}
        <a
          href="/service-provider-login" // Placeholder link
          className="provider-button"
        >
          Learn More & Partner
        </a>
      </div>
    </div>
  );
};

// Export the component with the new name
export default HomePage;
