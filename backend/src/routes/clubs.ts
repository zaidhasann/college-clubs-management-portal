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
  setMainPhotoClub,
} from "../controllers/clubs";
import {
  getPendingClubJoinRequests,
  getAllClubJoinRequests,
  getJoinRequestStatus,
  approveClubJoinRequest,
  rejectClubJoinRequest,
} from "../controllers/clubJoinRequest";
import authMiddleware from "../middleware/auth";

const router = express.Router();

router.get("/", getAllClubs);
router.get("/my-club", authMiddleware, getMyClub);
router.get("/:id", getClubById);
router.post("/", authMiddleware, createClub);
router.put("/:id", authMiddleware, updateClub);
router.delete("/:id", authMiddleware, deleteClub);
router.post("/:id/join", authMiddleware, joinClub);
router.get("/:clubId/join-status", authMiddleware, getJoinRequestStatus);
router.post("/:id/photos", authMiddleware, addPhotoToClub);
router.post("/:id/set-main-photo", authMiddleware, setMainPhotoClub);
router.delete("/:id/photos", authMiddleware, removePhotoFromClub);

// Club join requests routes
router.get("/:clubId/join-requests/pending", authMiddleware, getPendingClubJoinRequests);
router.get("/:clubId/join-requests", authMiddleware, getAllClubJoinRequests);
router.post("/:clubId/join-requests/:requestId/approve", authMiddleware, approveClubJoinRequest);
router.post("/:clubId/join-requests/:requestId/reject", authMiddleware, rejectClubJoinRequest);

export default router;
