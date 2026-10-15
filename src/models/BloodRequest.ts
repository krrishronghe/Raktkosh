import mongoose, { Schema, Document, Model } from "mongoose";
import { BLOOD_GROUPS, BloodGroup } from "./Donor";

export const REQUEST_URGENCIES = ["Normal", "Urgent", "Critical"] as const;
export type RequestUrgency = (typeof REQUEST_URGENCIES)[number];

export const REQUEST_STATUSES = [
  "Pending",
  "Approved",
  "Partially Fulfilled",
  "Fulfilled",
  "Rejected",
  "Cancelled",
] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface IBloodRequest extends Document {
  requestId: string;
  patientOrHospitalName: string;
  contactNumber: string;
  bloodGroup: BloodGroup;
  unitsRequested: number;
  allocatedUnits: number;
  urgency: RequestUrgency;
  status: RequestStatus;
  requiredByDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BloodRequestSchema = new Schema<IBloodRequest>(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    patientOrHospitalName: {
      type: String,
      required: [true, "Patient or hospital name is required"],
      trim: true,
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: BLOOD_GROUPS,
      index: true,
    },
    unitsRequested: {
      type: Number,
      required: [true, "Units requested is required"],
      min: [1, "At least 1 unit must be requested"],
    },
    allocatedUnits: {
      type: Number,
      default: 0,
      min: [0, "Allocated units cannot be negative"],
    },
    urgency: {
      type: String,
      enum: REQUEST_URGENCIES,
      default: "Normal",
      index: true,
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: "Pending",
      index: true,
    },
    requiredByDate: {
      type: Date,
      required: [true, "Required-by date is required"],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "blood_requests",
  }
);

const BloodRequest: Model<IBloodRequest> =
  mongoose.models.BloodRequest ||
  mongoose.model<IBloodRequest>("BloodRequest", BloodRequestSchema);

export default BloodRequest;
