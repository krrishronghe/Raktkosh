// Core Constants & Types shared across Client and Server

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const DONOR_STATUSES = ["Active", "Inactive", "Deferred"] as const;
export type DonorStatus = (typeof DONOR_STATUSES)[number];

export const INVENTORY_STATUSES = [
  "Available",
  "Reserved",
  "Expired",
  "Discarded",
] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];

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

export const DONATION_STATUSES = [
  "Completed",
  "Under Screening",
  "Deferred",
] as const;
export type DonationStatus = (typeof DONATION_STATUSES)[number];
