import Task from "../models/Task.js";
import ProjectMember from "../models/ProjectMember.js";
import mongoose from "mongoose";
import { createNotification } from "./notificationController.js";

export const createTask = async (req, res) => {
  try {
    const { title, description, project, assignees, deadline, priority } = req.body;

    // Fetch project to check its endDate
    const projectDoc = await import("../models/Project.js").then(m => m.default.findById(project));
    if (projectDoc && projectDoc.endDate && deadline) {
      if (new Date(deadline) > new Date(projectDoc.endDate)) {
        return res.status(400).json({ message: "Task deadline cannot be after project deadline" });
      }
    }

    // Check Role
    const membership = await ProjectMember.findOne({ project, user: req.user.id });
    if (!membership || membership.role !== "Admin") {
      return res.status(403).json({ message: "Only project leaders can create tasks" });
    }

    const task = new Task({
      title,
      description,
      project,
      assignees: assignees || [],
      deadline,
      priority: priority || "Medium"
    });
    await task.save();

    if (assignees && assignees.length > 0) {
      for (const uid of assignees) {
        await createNotification(
          uid,
          req.user.id,
          "ASSIGN",
          `You have been assigned to task: ${title}`,
          `/taskboard/${project}?task=${task._id}`
        );
      }
    }
    
    // Populate assignees for the response
    const populatedTask = await Task.findById(task._id).populate("assignees", "name email avatar");
    res.status(201).json(populatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId }).populate("assignees", "name email avatar");
    
    // Fetch message counts for each task
    const Message = await import("../models/Message.js").then(m => m.default);
    const tasksWithCounts = await Promise.all(tasks.map(async (task) => {
      const count = await Message.countDocuments({ task: task._id });
      return { ...task.toObject(), messageCount: count };
    }));

    res.json(tasksWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, assignees, status, deadline, priority } = req.body;
    const task = await Task.findById(req.params.id).populate("project");
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Validate deadline against project endDate
    if (task.project && task.project.endDate && deadline) {
      if (new Date(deadline) > new Date(task.project.endDate)) {
        return res.status(400).json({ message: "Task deadline cannot be after project deadline" });
      }
    }

    const membership = await ProjectMember.findOne({ project: task.project._id, user: req.user.id });
    if (!membership) return res.status(403).json({ message: "Not a member" });

    // Members can ONLY update status
    if (membership.role !== "Admin") {
      if (title || description || assignees || deadline || priority) {
        return res.status(403).json({ message: "Members can only update task status" });
      }
    }

    // Update completedAt if status changes
    let completedAt = task.completedAt;
    if (status) {
      if (status === "Done") {
        if (task.status !== "Done") completedAt = new Date();
      } else {
        completedAt = null; // Clear if moved out of Done
      }
    }

    const oldAssignees = (task.assignees || []).map(a => a.toString());
    const newAssignees = assignees || [];

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignees: newAssignees, status, deadline, priority, completedAt },
      { new: true }
    ).populate("assignees", "name email avatar");

    // Notifications for assignment or status change
    const addedAssignees = newAssignees.filter(a => !oldAssignees.includes(a.toString()));
    const removedAssignees = oldAssignees.filter(a => !newAssignees.includes(a.toString()));

    for (const uid of addedAssignees) {
      await createNotification(
        uid,
        req.user.id,
        "ASSIGN",
        `You have been assigned to task: ${updatedTask.title}`,
        `/taskboard/${task.project._id}?task=${task._id}`
      );
    }
    for (const uid of removedAssignees) {
      await createNotification(
        uid,
        req.user.id,
        "REMOVE",
        `You have been unassigned from task: ${task.title}`,
        `/taskboard/${task.project._id}?task=${task._id}`
      );
    }

    if (status && status !== task.status) {
      console.log(`Status change detected: ${task.status} -> ${status} for task ${task.title}`);
      // Send notification to all assignees + owner
      const recipients = [...new Set([...newAssignees.map(a => a.toString()), task.project.owner.toString()])];
      let msg = "";
      if (status === "Done") msg = `Task "${updatedTask.title}" has been completed! Great job.`;
      if (status === "In Progress") msg = `Task "${updatedTask.title}" has started. Deadline: ${updatedTask.deadline ? new Date(updatedTask.deadline).toLocaleDateString() : 'N/A'}`;
      if (status === "To Do") msg = `Task "${updatedTask.title}" was moved back to To Do.`;
      
      if (msg) {
        for (const recipient of recipients) {
          await createNotification(
            recipient,
            req.user.id,
            "STATUS_CHANGE",
            msg,
            `/taskboard/${task.project._id}?task=${task._id}`
          );
        }
      }
    }

    // Real-time board update (emit to everyone in the project)
    const { emitToProject } = await import("../socket.js");
    emitToProject(task.project._id.toString(), "task_status_changed", {
      taskId: updatedTask._id,
      newStatus: status || updatedTask.status
    });

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getWeeklyProductivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await Task.aggregate([
      {
        $match: {
          project: new mongoose.Types.ObjectId(projectId),
          status: "Done",
          completedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate("project");
    if (!task) return res.status(404).json({ message: "Task not found" });

    const membership = await ProjectMember.findOne({ project: task.project._id, user: req.user.id });
    if (!membership || membership.role !== "Admin") {
      return res.status(403).json({ message: "Only project leaders can delete tasks" });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
