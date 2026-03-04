import mongoose, { Schema, Document } from "mongoose";

export interface IClubJoinRequest extends Document {
  userId: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
}

const ClubJoinRequestSchema = new Schema<IClubJoinRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    requestedAt: { type: Date, default: Date.now },
    approvedAt: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Ensure one request per user per club (any status)
ClubJoinRequestSchema.index({ userId: 1, clubId: 1 }, { unique: true });

export default mongoose.model<IClubJoinRequest>("ClubJoinRequest", ClubJoinRequestSchema);
