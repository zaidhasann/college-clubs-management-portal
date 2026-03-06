import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  club: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    club: { type: Schema.Types.ObjectId, ref: "Club", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// Index for fast retrieval of recent messages per club
MessageSchema.index({ club: 1, createdAt: -1 });

export default mongoose.model<IMessage>("Message", MessageSchema);
