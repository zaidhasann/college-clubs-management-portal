import { Response } from "express";
import Club from "../models/Club";
import ClubJoinRequest from "../models/ClubJoinRequest";
import { AuthRequest } from "../middleware/auth";

// Get all clubs
export const getAllClubs = async (req: AuthRequest, res: Response) => {
  try {
    const clubs = await Club.find().populate("admin", "name email").populate("members", "name email");
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get club by ID
export const getClubById = async (req: AuthRequest, res: Response) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate("admin", "name email")
      .populate("members", "name email");
    
    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    res.json(club);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Create club (admin only, one club per admin)
export const createClub = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create clubs" });
    }

    // Check if admin already has a club
    const existingClub = await Club.findOne({ admin: req.user.id });
    if (existingClub) {
      return res.status(400).json({ error: "You can only create one club. Edit your existing club instead." });
    }

    const { name, description } = req.body;

    const club = new Club({
      name,
      description,
      admin: req.user.id,
      members: [req.user.id],
      photos: [],
    });

    await club.save();
    await club.populate("admin", "name email");
    res.status(201).json(club);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Update club
export const updateClub = async (req: AuthRequest, res: Response) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.admin.toString() !== req.user?.id && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to update this club" });
    }

    Object.assign(club, req.body);
    await club.save();

    res.json(club);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Delete club
export const deleteClub = async (req: AuthRequest, res: Response) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.admin.toString() !== req.user?.id && req.user?.role !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this club" });
    }

    await Club.findByIdAndDelete(req.params.id);
    res.json({ message: "Club deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Join club (creates a pending request)
export const joinClub = async (req: AuthRequest, res: Response) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.members.includes(req.user?.id as any)) {
      return res.status(400).json({ error: "Already a member of this club" });
    }

    // Check if already has a pending request
    const existingRequest = await ClubJoinRequest.findOne({
      userId: req.user?.id,
      clubId: club._id,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ error: "You already have a pending join request" });
    }

    // Create a join request
    const joinRequest = new ClubJoinRequest({
      userId: req.user?.id,
      clubId: club._id,
      status: "pending",
    });

    await joinRequest.save();

    // Add to pending members
    if (!club.pendingMembers) {
      club.pendingMembers = [];
    }
    if (!club.pendingMembers.includes(req.user?.id as any)) {
      club.pendingMembers.push(req.user?.id as any);
    }
    await club.save();

    res.json({ message: "Join request created. Waiting for admin approval", joinRequest });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get admin's own club
export const getMyClub = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can access this" });
    }

    const club = await Club.findOne({ admin: req.user.id })
      .populate("admin", "name email")
      .populate("members", "name email");

    if (!club) {
      return res.status(404).json({ error: "You don't have a club yet" });
    }

    res.json(club);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Add photo to club (admin only)
export const addPhotoToClub = async (req: AuthRequest, res: Response) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.admin.toString() !== req.user?.id) {
      return res.status(403).json({ error: "Only club admin can add photos" });
    }

    const { photoUrl, isMainPhoto } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: "Photo URL is required" });
    }

    if (!club.photos) {
      club.photos = [];
    }

    if (isMainPhoto) {
      club.mainPhoto = photoUrl;
    }

    if (!club.photos.includes(photoUrl)) {
      club.photos.push(photoUrl);
    }
    await club.save();
    await club.populate("admin", "name email");

    res.json(club);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Set main photo for club
export const setMainPhotoClub = async (req: AuthRequest, res: Response) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.admin.toString() !== req.user?.id) {
      return res.status(403).json({ error: "Only club admin can set main photo" });
    }

    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: "Photo URL is required" });
    }

    if (!club.photos.includes(photoUrl)) {
      return res.status(400).json({ error: "Photo not found in club photos" });
    }

    club.mainPhoto = photoUrl;
    await club.save();
    await club.populate("admin", "name email");

    res.json(club);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Remove photo from club (admin only)
export const removePhotoFromClub = async (req: AuthRequest, res: Response) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    if (club.admin.toString() !== req.user?.id) {
      return res.status(403).json({ error: "Only club admin can remove photos" });
    }

    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: "Photo URL is required" });
    }

    club.photos = club.photos.filter(p => p !== photoUrl);
    await club.save();
    await club.populate("admin", "name email");

    res.json(club);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
