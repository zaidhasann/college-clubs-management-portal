import express from "express";
import { checkInWithQR } from "../controllers/events";
import {
  getAllEvents,
  getEventById,
  getMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getUserRegistrations,
  addPhotoToEvent,
  setMainPhotoEvent,
  removePhotoFromEvent,
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
router.post("/:id/photos", authMiddleware, addPhotoToEvent);
router.post("/:id/set-main-photo", authMiddleware, setMainPhotoEvent);
router.delete("/:id/photos", authMiddleware, removePhotoFromEvent);
router.post("/checkin", authMiddleware, checkInWithQR);

export default router;
