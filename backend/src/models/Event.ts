import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  date: Date;
  deadline: Date;
  createdBy: mongoose.Types.ObjectId;
  price: number;
  isPaid: boolean;
  status: "upcoming" | "completed";
  registrationsCount: number;
  participants: mongoose.Types.ObjectId[];
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
    status: { type: String, enum: ["upcoming", "completed"], default: "upcoming" },
    registrationsCount: { type: Number, default: 0 },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model<IEvent>("Event", EventSchema);
