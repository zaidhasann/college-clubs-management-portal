import { Response } from "express";
import AdminRequest from "../models/AdminRequest";
import User from "../models/User";
import { AuthRequest } from "../middleware/auth";

// Get pending admin requests (main admin only)
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view requests" });
    }

    const requests = await AdminRequest.find({ status: "pending" })
      .populate("userId", "name email")
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get all admin requests history
export const getAllRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can view requests" });
    }

    const requests = await AdminRequest.find()
      .populate("userId", "name email")
      .populate("approvedBy", "name email")
      .sort({ requestedAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Approve admin request
export const approveAdminRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can approve requests" });
    }

    const { requestId } = req.params;
    const adminRequest = await AdminRequest.findById(requestId);

    if (!adminRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (adminRequest.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
    }

    // Update request
    adminRequest.status = "approved";
    adminRequest.approvedAt = new Date();
    adminRequest.approvedBy = req.user.id as any;
    await adminRequest.save();

    // Update user role
    const user = await User.findById(adminRequest.userId);
    if (user) {
      user.role = "admin";
      await user.save();
    }

    res.json({ message: "Admin request approved", adminRequest });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Reject admin request
export const rejectAdminRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can reject requests" });
    }

    const { requestId } = req.params;
    const adminRequest = await AdminRequest.findById(requestId);

    if (!adminRequest) {
      return res.status(404).json({ error: "Request not found" });
    }

    if (adminRequest.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
    }

    // Update request
    adminRequest.status = "rejected";
    adminRequest.approvedAt = new Date();
    adminRequest.approvedBy = req.user.id as any;
    await adminRequest.save();

    res.json({ message: "Admin request rejected", adminRequest });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
