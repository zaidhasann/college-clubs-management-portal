import { Request, Response } from "express";
import Event from "../models/Event";
import Registration from "../models/Registration";
import User from "../models/User";

// Check in a user to an event (QR code scan)
export const checkIn = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const { userId, qrCode } = req.body;

    // Validate event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let registration;
    let user;

    // Check-in by QR code (from scanner) or by userId (from attendance page)
    if (qrCode) {
      // Find registration by QR code
      registration = await Registration.findOne({ qrCode }).populate("user");
      
      if (!registration) {
        return res.status(404).json({ message: "QR code not found" });
      }

      if (registration.event.toString() !== eventId) {
        return res.status(400).json({ message: "QR code is for a different event" });
      }

      user = registration.user as any;
    } else if (userId) {
      // Find registration by user ID
      registration = await Registration.findOne({
        event: eventId,
        user: userId,
        status: { $ne: "cancelled" },
      }).populate("user");

      if (!registration) {
        return res.status(400).json({ message: "User is not registered for this event" });
      }

      user = registration.user as any;
    } else {
      return res.status(400).json({ message: "QR code or user ID required" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already checked in
    if (registration.isCheckedIn) {
      return res.status(400).json({ message: "User already checked in" });
    }

    // Add user to event attendance if not already there
    if (!event.attendance.includes(user._id as any)) {
      event.attendance.push(user._id as any);
    }
    event.attendanceCount = event.attendance.length;
    await event.save();

    // Update registration status
    registration.isCheckedIn = true;
    registration.checkedInAt = new Date();
    registration.status = "attended";
    await registration.save();

    return res.status(200).json({
      message: "Check-in successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      attendanceCount: event.attendanceCount,
    });
  } catch (error) {
    console.error("Error during check-in:", error);
    return res.status(500).json({ message: "Server error: " + (error as Error).message });
  }
};

// Get attendance list for an event
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate(
      "attendance",
      "name email rollNumber"
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    return res.status(200).json({
      eventId: event._id,
      eventTitle: event.title,
      attendance: event.attendance,
      attendanceCount: event.attendanceCount,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get attendance statistics for an event
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate("participants", "name email rollNumber")
      .populate("attendance", "name email rollNumber");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get all non-cancelled registrations
    const approvedRegistrations = await Registration.find({
      event: eventId,
      status: { $ne: "cancelled" },
    }).populate("user", "name email rollNumber");

    const registeredUsers = approvedRegistrations.map((reg) => reg.user);
    const attendedUsers = event.attendance;

    // Calculate who registered but didn't attend
    const registeredButNotAttended = registeredUsers.filter(
      (user: any) =>
        !event.attendance.some((attended: any) =>
          attended._id.equals(user._id)
        )
    );

    const attendancePercentage =
      registeredUsers.length > 0
        ? ((event.attendanceCount / registeredUsers.length) * 100).toFixed(2)
        : "0";

    return res.status(200).json({
      eventId: event._id,
      eventTitle: event.title,
      eventDate: event.date,
      stats: {
        totalRegistered: registeredUsers.length,
        totalAttended: event.attendanceCount,
        attendancePercentage: `${attendancePercentage}%`,
        notAttended: registeredUsers.length - event.attendanceCount,
      },
      registeredUsers,
      attendedUsers,
      registeredButNotAttended,
    });
  } catch (error) {
    console.error("Error fetching attendance stats:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Remove a user from attendance (undo check-in)
export const removeCheckIn = async (req: Request, res: Response) => {
  try {
    const { eventId, userId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is in attendance
    const attendanceIndex = event.attendance.findIndex((id) =>
      id.equals(userId as any)
    );

    if (attendanceIndex === -1) {
      return res
        .status(400)
        .json({ message: "User is not checked in to this event" });
    }

    // Remove user from attendance
    event.attendance.splice(attendanceIndex, 1);
    event.attendanceCount = event.attendance.length;
    await event.save();

    // Update registration status
    const registration = await Registration.findOne({
      event: eventId,
      user: userId,
    });

    if (registration) {
      registration.isCheckedIn = false;
      registration.checkedInAt = undefined;
      registration.status = "registered";
      await registration.save();
    }

    return res.status(200).json({
      message: "Check-in removed successfully",
      attendanceCount: event.attendanceCount,
    });
  } catch (error) {
    console.error("Error removing check-in:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
