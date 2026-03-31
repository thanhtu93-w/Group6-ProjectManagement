
import React, { useState, useEffect } from "react";
import API from "../api/axios";
import "./Modal.css";
import "./MemberModal.css";

const MemberModal = ({ projectId, onClose }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  const [members, setMembers] = useState([]);
  const [currentRole, setCurrentRole] = useState("Member");
  const [error, setError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchData = async () => {
    try {
      const [membersRes, roleRes] = await Promise.all([
        API.get(`/projects/${projectId}/members`),
        API.get(`/projects/${projectId}/role`)
      ]);
      setMembers(membersRes.data);
      setCurrentRole(roleRes.data.role);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await API.post(`/projects/${projectId}/members`, { email, role });
      setEmail("");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await API.delete(`/projects/${projectId}/members/${userId}`);
      if (selectedMember?.user?._id === userId) setSelectedMember(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content member-modal-content">
        <header className="modal-header-premium">
          <h2>Project Team</h2>
        </header>
        
        <div className="member-manager-layout">
          <div className="member-list-pane">
            {currentRole === "Admin" && (
              <div className="invite-section-compact">
                <form onSubmit={handleAddMember} className="invite-form">
                  <input 
                    type="email" 
                    placeholder="Invite by email..." 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button type="submit">Invite</button>
                </form>
                {error && <p className="error-text">{error}</p>}
              </div>
            )}

            <div className="team-list-compact">
              <h3>Active Members ({members.length})</h3>
              <div className="members-scroll-area-compact">
                {members.map((m) => (
                  <div 
                    key={m._id} 
                    className={`member-item-compact ${selectedMember?._id === m._id ? "active" : ""}`}
                    onClick={() => setSelectedMember(m)}
                  >
                    <div className="avatar-mini-box">
                      {m.user?.avatar ? (
                        <img src={m.user.avatar} alt="Avatar" className="avatar-img-mini" />
                      ) : (
                        m.user?.name.charAt(0)
                      )}
                    </div>
                    <div className="info-mini">
                      <h4>{m.user?.name}</h4>
                      <p>{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="member-detail-pane">
            {selectedMember ? (
              <div className="member-profile-detail card-glass">
                <div className="detail-header-row">
                  <div className="detail-avatar-large">
                    {selectedMember.user?.avatar ? (
                      <img src={selectedMember.user.avatar} alt="Avatar" />
                    ) : (
                      selectedMember.user?.name.charAt(0)
                    )}
                  </div>
                  <div className="detail-titles">
                    <h2>{selectedMember.user?.name}</h2>
                    <span className={`role-pill ${selectedMember.role.toLowerCase()}`}>{selectedMember.role}</span>
                    <p className="detail-sub">{selectedMember.user?.jobTitle || "Team Member"}</p>
                  </div>
                </div>

                <div className="detail-contact-grid">
                  <div className="contact-item">
                    <span className="c-label">Email</span>
                    <span className="c-value">{selectedMember.user?.email}</span>
                  </div>
                  <div className="contact-item">
                    <span className="c-label">Phone</span>
                    <span className="c-value">{selectedMember.user?.phone || "Not provided"}</span>
                  </div>
                </div>

                <div className="detail-bio">
                  <h4>About</h4>
                  <p>{selectedMember.user?.bio || "No biography provided."}</p>
                </div>

                {currentRole === "Admin" && selectedMember.role !== "Owner" && (
                  <button 
                    className="btn-remove-large"
                    onClick={() => handleRemoveMember(selectedMember.user?._id)}
                  >
                    Remove from Project
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-detail-state">
                <div className="icon-users">👥</div>
                <p>Select a member to view their profile details</p>
              </div>
            )}
          </div>
        </div>

        <footer className="modal-footer-premium">
          <button onClick={onClose} className="btn-close-minimal">Close Panel</button>
        </footer>
      </div>
    </div>
  );
};

export default MemberModal;
