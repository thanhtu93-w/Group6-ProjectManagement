import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  getMembers,
  getProjectRole,
  removeMember,
  updateProjectNotes,
} from "../controllers/projectController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

router.put("/:id/notes", updateProjectNotes);

// Member management
router.post("/:id/members", addMember);
router.get("/:id/members", getMembers);
router.delete("/:id/members/:userId", removeMember);
router.get("/:id/role", getProjectRole, (req, res) => res.json({ role: req.projectRole }));

export default router;
