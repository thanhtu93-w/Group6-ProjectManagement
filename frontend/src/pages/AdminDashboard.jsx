
import React, { useState, useEffect } from "react";
import AdminNavbar from "../components/AdminNavbar";
import API from "../api/axios";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalProjects: 0, totalTasks: 0 });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState("users"); // 'users' or 'projects'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, usersRes, projectsRes] = await Promise.all([
          API.get("/admin/stats"),
          API.get("/admin/users"),
          API.get("/admin/projects")
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setProjects(projectsRes.data);
      } catch (err) {
        console.error("Failed to fetch admin data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await API.delete(`/admin/projects/${id}`);
      setProjects(projects.filter(p => p._id !== id));
      setStats(prev => ({ ...prev, totalProjects: prev.totalProjects - 1 }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete project");
    }
  };

  if (loading) return <div className="admin-loading">Loading Management Console...</div>;

  return (
    <div className="admin-dashboard-page">
      <AdminNavbar />
      <div className="admin-content">
        <header className="admin-page-header">
          <div className="header-info">
            <h1>Platform Overview</h1>
            <p>System-wide project and user monitoring</p>
          </div>
          <div className="admin-stats-badges">
            <div className="stat-card">
              <span className="sc-label">Total Users</span>
              <span className="sc-value">{stats.totalUsers}</span>
            </div>
            <div className="stat-card">
              <span className="sc-label">Total Projects</span>
              <span className="sc-value">{stats.totalProjects}</span>
            </div>
            <div className="stat-card">
              <span className="sc-label">System Tasks</span>
              <span className="sc-value">{stats.totalTasks}</span>
            </div>
          </div>
        </header>

        <div className="admin-controls-card card-premium glass">
          <nav className="admin-nav-tabs">
            <button 
              className={view === "users" ? "active" : ""} 
              onClick={() => setView("users")}
            >
              System Users ({users.length})
            </button>
            <button 
              className={view === "projects" ? "active" : ""} 
              onClick={() => setView("projects")}
            >
              Project Repository ({projects.length})
            </button>
          </nav>

          <div className="admin-table-container">
            {view === "users" ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Email Address</th>
                    <th>Platform Role</th>
                    <th>Join Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td className="td-user">
                        <div className="table-avatar" style={{ padding: 0, overflow: 'hidden' }}>
                          {u.avatar ? (
                            <img 
                              src={u.avatar.startsWith('http') ? u.avatar : `http://localhost:5000${u.avatar}`} 
                              alt={u.name} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            u.name.charAt(0)
                          )}
                        </div>
                        <div className="user-name-stack">
                          <span className="un-name">{u.name}</span>
                          <span className="un-title">{u.jobTitle}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn-delete-row" 
                          onClick={() => handleDeleteUser(u._id)}
                          disabled={u.role === "admin"}
                        >
                          Terminate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Project Information</th>
                    <th>Project Owner</th>
                    <th>Category</th>
                    <th>Total Tasks</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div className="project-cell">
                          <strong>{p.name}</strong>
                          <p>{p.description?.substring(0, 50)}...</p>
                        </div>
                      </td>
                      <td>{p.owner?.name || "Unknown"}</td>
                      <td>{p.category}</td>
                      <td>
                        <span className="task-count-pill">
                          {p.taskCount || 0} tasks
                        </span>
                      </td>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn-delete-row" 
                          onClick={() => handleDeleteProject(p._id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
