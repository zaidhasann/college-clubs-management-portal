import express from "express";
import authMiddleware from "../middleware/auth";
import {
  checkIn,
  getAttendance,
  getAttendanceStats,
  removeCheckIn,
} from "../controllers/attendance";

const router = express.Router();

// Check in a user to an event (admin only)
router.post("/:eventId/checkin", authMiddleware, checkIn);

// Get attendance list for an event
router.get("/:eventId", authMiddleware, getAttendance);

// Get attendance statistics for an event
router.get("/:eventId/stats", authMiddleware, getAttendanceStats);

// Remove check-in (undo)
router.delete("/:eventId/checkin/:userId", authMiddleware, removeCheckIn);

export default router;
