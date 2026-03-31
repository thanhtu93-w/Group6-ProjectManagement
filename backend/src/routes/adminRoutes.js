
import express from "express";
import { getSystemStats, getAllUsers, getAllProjects, deleteUser, deleteProject } from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/stats", getSystemStats);
router.get("/users", getAllUsers);
router.get("/projects", getAllProjects);
router.delete("/users/:id", deleteUser);
router.delete("/projects/:id", deleteProject);

export default router;
