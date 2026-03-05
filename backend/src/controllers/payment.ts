import { Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Event from "../models/Event";
import Registration from "../models/Registration";
import { AuthRequest } from "../middleware/auth";

let razorpayInstance: Razorpay | null = null;

function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
  }
  return razorpayInstance;
}

// Create Razorpay order for paid event registration
export const createPaymentOrder = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    if (!event.isPaid || event.price <= 0) {
      return res.status(400).json({ error: "This is not a paid event" });
    }

    // Check deadline
    if (new Date() > new Date(event.deadline)) {
      return res.status(400).json({ error: "Registration deadline has passed" });
    }

    // Check if already registered
    const existingReg = await Registration.findOne({
      user: req.user?.id,
      event: event._id,
    });

    if (existingReg && existingReg.paymentStatus === "paid") {
      return res.status(400).json({ error: "Already registered and paid" });
    }

    // Check capacity
    if (event.capacity && event.participants.length >= event.capacity) {
      return res.status(400).json({ error: "Event is full" });
    }

    // Amount in paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(event.price * 100);

    const order = await getRazorpay().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `evt_${event._id}_usr_${req.user?.id}`,
      notes: {
        eventId: event._id.toString(),
        userId: req.user?.id || "",
        eventTitle: event.title,
      },
    });

    // Create or update a pending registration
    if (existingReg) {
      existingReg.razorpayOrderId = order.id;
      existingReg.paymentStatus = "pending";
      await existingReg.save();
    } else {
      const qrToken = crypto.randomBytes(16).toString("hex");

      await Registration.create({
        user: req.user?.id,
        event: event._id,
        status: "registered",
        qrCode: qrToken,
        paymentStatus: "pending",
        razorpayOrderId: order.id,
        amountPaid: event.price,
      });
    }

    res.json({
      orderId: order.id,
      amount: amountInPaise,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
      eventTitle: event.title,
    });
  } catch (error) {
    console.error("Payment order error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// Verify Razorpay payment after checkout
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }

    // Find the registration by order ID
    const registration = await Registration.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    // Mark payment as successful
    registration.paymentStatus = "paid";
    registration.razorpayPaymentId = razorpay_payment_id;
    registration.paidAt = new Date();
    await registration.save();

    // Add user to event participants if not already there
    const event = await Event.findById(registration.event);
    if (event && !event.participants.includes(registration.user as any)) {
      event.participants.push(registration.user as any);
      event.registrationsCount += 1;
      await event.save();
    }

    res.json({
      message: "Payment verified and registration confirmed!",
      registration,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};
