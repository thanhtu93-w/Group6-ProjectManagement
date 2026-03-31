import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { useSocket } from "../context/SocketContext";
import "./NotificationCenter.css";

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const socket = useSocket();

  const fetchSummary = async () => {
    try {
      const { data } = await API.get("/notifications/unread-count");
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get("/notifications");
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("new_notification", (data) => {
        console.log("Real-time notification received:", data);
        setUnreadCount(data.unreadCount);
        if (isOpen) {
          fetchNotifications();
        }
      });

      return () => socket.off("new_notification");
    }
  }, [socket, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await API.put("/notifications/all/read");
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all read", err);
    }
  };

  const handleRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      fetchSummary();
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "INVITE": return "📩";
      case "ASSIGN": return "📌";
      case "REMOVE": return "🚫";
      case "STATUS_CHANGE": return "🔄";
      case "MENTION": return "🏷️";
      case "MESSAGE": return "💬";
      default: return "🔔";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="notification-center" ref={dropdownRef}>
      <button className="btn-bell-modern" onClick={toggleDropdown}>
        <span className="icon-bell">🔔</span>
        {unreadCount > 0 && <span className="badge-red">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown-premium">
          <header className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="btn-mark-read" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </header>

          <div className="notification-list-scroll">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <Link 
                  to={n.link || "#"} 
                  key={n._id} 
                  className={`notification-item-premium ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => {
                    handleRead(n._id);
                    setIsOpen(false);
                  }}
                >
                  <div className={`noti-icon-box noti-${n.type}`}>
                    {getIcon(n.type)}
                  </div>
                  <div className="noti-content-box">
                    <p className="noti-message">{n.message}</p>
                    <p className="noti-time">{formatTime(n.createdAt)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty-notifications">
                <span className="icon">📭</span>
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
