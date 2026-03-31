import React, { createContext, useState, useContext, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (token && savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser({ ...parsed, id: parsed.id || parsed._id });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await API.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await API.post("/auth/register", { name, email, password });
    return data;
  };

  const updateProfile = async (userData) => {
    const { data } = await API.put("/auth/profile", userData);
    const normalized = { ...data, id: data.id || data._id };
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
    return normalized;
  };

  const uploadAvatar = async (formData) => {
    const { data } = await API.post("/auth/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const normalized = { ...data, id: data.id || data._id };
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
    return normalized;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, uploadAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
