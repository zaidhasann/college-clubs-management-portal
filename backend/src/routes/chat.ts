import { Router } from "express";
import authMiddleware from "../middleware/auth";
import { getMessages, getChatSettings, updateChatSettings, pinMessage, unpinMessage, getPinnedMessage } from "../controllers/chat";

const router = Router();

// Get messages for a club
router.get("/:clubId/messages", authMiddleware, getMessages);

// Get chat settings
router.get("/:clubId/settings", authMiddleware, getChatSettings);

// Update chat settings (admin only)
router.put("/:clubId/settings", authMiddleware, updateChatSettings);

// Pin a message (admin only)
router.post("/:clubId/pin/:messageId", authMiddleware, pinMessage);

// Unpin message (admin only)
router.delete("/:clubId/pin", authMiddleware, unpinMessage);

// Get pinned message
router.get("/:clubId/pin", authMiddleware, getPinnedMessage);

export default router;
