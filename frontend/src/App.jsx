import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TaskBoard from "./pages/TaskBoard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

import { SocketProvider } from "./context/SocketContext";

import Profile from "./pages/Profile";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user || user.role !== "admin") return <Navigate to="/dashboard" />;
  return children;
};

const RegularUserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role === "admin") return <Navigate to="/admin" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/profile" 
              element={
                <RegularUserRoute>
                  <Profile />
                </RegularUserRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <RegularUserRoute>
                  <Dashboard />
                </RegularUserRoute>
              } 
            />
            <Route 
              path="/taskboard/:projectId" 
              element={
                <RegularUserRoute>
                  <TaskBoard />
                </RegularUserRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
