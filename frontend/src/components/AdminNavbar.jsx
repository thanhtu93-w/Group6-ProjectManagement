
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminNavbar.css";

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-nav-left">
        <div className="admin-logo">
          <span>T</span> TeamSync <small>SYSTEM ADMIN</small>
        </div>
      </div>
      <div className="admin-nav-right">
        <div className="admin-user-info">
          <p className="admin-name">{user?.name}</p>
          <p className="admin-role-label">Platform Administrator</p>
        </div>
        <button onClick={handleLogout} className="admin-logout-btn">Logout</button>
      </div>
    </nav>
  );
};

export default AdminNavbar;
