import { Response } from "express";
import User from "../models/User";
import Club from "../models/Club";
import Registration from "../models/Registration";
import ClubJoinRequest from "../models/ClubJoinRequest";
import { AuthRequest } from "../middleware/auth";

// Get all users (admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view users" });
    }

    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Promote user to admin (admin only)
export const promoteToAdmin = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can promote users" });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ error: "User is already an admin" });
    }

    user.role = "admin";
    await user.save();

    res.json({ message: "User promoted to admin", user });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Demote admin to member (admin only)
export const demoteToMember = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can demote users" });
    }

    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.role === "member") {
      return res.status(400).json({ error: "User is already a member" });
    }

    // Prevent demoting the last admin
    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount === 1 && user.role === "admin") {
      return res.status(400).json({ error: "Cannot demote the last admin" });
    }

    user.role = "member";
    await user.save();

    res.json({ message: "User demoted to member", user });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can delete users" });
    }

    const { userId } = req.params;

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Cascade: remove all related data for this user
    await ClubJoinRequest.deleteMany({ userId });
    await Registration.deleteMany({ user: userId });

    // Remove user from any club member lists
    await Club.updateMany(
      { "members._id": userId },
      { $pull: { members: { _id: userId } } }
    );
    // Also handle if members are stored as ObjectIds
    await Club.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
