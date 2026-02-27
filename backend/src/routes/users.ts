import express from "express";
import {
  getAllUsers,
  promoteToAdmin,
  demoteToMember,
  deleteUser,
} from "../controllers/users";
import authMiddleware from "../middleware/auth";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get("/", getAllUsers);
router.post("/:userId/promote", promoteToAdmin);
router.post("/:userId/demote", demoteToMember);
router.delete("/:userId", deleteUser);

export default router;
