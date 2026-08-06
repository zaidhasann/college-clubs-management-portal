import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import http from "http";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import clubRoutes from "./routes/clubs";
import eventRoutes from "./routes/events";
import userRoutes from "./routes/users";
import adminRequestRoutes from "./routes/adminRequest";
import paymentRoutes from "./routes/payment";
import chatRoutes from "./routes/chat";
import attendanceRoutes from "./routes/attendance";
import { setupSocket } from "./socket";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware: configure CORS origins from environment for deployment-ready behavior
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://clubmanchh.onrender.com',
  'http://localhost:3000',
];

// Log allowed origins for debugging deployed CORS issues
console.log('Allowed CORS origins:', allowedOrigins);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, Postman, or same-origin server-to-server)
      if (!origin) return callback(null, true);

      // Exact match against configured allowed origins
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      // Allow any Render-hosted frontend subdomain (e.g. https://*.onrender.com)
      try {
        if (origin.endsWith('.onrender.com')) {
          return callback(null, true);
        }
      } catch (e) {
        /* ignore */
      }

      // Not allowed
      return callback(new Error('CORS policy: origin not allowed'), false);
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin-requests", adminRequestRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/attendance", attendanceRoutes);

// Start server and connect to database
const startServer = async () => {
  await connectDB();

  // Setup Socket.io
  setupSocket(server);
  
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
