import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import clubRoutes from "./routes/clubs";
import eventRoutes from "./routes/events";
import userRoutes from "./routes/users";
import adminRequestRoutes from "./routes/adminRequest";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin-requests", adminRequestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
