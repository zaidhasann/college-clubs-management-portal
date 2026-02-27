import mongoose, { Schema, Document } from "mongoose";

export interface IRegistration extends Document {
  user: mongoose.Types.ObjectId;
  event: mongoose.Types.ObjectId;
  status: "registered" | "attended" | "cancelled";
  registeredAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    status: { type: String, enum: ["registered", "attended", "cancelled"], default: "registered" },
    registeredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Ensure one user can only register once for an event
RegistrationSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.model<IRegistration>("Registration", RegistrationSchema);
