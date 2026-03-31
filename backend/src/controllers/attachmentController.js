import Attachment from "../models/Attachment.js";

export const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const attachment = new Attachment({
      filename: req.file.originalname,
      url: `/uploads/${req.file.filename}`, // Assuming local storage for now
      uploadedBy: req.user.id,
      task: req.body.taskId,
    });
    await attachment.save();
    res.status(201).json(attachment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAttachmentsByTask = async (req, res) => {
  try {
    const attachments = await Attachment.find({ task: req.params.taskId });
    res.json(attachments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
