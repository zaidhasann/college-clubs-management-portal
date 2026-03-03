import { Response } from "express";
import Event from "../models/Event";
import Registration from "../models/Registration";
import { AuthRequest } from "../middleware/auth";
import crypto from "crypto";

// Get all events
export const getAllEvents = async (req: AuthRequest, res: Response) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email")
      .populate("participants", "name email");
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get event by ID
export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("participants", "name email");
    
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get events created by the current admin
export const getMyEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can access this" });
    }

    const events = await Event.find({ createdBy: req.user.id })
      .populate("createdBy", "name email")
      .populate("participants", "name email");
    
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Create event (admin only)
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can create events" });
    }

    const { title, description, date, deadline, price, isPaid , capacity} = req.body;

    // Validate deadline is before event date
    if (new Date(deadline) >= new Date(date)) {
      return res.status(400).json({ error: "Deadline must be before event date" });
    }

    const event = new Event({
      title,
      description,
      date,
      deadline,
      createdBy: req.user.id,
      price: isPaid ? price : 0,
      isPaid: isPaid || false,
      capacity,
      status: "upcoming",

    });

    await event.save();
    await event.populate("createdBy", "name email");
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Update event
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (req.user?.role !== "admin" || event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the event creator can update this event" });
    }

    // Validate deadline if being updated
    if (req.body.deadline && req.body.date) {
      if (new Date(req.body.deadline) >= new Date(req.body.date)) {
        return res.status(400).json({ error: "Deadline must be before event date" });
      }
    } else if (req.body.deadline) {
      if (new Date(req.body.deadline) >= event.date) {
        return res.status(400).json({ error: "Deadline must be before event date" });
      }
    }

    Object.assign(event, req.body);
    await event.save();
    await event.populate("createdBy", "name email");

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Delete event
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (req.user?.role !== "admin" || event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the event creator can delete this event" });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Register for event
export const registerForEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      user: req.user?.id,
      event: req.params.id,
    });

    if (existingRegistration) {
      return res.status(400).json({ error: "Already registered for this event" });
    }
    // Check capacity
if (event.capacity && event.participants.length >= event.capacity) {
  return res.status(400).json({ error: "Event is full" });
}

    // Create registration
    const qrToken = crypto.randomBytes(16).toString("hex");

const registration = new Registration({
  user: req.user?.id,
  event: req.params.id,
  status: "registered",
  qrCode: qrToken,
});
    await registration.save();

    // Update event
    event.participants.push(req.user?.id as any);
    event.registrationsCount += 1;
    await event.save();

    res.status(201).json({ message: "Successfully registered for event", registration });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
export const checkInWithQR = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ error: "Only admins can scan QR codes" });
    }

    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ error: "QR code is required" });
    }

    const registration = await Registration.findOne({ qrCode })
      .populate("user", "name email")
      .populate("event", "title");

    if (!registration) {
      return res.status(404).json({ error: "Invalid QR code" });
    }

    if (registration.isCheckedIn) {
      return res.status(400).json({ error: "Already checked in" });
    }

    registration.isCheckedIn = true;
    registration.checkedInAt = new Date();
    registration.status = "attended"; // optional but recommended

    await registration.save();

    res.json({
      message: "Check-in successful",
      user: registration.user,
      event: registration.event,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
// Get user registrations
export const getUserRegistrations = async (req: AuthRequest, res: Response) => {
  try {
    const registrations = await Registration.find({ user: req.user?.id })
      .populate("event")
      .populate("user");
    
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
// Add photo to event (event creator only)
export const addPhotoToEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.createdBy.toString() !== req.user?.id) {
      return res.status(403).json({ error: "Only event creator can add photos" });
    }

    const { photoUrl, isMainPhoto } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: "Photo URL is required" });
    }

    if (!event.photos) {
      event.photos = [];
    }

    if (isMainPhoto) {
      event.mainPhoto = photoUrl;
    }

    if (!event.photos.includes(photoUrl)) {
      event.photos.push(photoUrl);
    }
    await event.save();
    await event.populate("createdBy", "name email");

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Set main photo for event
export const setMainPhotoEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.createdBy.toString() !== req.user?.id) {
      return res.status(403).json({ error: "Only event creator can set main photo" });
    }

    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: "Photo URL is required" });
    }

    if (!event.photos.includes(photoUrl)) {
      return res.status(400).json({ error: "Photo not found in event photos" });
    }

    event.mainPhoto = photoUrl;
    await event.save();
    await event.populate("createdBy", "name email");

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Remove photo from event (event creator only)
export const removePhotoFromEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (event.createdBy.toString() !== req.user?.id) {
      return res.status(403).json({ error: "Only event creator can remove photos" });
    }

    const { photoUrl } = req.body;
    if (!photoUrl) {
      return res.status(400).json({ error: "Photo URL is required" });
    }

    event.photos = event.photos.filter(p => p !== photoUrl);
    
    // If the removed photo was the main photo, clear it
    if (event.mainPhoto === photoUrl) {
      event.mainPhoto = undefined;
    }
    
    await event.save();
    await event.populate("createdBy", "name email");

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};