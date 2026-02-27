import { Response } from "express";
import Event from "../models/Event";
import Registration from "../models/Registration";
import { AuthRequest } from "../middleware/auth";

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

    const { title, description, date, deadline, price, isPaid } = req.body;

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

    // Create registration
    const registration = new Registration({
      user: req.user?.id,
      event: req.params.id,
      status: "registered",
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
