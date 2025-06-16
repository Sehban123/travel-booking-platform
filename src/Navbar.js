import { NavLink } from 'react-router-dom';
import './css/Navbar.css';
import {
  FaBed,
  FaShuttleVan,
  FaMountain,
  FaBriefcase,
  FaRegUser 
} from 'react-icons/fa';
import { IoIosLogIn } from "react-icons/io";

const Navbar = () => {
  return (
    <nav className="nav">
      <h2 className="logo">Travel Booking</h2>
      <div className="nav-container">
        <div className="links">
          <NavLink
            to="/accommodations"
            className={({ isActive }) => isActive ? "link active" : "link"}
          >
            <FaBed className="icon" /> Accommodation
          </NavLink>
          <NavLink
            to="/transportation"
            className={({ isActive }) => isActive ? "link active" : "link"}
          >
            <FaShuttleVan className="icon" /> Transportation
          </NavLink>
          <NavLink
            to="/sports-adventure"
            className={({ isActive }) => isActive ? "link active" : "link"}
          >
            <FaMountain className="icon" /> Sport Adventure
          </NavLink>
          <NavLink
            to="/business"
            className={({ isActive }) => isActive ? "link active" : "link"}
          >
            <FaBriefcase className="icon" /> Business Tour
          </NavLink>
          
          <NavLink
            to="/login"
            className={({ isActive }) => isActive ? "link active" : "link"}
          >
            <IoIosLogIn className="icon" /> Login
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => isActive ? "link active" : "link"}
          >
            <FaRegUser className="icon" /> Dashboard
          </NavLink>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
