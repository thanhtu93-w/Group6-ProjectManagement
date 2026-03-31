import express from "express";
import { sendMessage, getMessagesByTask } from "../controllers/messageController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", sendMessage);
router.get("/task/:taskId", getMessagesByTask);

export default router;
