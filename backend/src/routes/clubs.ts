import express from "express";
import {
  getAllClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  joinClub,
  getMyClub,
  addPhotoToClub,
  removePhotoFromClub,
} from "../controllers/clubs";
import authMiddleware from "../middleware/auth";

const router = express.Router();

router.get("/", getAllClubs);
router.get("/my-club", authMiddleware, getMyClub);
router.get("/:id", getClubById);
router.post("/", authMiddleware, createClub);
router.put("/:id", authMiddleware, updateClub);
router.delete("/:id", authMiddleware, deleteClub);
router.post("/:id/join", authMiddleware, joinClub);
router.post("/:id/photos", authMiddleware, addPhotoToClub);
router.delete("/:id/photos", authMiddleware, removePhotoFromClub);

export default router;
