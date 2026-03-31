import express from "express";
import multer from "multer";
import { uploadAttachment, getAttachmentsByTask } from "../controllers/attachmentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(authMiddleware);

router.post("/", upload.single("file"), uploadAttachment);
router.get("/task/:taskId", getAttachmentsByTask);

export default router;
