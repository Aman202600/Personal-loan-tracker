import mongoose, { Document, Schema } from 'mongoose';

export interface IOtp extends Document {
  phoneNumber: string;
  otp: string;
  attempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    phoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically remove document when expired
    },
  },
  {
    timestamps: true,
  }
);

export const Otp = mongoose.model<IOtp>('Otp', OtpSchema);
