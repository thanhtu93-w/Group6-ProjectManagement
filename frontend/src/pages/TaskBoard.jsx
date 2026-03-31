import React, { useState, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import TaskModal from "../components/TaskModal";
import TaskDetail from "../components/TaskDetail";
import MemberModal from "../components/MemberModal";
import API from "../api/axios";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import "./TaskBoard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TaskBoard = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const socket = useSocket();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [role, setRole] = useState(null);
  const [members, setMembers] = useState([]);
  const [productivity, setProductivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({}); // taskId -> count
  
  const [activeTab, setActiveTab] = useState("board");
  const [notes, setNotes] = useState("");
  const [originalNotes, setOriginalNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes, roleRes, membersRes, prodRes] = await Promise.all([
        API.get(`/projects/${projectId}`),
        API.get(`/tasks/project/${projectId}`),
        API.get(`/projects/${projectId}/role`),
        API.get(`/projects/${projectId}/members`),
        API.get(`/tasks/project/${projectId}/productivity`),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setRole(roleRes.data.role);
      setMembers(membersRes.data);
      setProductivity(prodRes.data);
      setOriginalNotes(projectRes.data.notes || "");
      // Only set current notes if it was empty or not modified
      if (!notes) {
        setNotes(projectRes.data.notes || "");
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Handle task selection from URL query param
  useEffect(() => {
    const taskId = searchParams.get("task");
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t._id === taskId);
      if (task) {
        setSelectedTask(task);
        // Clear unread counts for this task if we opened it
        setUnreadCounts(prev => ({ ...prev, [taskId]: 0 }));
      }
    }
  }, [searchParams, tasks]);

  useEffect(() => {
    if (socket && projectId) {
      socket.emit("join_project", projectId);
      
      const handleNewMessage = (data) => {
        if (data.senderId !== user?.id) {
          setUnreadCounts(prev => ({
            ...prev,
            [data.taskId]: (prev[data.taskId] || 0) + 1
          }));
        }
      };

      socket.on("new_message", handleNewMessage);
      
      socket.on("task_status_changed", (data) => {
        console.log("Real-time task status update received:", data);
        setTasks(prev => prev.map(t => t._id === data.taskId ? { ...t, status: data.newStatus } : t));
      });

      return () => {
        socket.emit("leave_project", projectId);
        socket.off("new_message", handleNewMessage);
        socket.off("task_status_changed");
      };
    }
  }, [socket, projectId, user]);

  const columns = [
    { title: "To Do", status: "To Do", icon: "📋" },
    { title: "In Progress", status: "In Progress", icon: "⚙️" },
    { title: "Done", status: "Done", icon: "✔️" },
  ];

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const { data } = await API.put(`/tasks/${taskId}`, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? data : t));
      
      // Always refresh productivity to reflect moves to OR from Done
      const prodRes = await API.get(`/tasks/project/${projectId}/productivity`);
      setProductivity(prodRes.data);
    } catch (err) {
      console.error("Failed to update task status", err);
    }
  };

  // Drag and Drop Handlers
  const onDragStart = (e, taskId) => {
    console.log("Drag started for task:", taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("dragging");
  };

  const onDragEnd = (e) => {
    e.currentTarget.classList.remove("dragging");
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!e.currentTarget.classList.contains("drag-over")) {
      e.currentTarget.classList.add("drag-over");
    }
  };

  const onDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const onDrop = (e, status) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove("drag-over");
    const taskId = e.dataTransfer.getData("taskId");
    console.log("Task dropped:", taskId, "into column:", status);
    if (taskId) {
      updateTaskStatus(taskId, status);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      await API.put(`/projects/${projectId}/notes`, { notes });
      setOriginalNotes(notes); // Update original after save
      setSavingNotes(false);
    } catch (err) {
      console.error("Failed to save notes", err);
      setSavingNotes(false);
    }
  };

  const handleRevertNotes = () => {
    setNotes(originalNotes);
  };

  const hasUnsavedNotes = notes !== originalNotes;

  // Chart Data
  const chartData = {
    labels: productivity.map(p => p._id),
    datasets: [
      {
        label: 'Tasks Completed',
        data: productivity.map(p => p.count),
        backgroundColor: 'rgba(16, 185, 129, 0.4)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: '#10b981',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { 
        display: true, 
        text: 'WEEKLY PRODUCTIVITY', 
        color: '#6b7280', 
        font: { size: 11, weight: '700', family: 'Inter' },
        padding: { bottom: 20 }
      },
    },
    scales: {
      y: { 
        beginAtZero: true, 
        ticks: { stepSize: 1, color: '#9ca3af' },
        grid: { color: '#f3f4f6' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#9ca3af' }
      }
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loader-ring"></div>
      <p>Syncing your workspace...</p>
    </div>
  );

  return (
    <div className="taskboard-page">
      <Navbar />
      <div className="taskboard-content">
        {/* Glassmorphic Header Section */}
        <header className="board-header-premium card-glass">
          <div className="header-top-row">
            <div className="project-info-minimal">
              <Link to="/dashboard" className="back-breadcrumb">Projects /</Link>
              <h1 className="modern-title">{project?.name}</h1>
              <span className="category-pill">{project?.category}</span>
            </div>
            
            <div className="header-actions-pill">
              {role === "Admin" && (
                <button className="btn-add-task-modern" onClick={() => setShowTaskModal(true)}>
                  <span className="icon-plus">+</span>
                  New Task
                </button>
              )}
              <div className="search-bar-modern">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="stats-layout">
            <div className="chart-preview-card">
              <div className="chart-header-timeline">
                <div className="timeline-date start">
                  <span className="label">Start:</span>
                  <span className="date">{project?.startDate ? new Date(project.startDate).toLocaleDateString() : "TBD"}</span>
                </div>
                <div className="timeline-date end">
                  <span className="label">Deadline:</span>
                  <span className="date">{project?.endDate ? new Date(project.endDate).toLocaleDateString() : "TBD"}</span>
                </div>
              </div>
              <div className="chart-wrapper">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
            
            <div className="members-overview-card">
              <div className="card-header-compact">
                <h3>ACTIVE TEAM</h3>
                <button className="btn-manage-members" onClick={() => setShowMemberModal(true)}>Manage</button>
              </div>
              <div className="member-stack">
                {members.slice(0, 5).map((m, i) => (
                  <div 
                    key={m._id} 
                    className="avatar-stack-item tint-emerald" 
                    style={{ zIndex: members.length - i, padding: 0, overflow: 'hidden' }}
                    title={m.user?.name}
                  >
                    {m.user?.avatar ? (
                      <img 
                        src={m.user.avatar.startsWith('http') ? m.user.avatar : `http://localhost:5000${m.user.avatar}`} 
                        alt={m.user.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      m.user?.name?.charAt(0) || "?"
                    )}
                  </div>
                ))}
                {members.length > 5 && (
                  <div className="avatar-stack-item overflow-count">
                    +{members.length - 5}
                  </div>
                )}
                <button className="btn-invite-round" onClick={() => setShowMemberModal(true)}>+</button>
              </div>
              <p className="member-status-text">
                <strong>{members.length}</strong> active members collaborating
              </p>
            </div>
          </div>
        </header>

        <div className="project-tabs" style={{ display: 'flex', gap: '30px', margin: '20px 0', borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
          <button 
            onClick={() => setActiveTab('board')} 
            style={{ 
              fontWeight: activeTab === 'board' ? 'bold' : 'normal', 
              color: activeTab === 'board' ? '#2563eb' : '#4b5563',
              borderBottom: activeTab === 'board' ? '3px solid #2563eb' : '3px solid transparent', 
              background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', padding: '10px 15px', fontSize: '1.1rem' 
            }}
          >
            Kanban Board
          </button>
          <button 
            onClick={() => setActiveTab('notes')} 
            style={{ 
              fontWeight: activeTab === 'notes' ? 'bold' : 'normal', 
              color: activeTab === 'notes' ? '#2563eb' : '#4b5563',
              borderBottom: activeTab === 'notes' ? '3px solid #2563eb' : '3px solid transparent', 
              background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer', padding: '10px 15px', fontSize: '1.1rem' 
            }}
          >
            Project Wiki / Notes
          </button>
        </div>

        {activeTab === 'board' ? (
          <main className="board-container-premium">
          {columns.map(col => (
              <section 
                key={col.status} 
                className="board-column-premium"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, col.status)}
              >
              <div className="column-header-modern">
                <div className="col-title-group">
                  <span className="col-icon">{col.icon}</span>
                  <h3>{col.title}</h3>
                </div>
                <span className="badge-count">
                  {tasks.filter(t => t.status === col.status && (
                    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    t.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  )).length}
                </span>
              </div>
              
              <div className="cards-scroll-area" 
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, col.status)}
              >
                {tasks
                  .filter(task => task.status === col.status && (
                    task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
                  ))
                  .map(task => {
                    const priority = task.priority || "Medium";
                    return (
                      <article 
                        key={task._id} 
                        className={`modern-task-card priority-${priority.toLowerCase()}`}
                        draggable="true"
                        onDragStart={(e) => onDragStart(e, task._id)}
                        onDragEnd={onDragEnd}
                        onClick={() => {
                          setSelectedTask(task);
                          setUnreadCounts(prev => ({ ...prev, [task._id]: 0 }));
                        }}
                      >
                        <div className="card-tag-row">
                          <span className={`tag-priority ${priority.toLowerCase()}`}>{priority}</span>
                          <span className="tag-date">{task.deadline ? new Date(task.deadline).toLocaleDateString() : "No Date"}</span>
                        </div>
                        
                        <h4 className="card-title">{task.title}</h4>
                        <p className="card-description">{task.description}</p>
                        
                        <footer className="card-footer-modern">
                          <div className="assignee-box">
                            {task.assignees && task.assignees.length > 0 ? (
                              <div className="member-stack" style={{ display: 'flex' }}>
                                {task.assignees.slice(0, 3).map((a, i) => (
                                  <div 
                                    key={a._id} 
                                    className="mini-avatar stack-avatar" 
                                    style={{ zIndex: 3 - i, marginLeft: i > 0 ? '-10px' : '0', padding: 0, overflow: 'hidden' }}
                                    title={a.name}
                                  >
                                    {a.avatar ? (
                                      <img 
                                        src={a.avatar.startsWith('http') ? a.avatar : `http://localhost:5000${a.avatar}`} 
                                        alt={a.name} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      a.name?.charAt(0) || "?"
                                    )}
                                  </div>
                                ))}
                                {task.assignees.length > 3 && (
                                  <div className="mini-avatar overflow-count" style={{ marginLeft: '-10px', zIndex: 0 }}>
                                    +{task.assignees.length - 3}
                                  </div>
                                )}
                              </div>
                            ) : task.assignee ? (
                              <>
                                <div className="mini-avatar">{task.assignee?.name?.charAt(0) || "?"}</div>
                                <span>{task.assignee?.name || "Deleted User"}</span>
                              </>
                            ) : (
                              <span className="unassigned-text">Unassigned</span>
                            )}
                          </div>
                          <div className="card-meta">
                            <span className="icon-chat-wrapper">
                              <span className="icon">💬</span>
                              {unreadCounts[task._id] > 0 && (
                                <span className="chat-dot-red" title="New messages"></span>
                              )}
                            </span>
                          </div>
                        </footer>
                      </article>
                    );
                  })}
                
                {tasks.filter(t => t.status === col.status).length === 0 && (
                  <div className="empty-drop-zone">
                    <p>No tasks yet</p>
                    <span>Drag items here</span>
                  </div>
                )}
              </div>
            </section>
          ))}
        </main>
        ) : (
          <div className="project-notes-container" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '20px', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <h3 style={{ margin: 0, color: '#1f2937' }}>Shared Project Notes</h3>
                {hasUnsavedNotes && <span style={{ color: '#f59e0b', fontSize: '0.9rem', fontWeight: 'bold' }}>● Unsaved Changes</span>}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {hasUnsavedNotes && (
                  <button 
                    onClick={handleRevertNotes}
                    style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Revert
                  </button>
                )}
                <button 
                  onClick={handleSaveNotes}
                  disabled={savingNotes || !hasUnsavedNotes}
                  style={{ 
                    background: hasUnsavedNotes ? '#2563eb' : '#94a3b8', 
                    color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', 
                    cursor: hasUnsavedNotes ? 'pointer' : 'default' 
                  }}
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </div>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write project guidelines, meeting notes, or resources here... (Markdown supported mentally)"
              style={{ flex: 1, width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical', minHeight: '300px' }}
            />
          </div>
        )}
      </div>

      {showTaskModal && (
        <TaskModal 
          projectId={projectId} 
          members={members}
          onClose={() => setShowTaskModal(false)} 
          onCreated={(newTask) => setTasks([...tasks, newTask])} 
        />
      )}

      {showMemberModal && (
        <MemberModal 
          projectId={projectId} 
          onClose={() => {
            setShowMemberModal(false);
            fetchData(); // Refresh members list
          }} 
        />
      )}

      {selectedTask && (
        <TaskDetail 
          task={selectedTask} 
          members={members}
          onClose={() => setSelectedTask(null)} 
          onUpdate={(updated) => {
            setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default TaskBoard;
