import express from "express";
import {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  getWeeklyProductivity,
} from "../controllers/taskController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createTask);
router.get("/project/:projectId", getTasksByProject);
router.get("/project/:projectId/productivity", getWeeklyProductivity);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
