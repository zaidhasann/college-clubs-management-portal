import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import Club from "./models/Club";
import Message from "./models/Message";

interface AuthSocket extends Socket {
  userId?: string;
  userRole?: string;
  userName?: string;
}

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // Auth middleware — verify JWT on connection
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as any;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userName = decoded.name;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: AuthSocket) => {
    console.log(`🔌 User connected: ${socket.userId}`);

    // Join a club chat room
    socket.on("join-club", async (clubId: string) => {
      try {
        const club = await Club.findById(clubId);
        if (!club) return socket.emit("error", "Club not found");

        const isMember = club.members.some(
          (m) => m.toString() === socket.userId
        );
        const isAdmin = club.admin.toString() === socket.userId;

        if (!isMember && !isAdmin) {
          return socket.emit("error", "You are not a member of this club");
        }

        socket.join(`club:${clubId}`);
        socket.emit("joined-club", { clubId });
      } catch (err) {
        socket.emit("error", "Failed to join club chat");
      }
    });

    // Leave a club chat room
    socket.on("leave-club", (clubId: string) => {
      socket.leave(`club:${clubId}`);
    });

    // Send a message
    socket.on("send-message", async (data: { clubId: string; text: string }) => {
      try {
        const { clubId, text } = data;
        if (!text || !text.trim()) return;

        const club = await Club.findById(clubId);
        if (!club) return socket.emit("error", "Club not found");

        const isMember = club.members.some(
          (m) => m.toString() === socket.userId
        );
        const isAdmin = club.admin.toString() === socket.userId;

        if (!isMember && !isAdmin) {
          return socket.emit("error", "You are not a member of this club");
        }

        // Check chat mode: if admin_only, only the admin can send messages
        const chatMode = club.chatMode || "open";
        if (chatMode === "admin_only" && !isAdmin) {
          return socket.emit("error", "Only the admin can send messages in this club");
        }

        // Save message
        const message = await Message.create({
          club: clubId,
          sender: socket.userId,
          text: text.trim(),
        });

        // Populate sender info
        const populated = await Message.findById(message._id)
          .populate("sender", "name email role")
          .lean();

        // Broadcast to all members in the room
        io.to(`club:${clubId}`).emit("new-message", populated);
      } catch (err) {
        console.error("Send message error:", err);
        socket.emit("error", "Failed to send message");
      }
    });

    // Notify room when chat mode changes
    socket.on("chat-mode-changed", (data: { clubId: string; chatMode: string }) => {
      io.to(`club:${data.clubId}`).emit("chat-mode-updated", {
        chatMode: data.chatMode,
      });
    });

    // Notify room when a message is pinned/unpinned
    socket.on("message-pinned", (data: { clubId: string; pinnedMessage: any }) => {
      io.to(`club:${data.clubId}`).emit("message-pinned-updated", {
        pinnedMessage: data.pinnedMessage,
      });
    });

    socket.on("message-unpinned", (data: { clubId: string }) => {
      io.to(`club:${data.clubId}`).emit("message-pinned-updated", {
        pinnedMessage: null,
      });
    });

    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
    });
  });

  return io;
}
