import { Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import AdminRequest from "../models/AdminRequest";
import { AuthRequest } from "../middleware/auth";

// Register
export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, registerAs, reason } = req.body;

    // Validate input
    if (!registerAs || !["member", "admin"].includes(registerAs)) {
      return res.status(400).json({ error: "Invalid registration type" });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Determine user role based on registration type
    const userCount = await User.countDocuments();
    let userRole = registerAs === "member" ? "member" : "pending_admin";

    // First user becomes main admin automatically
    if (userCount === 0) {
      userRole = "admin";
    }

    // Create new user
    const user = new User({ name, email, password, role: userRole });
    await user.save();

    // If registering as admin, create admin request
    if (registerAs === "admin" && userRole !== "admin") {
      await AdminRequest.create({
        userId: user._id,
        name,
        email,
        reason: reason || "No reason provided",
        status: "pending",
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: 
        userRole === "admin" 
          ? "Welcome! You are the main admin."
          : userRole === "pending_admin"
          ? "Admin request submitted! Waiting for approval."
          : "Member account created successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Login
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get current user
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
