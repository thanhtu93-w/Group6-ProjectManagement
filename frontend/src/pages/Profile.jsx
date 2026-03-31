
import React, { useState, useRef } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import "./Profile.css";

const Profile = () => {
  const { user, updateProfile, uploadAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    jobTitle: user?.jobTitle || "",
    bio: user?.bio || "",
  });
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("avatar", file);

    try {
      setIsUploading(true);
      await uploadAvatar(data);
      setMessage("Avatar updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to upload avatar.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setMessage("Failed to update profile.");
    }
  };

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        {message && <div className="alert-toast">{message}</div>}
        
        <div className="profile-card card-premium glass">
          <div className="profile-header">
            <div 
              className={`profile-avatar-large ${isEditing ? "editable" : ""}`} 
              onClick={handleAvatarClick}
            >
              {isUploading && <div className="avatar-loader"></div>}
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="avatar-img" />
              ) : (
                user?.name?.charAt(0) || "U"
              )}
              {isEditing && (
                <div className="avatar-overlay">
                  <span>Change Photo</span>
                </div>
              )}
            </div>
            {/* Hidden Input File */}
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              accept="image/*"
              onChange={handleFileChange} 
            />
            <div className="profile-titles">
              <h1>{user?.name}</h1>
              <p className="job-title-tag">{user?.jobTitle || "Team Member"}</p>
              <p className="email-label">{user?.email}</p>
            </div>
          </div>
          
          {!isEditing ? (
            <>
              <div className="profile-info-grid">
                <div className="info-item">
                  <span className="label">Full Name</span>
                  <span className="value">{user?.name}</span>
                </div>
                <div className="info-item">
                  <span className="label">Phone</span>
                  <span className="value">{user?.phone || "Not set"}</span>
                </div>
                <div className="info-item">
                  <span className="label">Job Title</span>
                  <span className="value">{user?.jobTitle || "Team Member"}</span>
                </div>
              </div>
              
              <div className="bio-section">
                <h3>About Me</h3>
                <p>{user?.bio || "No bio yet."}</p>
              </div>

              <div className="profile-actions">
                <button className="btn-edit-profile" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="edit-profile-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="form-group">
                  <label>Job Title</label>
                  <input 
                    type="text" 
                    name="jobTitle" 
                    value={formData.jobTitle} 
                    onChange={handleChange} 
                  />
                </div>
                {/* Note for users on how to change avatar */}
                <div className="form-group">
                  <label>Avatar</label>
                  <div className="avatar-hint">Click the profile picture above to change your photo.</div>
                </div>
                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleChange} 
                    rows="4"
                  ></textarea>
                </div>
              </div>
              
              <div className="edit-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
