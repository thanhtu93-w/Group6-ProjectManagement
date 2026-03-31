import Project from "../models/Project.js";
import ProjectMember from "../models/ProjectMember.js";
import User from "../models/User.js";
import { createNotification } from "./notificationController.js";

export const createProject = async (req, res) => {
  try {
    const { name, description, category, startDate, endDate, tasks } = req.body;
    const project = new Project({
      name,
      description,
      category,
      startDate,
      endDate,
      owner: req.user.id,
    });
    await project.save();

    // Automatically add owner as an Admin member
    const member = new ProjectMember({
      project: project._id,
      user: req.user.id,
      role: "Admin",
    });
    await member.save();

    let createdTasksCount = 0;
    // Create bulk tasks if provided
    if (tasks && Array.isArray(tasks)) {
      const Task = await import("../models/Task.js").then(m => m.default);
      for (const t of tasks) {
        // Skip tasks without a title (empty placeholders)
        if (!t.title) continue;

        // Validation: Deadline check
        if (endDate && t.deadline && new Date(t.deadline) > new Date(endDate)) {
          throw new Error(`Task "${t.title}" deadline exceeds project deadline.`);
        }
        const newTask = new Task({
          ...t,
          project: project._id,
        });
        await newTask.save();
        createdTasksCount++;
      }
    }

    // Return object consistent with getProjects response
    res.status(201).json({
      ...project._doc,
      userRole: "Admin",
      totalTasks: createdTasksCount,
      completedTasks: 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const Task = await import("../models/Task.js").then(m => m.default);
    
    // Get projects where user is a member
    const memberships = await ProjectMember.find({ user: req.user.id }).populate("project");
    
    // For each project, count tasks
    const projectsWithStats = await Promise.all(memberships
      .filter(m => m.project)
      .map(async (m) => {
        const totalTasks = await Task.countDocuments({ project: m.project._id });
        const completedTasks = await Task.countDocuments({ project: m.project._id, status: "Done" });
        return {
          ...m.project._doc,
          userRole: m.role,
          totalTasks,
          completedTasks
        };
      }));
      
    res.json(projectsWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("owner", "name email");
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id }, // Only owner can update
      { name, description },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found or unauthorized" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProjectNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    // Check if user is a member
    const membership = await ProjectMember.findOne({ project: req.params.id, user: req.user.id });
    if (!membership) return res.status(403).json({ message: "Not a member" });
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { notes },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!project) return res.status(404).json({ message: "Project not found or unauthorized" });
    
    // Cleanup members (could also cleanup tasks/messages/etc)
    await ProjectMember.deleteMany({ project: req.params.id });
    
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Member Management ---

export const getProjectRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const membership = await ProjectMember.findOne({ project: id, user: req.user.id });
    if (!membership) return res.status(403).json({ message: "Not a member of this project" });

    req.projectRole = membership.role;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const { id } = req.params; // project ID

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ message: "User not found" });

    const existingMember = await ProjectMember.findOne({ project: id, user: userToAdd._id });
    if (existingMember) return res.status(400).json({ message: "User is already a member" });

    const newMember = new ProjectMember({
      project: id,
      user: userToAdd._id,
      role: role || "Member",
    });
    await newMember.save();

    // Notify user
    const projectDoc = await Project.findById(id);
    await createNotification(
      userToAdd._id,
      req.user.id,
      "INVITE",
      `You have been invited to join project: ${projectDoc.name}`,
      `/taskboard/${id}`
    );

    res.status(201).json(newMember);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMembers = async (req, res) => {
  try {
    const members = await ProjectMember.find({ project: req.params.id }).populate("user", "name email phone bio avatar jobTitle");
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params; // project ID and user ID to remove

    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Check requester role
    const requesterMembership = await ProjectMember.findOne({ project: id, user: req.user.id });
    if (!requesterMembership || requesterMembership.role !== "Admin") {
      return res.status(403).json({ message: "Only project leaders can remove members" });
    }

    // Don't allow removing the owner
    if (userId === project.owner.toString()) {
      return res.status(400).json({ message: "Cannot remove the project owner" });
    }

    await ProjectMember.findOneAndDelete({ project: id, user: userId });

    // Notify user
    await createNotification(
      userId,
      req.user.id,
      "REMOVE",
      `You have been removed from project: ${project.name}`,
      "/dashboard"
    );

    res.json({ message: "Member removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
