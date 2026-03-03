import { Response } from "express";
import ClubJoinRequest from "../models/ClubJoinRequest";
import Club from "../models/Club";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

// Get pending join requests for a club (club admin only)
export const getPendingClubJoinRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.admin.toString() !== req.user?.id && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to view join requests" });
    }

    const requests = await ClubJoinRequest.find({ clubId, status: "pending" })
      .populate("userId", "name email")
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get all join requests for a club
export const getAllClubJoinRequests = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId } = req.params;
    const club = await Club.findById(clubId);

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.admin.toString() !== req.user?.id && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to view join requests" });
    }

    const requests = await ClubJoinRequest.find({ clubId })
      .populate("userId", "name email")
      .populate("approvedBy", "name email")
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get user's join request status for a club
export const getJoinRequestStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { clubId } = req.params;

    const request = await ClubJoinRequest.findOne({
      userId: req.user?.id,
      clubId,
    });

    res.json({ request, status: request?.status || null });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Approve club join request
export const approveClubJoinRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const joinRequest = await ClubJoinRequest.findById(requestId);

    if (!joinRequest) {
      return res.status(404).json({ error: "Join request not found" });
    }

    const club = await Club.findById(joinRequest.clubId);
    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.admin.toString() !== req.user?.id && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to approve requests" });
    }

    if (joinRequest.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
    }

    // Update request
    joinRequest.status = "approved";
    joinRequest.approvedAt = new Date();
    joinRequest.approvedBy = req.user.id as any;
    await joinRequest.save();

    // Add user to club members
    if (!club.members.includes(joinRequest.userId)) {
      club.members.push(joinRequest.userId);
    }
    if (club.pendingMembers) {
      club.pendingMembers = club.pendingMembers.filter(
        (id) => id.toString() !== joinRequest.userId.toString()
      );
    }
    await club.save();

    // Update user's clubsJoined
    const user = await User.findById(joinRequest.userId);
    if (user && !user.clubsJoined.includes(joinRequest.clubId as any)) {
      user.clubsJoined.push(joinRequest.clubId as any);
      await user.save();
    }

    await joinRequest.populate("userId", "name email");
    await joinRequest.populate("approvedBy", "name email");

    res.json({ message: "Join request approved", joinRequest });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Reject club join request
export const rejectClubJoinRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const joinRequest = await ClubJoinRequest.findById(requestId);

    if (!joinRequest) {
      return res.status(404).json({ error: "Join request not found" });
    }

    const club = await Club.findById(joinRequest.clubId);
    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.admin.toString() !== req.user?.id && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to reject requests" });
    }

    if (joinRequest.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
    }

    // Update request
    joinRequest.status = "rejected";
    joinRequest.approvedAt = new Date();
    joinRequest.approvedBy = req.user.id as any;
    await joinRequest.save();

    // Remove from pending members if exists
    if (club.pendingMembers) {
      club.pendingMembers = club.pendingMembers.filter(
        (id) => id.toString() !== joinRequest.userId.toString()
      );
      await club.save();
    }

    await joinRequest.populate("userId", "name email");
    await joinRequest.populate("approvedBy", "name email");

    res.json({ message: "Join request rejected", joinRequest });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
