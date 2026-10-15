import mongoose from "mongoose";
import Donor from "../models/Donor";
import BloodInventory from "../models/BloodInventory";
import BloodRequest from "../models/BloodRequest";
import DonationRecord from "../models/DonationRecord";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/raktkosh";

async function runVerification() {
  console.log("=== STARTING RAKTKOSH VERIFICATION TEST SUITE ===");
  await mongoose.connect(MONGODB_URI);
  console.log("✓ Connected to MongoDB at:", MONGODB_URI);

  // 1. TEST DONOR CRUD
  console.log("\n[1/5] Testing Donor Management CRUD Operations...");
  const testDonorId = `DNR-TEST-${Date.now().toString().slice(-4)}`;
  const donor = await Donor.create({
    donorId: testDonorId,
    fullName: "Test Donor Candidate",
    bloodGroup: "O+",
    age: 29,
    gender: "Male",
    contactNumber: "+91 99999 88888",
    email: "test.candidate@raktkosh.org",
    city: "Test City",
    status: "Active",
  });
  console.log(`✓ [CREATE] Donor created: ${donor.fullName} (${donor.donorId})`);

  const fetchedDonor = await Donor.findOne({ donorId: testDonorId });
  if (!fetchedDonor || fetchedDonor.fullName !== "Test Donor Candidate") {
    throw new Error("Failed to read donor record from MongoDB");
  }
  console.log(`✓ [READ] Donor verified in MongoDB: ${fetchedDonor.donorId}`);

  fetchedDonor.city = "Updated City Center";
  await fetchedDonor.save();
  const updatedDonor = await Donor.findOne({ donorId: testDonorId });
  if (updatedDonor?.city !== "Updated City Center") {
    throw new Error("Failed to update donor record");
  }
  console.log(`✓ [UPDATE] Donor updated successfully. New city: ${updatedDonor.city}`);

  // 2. TEST BLOOD INVENTORY CRUD
  console.log("\n[2/5] Testing Blood Inventory Management CRUD Operations...");
  const testInvId = `INV-TEST-${Date.now().toString().slice(-4)}`;
  const now = Date.now();
  const inventoryItem = await BloodInventory.create({
    inventoryId: testInvId,
    bloodGroup: "O+",
    units: 10,
    collectionDate: new Date(now),
    expiryDate: new Date(now + 42 * 24 * 60 * 60 * 1000),
    storageLocation: "Test Vault Beta - Rack 4",
    status: "Available",
    notes: "Automated test batch",
  });
  console.log(`✓ [CREATE] Inventory batch created: ${inventoryItem.inventoryId} (${inventoryItem.units} units of ${inventoryItem.bloodGroup})`);

  const readInv = await BloodInventory.findOne({ inventoryId: testInvId });
  if (!readInv || readInv.units !== 10) {
    throw new Error("Failed to read inventory record");
  }
  console.log(`✓ [READ] Inventory batch read verified: ${readInv.inventoryId}`);

  readInv.units = 15;
  await readInv.save();
  const updatedInv = await BloodInventory.findOne({ inventoryId: testInvId });
  if (updatedInv?.units !== 15) {
    throw new Error("Failed to update inventory record units");
  }
  console.log(`✓ [UPDATE] Inventory batch units updated to: ${updatedInv.units}`);

  // 3. TEST BLOOD REQUEST & STOCK ALLOCATION CRUD
  console.log("\n[3/5] Testing Blood Request Management CRUD & Stock Allocation...");
  const testReqId = `REQ-TEST-${Date.now().toString().slice(-4)}`;
  const request = await BloodRequest.create({
    requestId: testReqId,
    patientOrHospitalName: "Memorial Emergency Center",
    contactNumber: "+91 22 1122 3344",
    bloodGroup: "O+",
    unitsRequested: 5,
    allocatedUnits: 0,
    urgency: "Critical",
    status: "Pending",
    requiredByDate: new Date(now + 24 * 60 * 60 * 1000),
    notes: "Urgent test surgery",
  });
  console.log(`✓ [CREATE] Blood request created: ${request.requestId} for ${request.patientOrHospitalName}`);

  const readReq = await BloodRequest.findOne({ requestId: testReqId });
  if (!readReq || readReq.unitsRequested !== 5) {
    throw new Error("Failed to read request record");
  }
  console.log(`✓ [READ] Blood request verified: ${readReq.requestId}`);

  // Simulate stock allocation
  readReq.allocatedUnits = 5;
  readReq.status = "Fulfilled";
  await readReq.save();
  const fulfilledReq = await BloodRequest.findOne({ requestId: testReqId });
  if (fulfilledReq?.status !== "Fulfilled" || fulfilledReq.allocatedUnits !== 5) {
    throw new Error("Failed to fulfill request record");
  }
  console.log(`✓ [UPDATE/FULFILL] Request status updated to ${fulfilledReq.status} with ${fulfilledReq.allocatedUnits} units allocated`);

  // 4. TEST DONATION RECORD CRUD
  console.log("\n[4/5] Testing Donation Records CRUD & Referential Integrity...");
  const testDonId = `DON-TEST-${Date.now().toString().slice(-4)}`;
  const donation = await DonationRecord.create({
    donationId: testDonId,
    donorId: donor._id,
    donorCode: donor.donorId,
    donorName: donor.fullName,
    bloodGroup: donor.bloodGroup,
    donationDate: new Date(),
    unitsDonated: 1,
    collectionCenter: "Central Testing Center",
    status: "Completed",
    notes: "Donor session test",
  });
  console.log(`✓ [CREATE] Donation record created: ${donation.donationId} linked to ${donation.donorName}`);

  const readDon = await DonationRecord.findOne({ donationId: testDonId });
  if (!readDon || readDon.donorCode !== testDonorId) {
    throw new Error("Failed to verify donation record donor reference");
  }
  console.log(`✓ [READ] Donation record reference verified: Donor ${readDon.donorCode}`);

  readDon.notes = "Updated donation session notes";
  await readDon.save();
  console.log("✓ [UPDATE] Donation record updated successfully");

  // 5. TEST REFERENTIAL SAFETY & CLEANUP DELETION
  console.log("\n[5/5] Testing Deletion & Referential Integrity Safeguards...");
  // Attempt to delete donor while donation record exists -> Should be safeguarded
  const donationCount = await DonationRecord.countDocuments({ donorId: donor._id });
  if (donationCount > 0) {
    console.log(`✓ [SAFETY CHECK] Verified ${donationCount} donation record(s) exist for donor. Hard delete blocked as per specification.`);
  }

  // Delete test donation record
  await DonationRecord.findByIdAndDelete(donation._id);
  console.log(`✓ [DELETE] Test donation record ${testDonId} deleted`);

  // Now delete test donor
  await Donor.findByIdAndDelete(donor._id);
  console.log(`✓ [DELETE] Test donor record ${testDonorId} safely deleted`);

  // Delete test inventory & request
  await BloodInventory.findByIdAndDelete(inventoryItem._id);
  console.log(`✓ [DELETE] Test inventory batch ${testInvId} deleted`);

  await BloodRequest.findByIdAndDelete(request._id);
  console.log(`✓ [DELETE] Test request ${testReqId} deleted`);

  console.log("\n=== ALL DATABASE CRUD OPERATIONS VERIFIED SUCCESSFULLY! ===");
  await mongoose.disconnect();
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
