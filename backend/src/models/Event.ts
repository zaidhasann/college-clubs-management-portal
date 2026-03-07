import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  deadline: Date;
  createdBy: mongoose.Types.ObjectId;
  price: number;
  isPaid: boolean;
  capacity: number;
  status: "upcoming" | "completed";
  registrationsCount: number;
  participants: mongoose.Types.ObjectId[];
  attendance: mongoose.Types.ObjectId[];
  attendanceCount: number;
  mainPhoto?: string;
  photos: string[];
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    deadline: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    capacity: { type: Number, default: 0 },
    status: { type: String, enum: ["upcoming", "completed"], default: "upcoming" },
    registrationsCount: { type: Number, default: 0 },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attendance: [{ type: Schema.Types.ObjectId, ref: "User" }],
    attendanceCount: { type: Number, default: 0 },
    mainPhoto: { type: String },
    photos: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>("Event", EventSchema);
