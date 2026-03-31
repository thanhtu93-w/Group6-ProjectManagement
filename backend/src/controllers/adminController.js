
import User from "../models/User.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

export const getSystemStats = async (req, res) => {
  try {
    const [totalUsers, totalProjects, totalTasks] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Task.countDocuments()
    ]);
    res.json({ totalUsers, totalProjects, totalTasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate("owner", "name email").sort({ createdAt: -1 }).lean();
    
    const projectsWithTaskCount = await Promise.all(projects.map(async (project) => {
      const taskCount = await Task.countDocuments({ project: project._id });
      return { ...project, taskCount };
    }));
    
    res.json(projectsWithTaskCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "admin") return res.status(400).json({ message: "Cannot delete an admin" });
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
