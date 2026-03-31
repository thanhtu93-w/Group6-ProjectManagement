
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationCenter from "./NotificationCenter";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="logo">
          <span>T</span> TeamSync
        </Link>
      </div>
      <div className="navbar-right">
        <NotificationCenter />
        <div className="user-profile" ref={dropdownRef}>
          <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
            {user?.avatar ? (
              <img 
                src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`} 
                alt={user.name} 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              user?.name?.charAt(0)
            )}
          </div>
          {showDropdown && (
            <div className="user-dropdown">
              <div className="dropdown-user-info">
                <p className="username">{user?.name}</p>
                <p className="useremail">{user?.email}</p>
                <p className="userjob">{user?.jobTitle}</p>
              </div>
              <div className="dropdown-divider"></div>
              {user?.role === "admin" && (
                <Link to="/admin" className="dropdown-item admin-link" onClick={() => setShowDropdown(false)}>System Admin Panel</Link>
              )}
              <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>View Profile</Link>
              <button 
                onClick={() => {
                  logout();
                  setShowDropdown(false);
                }} 
                className="dropdown-item logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
