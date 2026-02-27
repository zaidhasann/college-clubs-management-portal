import mongoose, { Schema, Document } from "mongoose";

export interface IAdminRequest extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
}

const AdminRequestSchema = new Schema<IAdminRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<IAdminRequest>("AdminRequest", AdminRequestSchema);
