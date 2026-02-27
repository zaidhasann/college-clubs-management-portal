import express from "express";
import {
  getPendingRequests,
  getAllRequests,
  approveAdminRequest,
  rejectAdminRequest,
} from "../controllers/adminRequest";
import authMiddleware from "../middleware/auth";

const router = express.Router();

router.use(authMiddleware);

router.get("/pending", getPendingRequests);
router.get("/", getAllRequests);
router.post("/:requestId/approve", approveAdminRequest);
router.post("/:requestId/reject", rejectAdminRequest);

export default router;
