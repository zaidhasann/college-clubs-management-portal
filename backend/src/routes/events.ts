import express from "express";
import {
  getAllEvents,
  getEventById,
  getMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getUserRegistrations,
} from "../controllers/events";
import authMiddleware from "../middleware/auth";

const router = express.Router();

router.get("/", getAllEvents);
router.get("/my-events", authMiddleware, getMyEvents);
router.get("/user/registrations", authMiddleware, getUserRegistrations);
router.post("/", authMiddleware, createEvent);
router.get("/:id", getEventById);
router.put("/:id", authMiddleware, updateEvent);
router.delete("/:id", authMiddleware, deleteEvent);
router.post("/:id/register", authMiddleware, registerForEvent);

export default router;
