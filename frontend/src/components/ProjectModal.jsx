import React, { useState } from "react";
import API from "../api/axios";
import "./Modal.css";
import TaskEditModal from "./TaskEditModal";

const ProjectModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web Development");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [numTasks, setNumTasks] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate tasks before submit
      const invalidTask = tasks.slice(0, numTasks).find(t => 
        endDate && t.deadline && new Date(t.deadline) > new Date(endDate)
      );
      if (invalidTask) {
        alert(`Task "${invalidTask.title}" deadline cannot be after project deadline.`);
        return;
      }

      const { data } = await API.post("/projects", { 
        name, 
        description, 
        category, 
        startDate, 
        endDate,
        tasks: tasks.slice(0, numTasks)
      });
      onCreated(data);
      onClose();
    } catch (err) {
      console.error("Failed to create project", err);
      alert(err.response?.data?.message || "Failed to create project");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Create New Project</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Project Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
              />
            </div>
            <div className="form-group-grid">
              <div className="form-group">
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
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
              <div className="form-group">
                <label>Number of Tasks</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input 
                    type="number" 
                    min="0"
                    max="10"
                    value={numTasks} 
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setNumTasks(val);
                      // Initialize tasks with placeholders if they don't exist
                      setTasks(prev => {
                        const newTasks = [...prev];
                        for (let i = 0; i < val; i++) {
                          if (!newTasks[i]) {
                            newTasks[i] = { 
                              title: `Task ${i + 1}`, 
                              description: "", 
                              priority: "Medium", 
                              deadline: "" 
                            };
                          }
                        }
                        return newTasks;
                      });
                    }} 
                    style={{ width: "80px" }}
                  />
                  {numTasks > 0 && (
                    <button 
                      type="button" 
                      className="cancel-btn" 
                      onClick={() => setIsTaskModalOpen(true)}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.8rem" }}
                    >
                      Edit Tasks
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="form-group-grid">
              <div className="form-group">
                <label>Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>End Date (Deadline)</label>
                <input 
                  type="date" 
                  value={endDate} 
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
              <button type="submit" className="submit-btn text-white">Create Project</button>
            </div>
          </form>
        </div>
      </div>

      <TaskEditModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        numTasks={numTasks}
        tasks={tasks}
        setTasks={setTasks}
        projectDeadline={endDate}
      />
    </>
  );
};

export default ProjectModal;
