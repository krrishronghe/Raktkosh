import mongoose, { Schema, Document, Model } from "mongoose";
import { BLOOD_GROUPS, BloodGroup, DONOR_STATUSES, DonorStatus } from "@/types";

export * from "@/types";

export interface IDonor extends Document {
  donorId: string;
  fullName: string;
  bloodGroup: BloodGroup;
  age: number;
  gender: "Male" | "Female" | "Other";
  contactNumber: string;
  email?: string;
  city: string;
  lastDonationDate?: Date;
  status: DonorStatus;
  createdAt: Date;
  updatedAt: Date;
}

const DonorSchema = new Schema<IDonor>(
  {
    donorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: BLOOD_GROUPS,
      index: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Donor must be at least 18 years old"],
      max: [65, "Donor age must not exceed 65 years"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    lastDonationDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: DONOR_STATUSES,
      default: "Active",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "donors",
  }
);

const Donor: Model<IDonor> =
  mongoose.models.Donor || mongoose.model<IDonor>("Donor", DonorSchema);

export default Donor;
