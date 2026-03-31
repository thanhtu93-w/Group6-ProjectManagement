import React from "react";
import "./Modal.css";

const TaskEditModal = ({ isOpen, onClose, numTasks, tasks, setTasks, projectDeadline }) => {
  const today = new Date().toISOString().split("T")[0];
  if (!isOpen) return null;

  const handleTaskChange = (index, field, value) => {
    const newTasks = [...tasks];
    if (!newTasks[index]) {
      newTasks[index] = { title: "", description: "", priority: "Medium", deadline: "" };
    }
    newTasks[index][field] = value;
    setTasks(newTasks);
  };

  const renderTaskForms = () => {
    const forms = [];
    for (let i = 0; i < numTasks; i++) {
      const task = tasks[i] || { title: "", description: "", priority: "Medium", deadline: "" };
      forms.push(
        <div key={i} className="task-edit-row">
          <h4>Task #{i + 1}</h4>
          <div className="form-group">
            <label>Title</label>
            <input 
              type="text" 
              value={task.title} 
              onChange={(e) => handleTaskChange(i, "title", e.target.value)} 
              placeholder="e.g. Design Homepage"
              required 
            />
          </div>
          <div className="form-group-grid">
            <div className="form-group">
              <label>Priority</label>
              <select 
                value={task.priority} 
                onChange={(e) => handleTaskChange(i, "priority", e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input 
                type="date" 
                value={task.deadline} 
                min={today}
                onChange={(e) => handleTaskChange(i, "deadline", e.target.value)}
                max={projectDeadline}
              />
              {projectDeadline && task.deadline && new Date(task.deadline) > new Date(projectDeadline) && (
                <span className="error-text">Cannot exceed project deadline ({projectDeadline})</span>
              )}
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              value={task.description} 
              onChange={(e) => handleTaskChange(i, "description", e.target.value)}
              placeholder="Briefly describe the task..."
            />
          </div>
          <hr className="task-divider" />
        </div>
      );
    }
    return forms;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content task-list-modal">
        <h2>Edit Initial Tasks ({numTasks})</h2>
        <div className="task-forms-container">
          {renderTaskForms()}
        </div>
        <div className="modal-actions">
          <button type="button" onClick={onClose} className="submit-btn text-white">Done</button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;
