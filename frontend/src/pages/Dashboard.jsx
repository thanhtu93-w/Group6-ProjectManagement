import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import ProjectModal from "../components/ProjectModal";
import API from "../api/axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "./Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  
  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin");
    }
  }, [user, navigate]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await API.get("/projects");
        setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === "All" || project.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Activity",
        data: [12, 19, 15, 25, 22, 10, 14],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } },
    },
    plugins: {
      legend: { display: false },
    },
  };

  if (user?.role === "admin") return <div className="admin-loading">Redirecting to Admin Panel...</div>;

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <button className="new-project-btn" onClick={() => setShowModal(true)}>
            + New Project
          </button>
          <div className="header-actions">
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="All">All Categories</option>
              <option value="Web Development">Web Development</option>
              <option value="Mobile App">Mobile App</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Research">Research</option>
              <option value="Data Analysis">Data Analysis</option>
              <option value="Backend API">Backend API</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="project-list-container">
          <div className="project-list-header">
            <span>Role</span>
            <span>Project Details</span>
            <span>Action</span>
          </div>
          <div className="project-list">
            {filteredProjects.map((project) => (
              <div key={project._id} className="project-row card">
                <div className="project-role">
                  <span className={`role-badge ${(project.userRole || "Member").toLowerCase()}`}>
                    {project.userRole || "Member"}
                  </span>
                </div>
                <div className="project-info-main">
                  <div className="project-name-cat">
                    <h3>{project.name}</h3>
                    <span className="project-category">{project.category}</span>
                  </div>
                  <div className="project-dates">
                    {project.startDate && (
                      <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                    )}
                    {project.endDate && (
                      <span className="deadline">Deadline: {new Date(project.endDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  {/* Progress Bar */}
                  <div className="project-progress-container">
                    <div className="progress-stats">
                      <span>Progress</span>
                      <span>{Math.round((project.completedTasks / project.totalTasks) * 100) || 0}%</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div 
                        className="progress-bar-fill" 
                        style={{ width: `${(project.completedTasks / project.totalTasks) * 100 || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="project-actions">
                  <Link to={`/taskboard/${project._id}`} className="go-to-btn">
                    Go to Task Board &rarr;
                  </Link>
                </div>
              </div>
            ))}
            {filteredProjects.length === 0 && !loading && (
              <div className="no-projects card">
                <p>No projects found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {showModal && (
        <ProjectModal 
          onClose={() => setShowModal(false)} 
          onCreated={(newProj) => setProjects([newProj, ...projects])} 
        />
      )}
    </div>
  );
};

export default Dashboard;
