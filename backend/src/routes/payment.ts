import express from "express";
import { createPaymentOrder, verifyPayment } from "../controllers/payment";
import authMiddleware from "../middleware/auth";

const router = express.Router();

// Create Razorpay order for a paid event
router.post("/order/:eventId", authMiddleware, createPaymentOrder);

// Verify payment after Razorpay checkout
router.post("/verify", authMiddleware, verifyPayment);

export default router;
