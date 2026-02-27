import express from "express";
import { register, login, getMe } from "../controllers/auth";
import authMiddleware from "../middleware/auth";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);

export default router;
