import React, { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "./TaskDetail.css";

const TaskDetail = ({ task, members, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Task state for editing
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority || "Medium");
  const [assignees, setAssignees] = useState(task.assignees ? task.assignees.map(a => a._id || a) : (task.assignee ? [task.assignee._id || task.assignee] : []));
  const [deadline, setDeadline] = useState(task.deadline ? task.deadline.split('T')[0] : "");
  const today = new Date().toISOString().split("T")[0];

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleUpdateTask = async () => {
    try {
      const { data } = await API.put(`/tasks/${task._id}`, {
        title,
        description,
        status,
        priority,
        assignees,
        deadline
      });
      onUpdate(data);
    } catch (err) {
      console.error("Failed to update task", err);
      alert(err.response?.data?.message || "Failed to update task");
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await API.get(`/messages/task/${task._id}`);
        setMessages(data);
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };
    fetchMessages();
  }, [task._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    setUploading(true);
    try {
      let attachmentIds = [];
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("taskId", task._id);

        const { data: attachment } = await API.post("/attachments", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        attachmentIds.push(attachment._id);
      }

      // Parse simple @mentions
      const mentionedTags = newMessage.match(/@(\w+)/g) || [];
      const mentions = mentionedTags.map(tag => tag.substring(1));

      const { data } = await API.post("/messages", { 
        task: task._id, 
        content: newMessage,
        attachments: attachmentIds,
        mentions
      });

      // Refetch messages to get populated attachments and sender
      const { data: updatedMessages } = await API.get(`/messages/task/${task._id}`);
      setMessages(updatedMessages);

      setNewMessage("");
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setUploading(false);
    }
  };

  const isImage = (url) => {
    return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content task-detail-content">
        <div className="detail-header">
          <h2>{task.title}</h2>
          <button onClick={onClose} className="close-detail">×</button>
        </div>
        
        <div className="detail-body">
          <div className="task-info">
            <div className="form-group">
              <input 
                className="edit-title-input"
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Task Title"
              />
            </div>
            <textarea 
              className="edit-desc-textarea"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Task Description"
            />
            
            <div className="meta-edit-grid">
              <div className="form-group">
                <label>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Task Assignment</label>
                <div className="assignment-dual-pane" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
                  <div className="pane-available">
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Available</span>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', background: '#f8fafc', marginTop: '4px' }}>
                      {members?.filter(m => !assignees.includes(m.user?._id)).map(m => (
                        <div key={m._id} onClick={() => setAssignees([...assignees, m.user._id])} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="mini-avatar" style={{ width: '20px', height: '20px', fontSize: '0.65rem', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                              {m.user?.avatar ? (
                                <img src={m.user.avatar.startsWith('http') ? m.user.avatar : `http://localhost:5000${m.user.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : m.user?.name.charAt(0)}
                            </div>
                            <span>{m.user?.name}</span>
                          </div>
                          <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>+</span>
                        </div>
                      ))}
                      {members?.filter(m => !assignees.includes(m.user?._id)).length === 0 && <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>All assigned</p>}
                    </div>
                  </div>
                  <div className="pane-assigned">
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Assigned</span>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #3b82f6', borderRadius: '10px', padding: '8px', background: '#eff6ff', marginTop: '4px' }}>
                      {members?.filter(m => assignees.includes(m.user?._id)).map(m => (
                        <div key={m._id} onClick={() => setAssignees(assignees.filter(id => id !== m.user._id))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 10px', background: 'white', border: '1px solid #bfdbfe', borderRadius: '6px', marginBottom: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="mini-avatar" style={{ width: '20px', height: '20px', fontSize: '0.65rem', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                              {m.user?.avatar ? (
                                <img src={m.user.avatar.startsWith('http') ? m.user.avatar : `http://localhost:5000${m.user.avatar}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : m.user?.name.charAt(0)}
                            </div>
                            <span>{m.user?.name}</span>
                          </div>
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>×</span>
                        </div>
                      ))}
                      {assignees.length === 0 && <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>None</p>}
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
                <label>Due Date</label>
                <input type="date" value={deadline} min={today} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <button className="save-task-btn" onClick={handleUpdateTask}>Save Changes</button>
            </div>
          </div>

          <div className="chat-section">
            <h3>Discussion</h3>
            <div className="message-list">
              {messages.map((msg, i) => {
                const isOwn = msg.sender?._id === user?.id;
                return (
                  <div key={i} className={`message-item ${isOwn ? 'own-message' : ''}`}>
                    <div className="msg-sender" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="mini-avatar" style={{ width: '24px', height: '24px', fontSize: '0.8rem', padding: 0, overflow: 'hidden' }}>
                        {msg.sender?.avatar ? (
                          <img 
                            src={msg.sender.avatar.startsWith('http') ? msg.sender.avatar : `http://localhost:5000${msg.sender.avatar}`} 
                            alt={msg.sender.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          msg.sender?.name?.charAt(0) || "?"
                        )}
                      </div>
                      {msg.sender?.name || "User"}
                    </div>
                    <div className="msg-bubble">
                      {msg.content && <p>{msg.content}</p>}
                    {msg.attachments?.map((att) => (
                      <div key={att._id} className="attachment-preview">
                        {isImage(att.url) ? (
                          <img 
                            src={`http://localhost:5000${att.url}`} 
                            alt={att.filename} 
                            className="chat-image" 
                          />
                        ) : (
                          <a 
                            href={`http://localhost:5000${att.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="file-link"
                          >
                            📄 {att.filename}
                          </a>
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && <p className="no-messages">No messages yet.</p>}
              <div ref={messagesEndRef} />
            </div>
            <form className="chat-input" onSubmit={handleSendMessage}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
              <button 
                type="button" 
                className="attach-btn" 
                onClick={() => fileInputRef.current.click()}
              >
                📎
              </button>
              <input 
                type="text" 
                placeholder={selectedFile ? `File: ${selectedFile.name}` : "Type a message..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={uploading}>
                {uploading ? "..." : "Send"}
              </button>
            </form>
            {selectedFile && (
              <div className="selected-file-badge">
                {selectedFile.name} <button onClick={() => setSelectedFile(null)}>×</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
