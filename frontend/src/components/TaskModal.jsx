import React, { useState } from "react";
import API from "../api/axios";
import "./Modal.css";

const TaskModal = ({ projectId, members, onClose, onCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignees, setAssignees] = useState([]);
  const [priority, setPriority] = useState("Medium");
  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/tasks", { 
        title, 
        description, 
        project: projectId, 
        deadline,
        assignees,
        priority
      });
      onCreated(data);
      onClose();
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const handleAssigneeToggle = (userId) => {
    if (assignees.includes(userId)) {
      setAssignees(assignees.filter(id => id !== userId));
    } else {
      setAssignees([...assignees, userId]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Task Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
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
          <div className="form-group">
            <label>Assigned Team Members</label>
            <div className="assignment-dual-pane" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="pane-available">
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Available</span>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', background: '#f8fafc', marginTop: '5px' }}>
                  {members?.filter(m => !assignees.includes(m.user?._id)).map(m => (
                    <div key={m._id} onClick={() => handleAssigneeToggle(m.user?._id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="mini-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                          {m.user?.avatar ? (
                            <img src={m.user.avatar.startsWith('http') ? m.user.avatar : `http://localhost:5000${m.user.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : m.user?.name.charAt(0)}
                        </div>
                        <span>{m.user?.name}</span>
                      </div>
                      <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>+</span>
                    </div>
                  ))}
                  {members?.filter(m => !assignees.includes(m.user?._id)).length === 0 && <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>All members assigned</p>}
                </div>
              </div>
              <div className="pane-assigned">
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Selected</span>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #3b82f6', borderRadius: '10px', padding: '8px', background: '#eff6ff', marginTop: '5px' }}>
                  {members?.filter(m => assignees.includes(m.user?._id)).map(m => (
                    <div key={m._id} onClick={() => handleAssigneeToggle(m.user?._id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'white', border: '1px solid #bfdbfe', borderRadius: '6px', marginBottom: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="mini-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                          {m.user?.avatar ? (
                            <img src={m.user.avatar.startsWith('http') ? m.user.avatar : `http://localhost:5000${m.user.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : m.user?.name.charAt(0)}
                        </div>
                        <span>{m.user?.name}</span>
                      </div>
                      <span style={{ color: '#ef4444', fontWeight: 'bold' }}>×</span>
                    </div>
                  ))}
                  {assignees.length === 0 && <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>No one selected</p>}
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Deadline</label>
            <input 
              type="date" 
              value={deadline} 
              min={today}
              onChange={(e) => setDeadline(e.target.value)} 
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
            <button type="submit" className="submit-btn text-white">Create Task</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
