import mongoose, { Schema, Document, Model } from "mongoose";
import { BLOOD_GROUPS, BloodGroup, DONATION_STATUSES, DonationStatus } from "@/types";

export * from "@/types";

export interface IDonationRecord extends Document {
  donationId: string;
  donorId: mongoose.Types.ObjectId;
  donorCode: string;
  donorName: string;
  bloodGroup: BloodGroup;
  donationDate: Date;
  unitsDonated: number;
  collectionCenter: string;
  status: DonationStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationRecordSchema = new Schema<IDonationRecord>(
  {
    donationId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    donorId: {
      type: Schema.Types.ObjectId,
      ref: "Donor",
      required: [true, "Donor reference is required"],
      index: true,
    },
    donorCode: {
      type: String,
      required: [true, "Donor ID code is required"],
      trim: true,
    },
    donorName: {
      type: String,
      required: [true, "Donor name is required"],
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: BLOOD_GROUPS,
      index: true,
    },
    donationDate: {
      type: Date,
      required: [true, "Donation date is required"],
      default: Date.now,
    },
    unitsDonated: {
      type: Number,
      required: [true, "Units donated is required"],
      min: [1, "At least 1 unit must be donated"],
      default: 1,
    },
    collectionCenter: {
      type: String,
      required: [true, "Collection center is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: DONATION_STATUSES,
      default: "Completed",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "donation_records",
  }
);

const DonationRecord: Model<IDonationRecord> =
  mongoose.models.DonationRecord ||
  mongoose.model<IDonationRecord>("DonationRecord", DonationRecordSchema);

export default DonationRecord;
