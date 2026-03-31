import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }],
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);