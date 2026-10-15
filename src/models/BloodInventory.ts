import mongoose, { Schema, Document, Model } from "mongoose";
import { BLOOD_GROUPS, BloodGroup } from "./Donor";

export const INVENTORY_STATUSES = [
  "Available",
  "Reserved",
  "Expired",
  "Discarded",
] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

export interface IBloodInventory extends Document {
  inventoryId: string;
  bloodGroup: BloodGroup;
  units: number;
  collectionDate: Date;
  expiryDate: Date;
  storageLocation: string;
  status: InventoryStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BloodInventorySchema = new Schema<IBloodInventory>(
  {
    inventoryId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    bloodGroup: {
      type: String,
      required: [true, "Blood group is required"],
      enum: BLOOD_GROUPS,
      index: true,
    },
    units: {
      type: Number,
      required: [true, "Units quantity is required"],
      min: [0, "Quantity cannot be negative"],
    },
    collectionDate: {
      type: Date,
      required: [true, "Collection date is required"],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
      index: true,
    },
    storageLocation: {
      type: String,
      required: [true, "Storage location is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: INVENTORY_STATUSES,
      default: "Available",
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "blood_inventory",
  }
);

const BloodInventory: Model<IBloodInventory> =
  mongoose.models.BloodInventory ||
  mongoose.model<IBloodInventory>("BloodInventory", BloodInventorySchema);

export default BloodInventory;
