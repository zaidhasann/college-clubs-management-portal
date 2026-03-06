import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Message from "../models/Message";
import Club from "../models/Club";

// GET /api/chat/:clubId/messages — get recent messages for a club
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: "Club not found" });

    // Only members or the admin can view messages
    const isMember = club.members.some(
      (m) => m.toString() === req.user!.id
    );
    const isAdmin = club.admin.toString() === req.user!.id;

    if (!isMember && !isAdmin) {
      return res.status(403).json({ error: "You are not a member of this club" });
    }

    const messages = await Message.find({ club: clubId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "name email role")
      .lean();

    // Return in chronological order
    res.json(messages.reverse());
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// GET /api/chat/:clubId/settings — get chat settings for a club
export const getChatSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const club = await Club.findById(clubId).select("chatMode admin name");
    if (!club) return res.status(404).json({ error: "Club not found" });

    res.json({
      chatMode: club.chatMode || "open",
      isAdmin: club.admin.toString() === req.user!.id,
      clubName: club.name,
    });
  } catch (error) {
    console.error("Get chat settings error:", error);
    res.status(500).json({ error: "Failed to fetch chat settings" });
  }
};

// PUT /api/chat/:clubId/settings — update chat mode (admin only)
export const updateChatSettings = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const { chatMode } = req.body;

    if (!["open", "admin_only"].includes(chatMode)) {
      return res.status(400).json({ error: "Invalid chat mode. Use 'open' or 'admin_only'" });
    }

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: "Club not found" });

    // Only the club admin can change chat settings
    if (club.admin.toString() !== req.user!.id) {
      return res.status(403).json({ error: "Only the club admin can change chat settings" });
    }

    club.chatMode = chatMode;
    await club.save();

    res.json({ message: `Chat mode updated to '${chatMode}'`, chatMode });
  } catch (error) {
    console.error("Update chat settings error:", error);
    res.status(500).json({ error: "Failed to update chat settings" });
  }
};

// POST /api/chat/:clubId/pin/:messageId — pin a message (admin only)
export const pinMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId, messageId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: "Club not found" });

    if (club.admin.toString() !== req.user!.id) {
      return res.status(403).json({ error: "Only the club admin can pin messages" });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.club.toString() !== clubId) {
      return res.status(400).json({ error: "Message does not belong to this club" });
    }

    club.pinnedMessage = message._id as any;
    await club.save();

    const populated = await Message.findById(messageId)
      .populate("sender", "name email role")
      .lean();

    res.json({ message: "Message pinned", pinnedMessage: populated });
  } catch (error) {
    console.error("Pin message error:", error);
    res.status(500).json({ error: "Failed to pin message" });
  }
};

// DELETE /api/chat/:clubId/pin — unpin the current pinned message (admin only)
export const unpinMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ error: "Club not found" });

    if (club.admin.toString() !== req.user!.id) {
      return res.status(403).json({ error: "Only the club admin can unpin messages" });
    }

    club.pinnedMessage = undefined;
    await club.save();

    res.json({ message: "Message unpinned" });
  } catch (error) {
    console.error("Unpin message error:", error);
    res.status(500).json({ error: "Failed to unpin message" });
  }
};

// GET /api/chat/:clubId/pin — get the pinned message for a club
export const getPinnedMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findById(clubId).populate({
      path: "pinnedMessage",
      populate: { path: "sender", select: "name email role" },
    });
    if (!club) return res.status(404).json({ error: "Club not found" });

    res.json({ pinnedMessage: club.pinnedMessage || null });
  } catch (error) {
    console.error("Get pinned message error:", error);
    res.status(500).json({ error: "Failed to get pinned message" });
  }
};
