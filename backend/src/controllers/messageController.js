import Message from "../models/Message.js";
import Task from "../models/Task.js";
import { createNotification } from "./notificationController.js";
import { emitToProject } from "../socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { task: taskId, content, attachments, mentions } = req.body;
    const message = new Message({
      task: taskId,
      sender: req.user.id,
      content,
      attachments,
    });
    await message.save();

    // Notify task members and emit real-time event
    const task = await Task.findById(taskId).populate("project");
    if (task) {
      // 1. Notify assignees
      if (task.assignees && task.assignees.length > 0) {
        for (const assigneeId of task.assignees) {
          if (assigneeId.toString() !== req.user.id) {
            await createNotification(
              assigneeId,
              req.user.id,
              "MESSAGE",
              `New message in task: ${task.title}`,
              `/taskboard/${task.project._id}?task=${task._id}`
            );
          }
        }
      }

      // 2. Notify mentioned users
      if (mentions && mentions.length > 0) {
        const User = await import("../models/User.js").then(m => m.default);
        for (const mention of mentions) {
          // Find user by name (partial match, e.g. @Thanh matches Thanh Tu)
          const mentionedUser = await User.findOne({ name: { $regex: new RegExp(mention, "i") } });
          if (mentionedUser && mentionedUser._id.toString() !== req.user.id) {
            // Check if they are a member of the project first
            const ProjectMember = await import("../models/ProjectMember.js").then(m => m.default);
            const isMember = await ProjectMember.findOne({ project: task.project._id, user: mentionedUser._id });
            if (isMember) {
              await createNotification(
                mentionedUser._id,
                req.user.id,
                "MENTION",
                `You were mentioned in task: ${task.title}`,
                `/taskboard/${task.project._id}?task=${task._id}`
              );
            }
          }
        }
      }
      
      // Emit to project room for real-time counters
      emitToProject(task.project._id.toString(), "new_message", { 
        taskId, 
        senderId: req.user.id 
      });
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessagesByTask = async (req, res) => {
  try {
    const messages = await Message.find({ task: req.params.taskId })
      .populate("sender", "name email")
      .populate("attachments");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
