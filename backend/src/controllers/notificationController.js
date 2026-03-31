import Notification from "../models/Notification.js";
import { emitToUser } from "../socket.js";

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("sender", "name");
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user.id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === "all") {
      await Notification.updateMany({ recipient: req.user.id }, { isRead: true });
    } else {
      await Notification.findByIdAndUpdate(id, { isRead: true });
    }
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to create notification (internal use)
export const createNotification = async (recipient, sender, type, message, link) => {
  try {
    const notification = new Notification({ recipient, sender, type, message, link });
    await notification.save();
    
    // Emit real-time update
    console.log(`Sending real-time notification to user ${recipient.toString()}...`);
    emitToUser(recipient.toString(), "new_notification", {
      notification,
      unreadCount: await Notification.countDocuments({ recipient, isRead: false })
    });
    
    return notification;
  } catch (err) {
    console.error("Failed to create notification", err);
  }
};
