import mongoose, { Schema, Document } from "mongoose";

export interface IClub extends Document {
  name: string;
  description: string;
  admin: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  photos: string[];
  eventsCount: number;
  createdAt: Date;
}

const ClubSchema = new Schema<IClub>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    admin: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    photos: [{ type: String }],
    eventsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IClub>("Club", ClubSchema);
