import mongoose from "mongoose";
import Donor from "../models/Donor";
import BloodInventory from "../models/BloodInventory";
import BloodRequest from "../models/BloodRequest";
import DonationRecord from "../models/DonationRecord";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/raktkosh";

async function seed() {
  console.log("Connecting to MongoDB for seeding...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected successfully.");

  // Clear existing demonstration data
  await Donor.deleteMany({});
  await BloodInventory.deleteMany({});
  await BloodRequest.deleteMany({});
  await DonationRecord.deleteMany({});
  console.log("Cleared existing collections.");

  // 1. Seed Donors
  const donorsData = [
    {
      donorId: "DNR-1001",
      fullName: "Aarav Sharma",
      bloodGroup: "O+",
      age: 28,
      gender: "Male" as const,
      contactNumber: "+91 98765 43210",
      email: "aarav.sharma@example.com",
      city: "Mumbai",
      status: "Active" as const,
      lastDonationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    },
    {
      donorId: "DNR-1002",
      fullName: "Ananya Iyer",
      bloodGroup: "A+",
      age: 32,
      gender: "Female" as const,
      contactNumber: "+91 98112 23344",
      email: "ananya.iyer@example.com",
      city: "Bengaluru",
      status: "Active" as const,
      lastDonationDate: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000),
    },
    {
      donorId: "DNR-1003",
      fullName: "Rohan Verma",
      bloodGroup: "B+",
      age: 24,
      gender: "Male" as const,
      contactNumber: "+91 97654 32109",
      email: "rohan.verma@example.com",
      city: "Delhi",
      status: "Active" as const,
      lastDonationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
    {
      donorId: "DNR-1004",
      fullName: "Meera Nair",
      bloodGroup: "O-",
      age: 29,
      gender: "Female" as const,
      contactNumber: "+91 94455 66778",
      email: "meera.nair@example.com",
      city: "Kochi",
      status: "Active" as const,
      lastDonationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      donorId: "DNR-1005",
      fullName: "Vikram Malhotra",
      bloodGroup: "AB+",
      age: 36,
      gender: "Male" as const,
      contactNumber: "+91 98220 11223",
      email: "vikram.m@example.com",
      city: "Pune",
      status: "Active" as const,
      lastDonationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      donorId: "DNR-1006",
      fullName: "Pooja Deshmukh",
      bloodGroup: "B-",
      age: 26,
      gender: "Female" as const,
      contactNumber: "+91 98334 55667",
      email: "pooja.d@example.com",
      city: "Nagpur",
      status: "Inactive" as const,
      lastDonationDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    },
    {
      donorId: "DNR-1007",
      fullName: "Karan Johar",
      bloodGroup: "A-",
      age: 34,
      gender: "Male" as const,
      contactNumber: "+91 98990 44332",
      email: "karan.j@example.com",
      city: "Jaipur",
      status: "Deferred" as const,
      lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    },
    {
      donorId: "DNR-1008",
      fullName: "Sneha Patel",
      bloodGroup: "AB-",
      age: 27,
      gender: "Female" as const,
      contactNumber: "+91 97234 11229",
      email: "sneha.p@example.com",
      city: "Ahmedabad",
      status: "Active" as const,
      lastDonationDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
  ];

  const createdDonors = await Donor.insertMany(donorsData);
  console.log(`Inserted ${createdDonors.length} donors.`);

  // 2. Seed Blood Inventory (Whole blood, shelf life ~35-42 days)
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const inventoryData = [
    {
      inventoryId: "INV-2001",
      bloodGroup: "O+",
      units: 14,
      collectionDate: new Date(now - 10 * dayMs),
      expiryDate: new Date(now + 25 * dayMs),
      storageLocation: "Cold Vault Alpha - Rack 1",
      status: "Available" as const,
      notes: "Routine collection drive batch #1",
    },
    {
      inventoryId: "INV-2002",
      bloodGroup: "A+",
      units: 18,
      collectionDate: new Date(now - 7 * dayMs),
      expiryDate: new Date(now + 28 * dayMs),
      storageLocation: "Cold Vault Alpha - Rack 2",
      status: "Available" as const,
      notes: "Screened and cleared for transfusion",
    },
    {
      inventoryId: "INV-2003",
      bloodGroup: "B+",
      units: 12,
      collectionDate: new Date(now - 5 * dayMs),
      expiryDate: new Date(now + 30 * dayMs),
      storageLocation: "Cold Vault Beta - Rack 1",
      status: "Available" as const,
    },
    {
      inventoryId: "INV-2004",
      bloodGroup: "O-",
      units: 6,
      collectionDate: new Date(now - 14 * dayMs),
      expiryDate: new Date(now + 21 * dayMs),
      storageLocation: "Universal Reserve - Rack 1",
      status: "Available" as const,
      notes: "Universal donor units - high priority reserve",
    },
    {
      inventoryId: "INV-2005",
      bloodGroup: "AB+",
      units: 8,
      collectionDate: new Date(now - 32 * dayMs),
      expiryDate: new Date(now + 3 * dayMs), // Approaching expiry
      storageLocation: "Cold Vault Gamma - Rack 3",
      status: "Available" as const,
      notes: "Approaching expiry window (< 5 days remaining)",
    },
    {
      inventoryId: "INV-2006",
      bloodGroup: "A-",
      units: 4,
      collectionDate: new Date(now - 45 * dayMs),
      expiryDate: new Date(now - 5 * dayMs), // Expired
      storageLocation: "Quarantine Bay - Bin Q",
      status: "Expired" as const,
      notes: "Expired past 42 days window - scheduled for autoclaving",
    },
    {
      inventoryId: "INV-2007",
      bloodGroup: "B-",
      units: 5,
      collectionDate: new Date(now - 18 * dayMs),
      expiryDate: new Date(now + 17 * dayMs),
      storageLocation: "Cold Vault Beta - Rack 2",
      status: "Reserved" as const,
      notes: "Reserved for pending surgical case at Lilavati Hospital",
    },
    {
      inventoryId: "INV-2008",
      bloodGroup: "AB-",
      units: 3,
      collectionDate: new Date(now - 12 * dayMs),
      expiryDate: new Date(now + 23 * dayMs),
      storageLocation: "Universal Reserve - Rack 2",
      status: "Available" as const,
    },
  ];

  const createdInventory = await BloodInventory.insertMany(inventoryData);
  console.log(`Inserted ${createdInventory.length} inventory records.`);

  // 3. Seed Blood Requests
  const requestsData = [
    {
      requestId: "REQ-3001",
      patientOrHospitalName: "City Care Super-Speciality Hospital",
      contactNumber: "+91 22 2456 7890",
      bloodGroup: "O+",
      unitsRequested: 4,
      allocatedUnits: 4,
      urgency: "Critical" as const,
      status: "Fulfilled" as const,
      requiredByDate: new Date(now - 1 * dayMs),
      notes: "Emergency trauma surgery - fully dispatched",
    },
    {
      requestId: "REQ-3002",
      patientOrHospitalName: "Apex Heart & Lung Institute",
      contactNumber: "+91 80 4321 8765",
      bloodGroup: "A+",
      unitsRequested: 3,
      allocatedUnits: 0,
      urgency: "Urgent" as const,
      status: "Pending" as const,
      requiredByDate: new Date(now + 2 * dayMs),
      notes: "Scheduled bypass surgery for patient Rajesh K.",
    },
    {
      requestId: "REQ-3003",
      patientOrHospitalName: "St. Jude Memorial Hospital",
      contactNumber: "+91 11 2678 1234",
      bloodGroup: "O-",
      unitsRequested: 2,
      allocatedUnits: 0,
      urgency: "Critical" as const,
      status: "Approved" as const,
      requiredByDate: new Date(now + 1 * dayMs),
      notes: "Pediatric leukemia emergency requirement",
    },
    {
      requestId: "REQ-3004",
      patientOrHospitalName: "Apollo Clinics - Thane",
      contactNumber: "+91 22 2876 5432",
      bloodGroup: "B+",
      unitsRequested: 2,
      allocatedUnits: 1,
      urgency: "Normal" as const,
      status: "Partially Fulfilled" as const,
      requiredByDate: new Date(now + 4 * dayMs),
      notes: "Dialysis patient support unit",
    },
    {
      requestId: "REQ-3005",
      patientOrHospitalName: "Metro General Hospital",
      contactNumber: "+91 20 2567 9900",
      bloodGroup: "AB-",
      unitsRequested: 1,
      allocatedUnits: 0,
      urgency: "Normal" as const,
      status: "Pending" as const,
      requiredByDate: new Date(now + 5 * dayMs),
      notes: "Elective orthopedic procedure",
    },
    {
      requestId: "REQ-3006",
      patientOrHospitalName: "Fortis Healthcare",
      contactNumber: "+91 124 456 7890",
      bloodGroup: "A-",
      unitsRequested: 5,
      allocatedUnits: 0,
      urgency: "Normal" as const,
      status: "Rejected" as const,
      requiredByDate: new Date(now - 3 * dayMs),
      notes: "Request submitted with incomplete clinical requisition documentation",
    },
  ];

  const createdRequests = await BloodRequest.insertMany(requestsData);
  console.log(`Inserted ${createdRequests.length} blood requests.`);

  // 4. Seed Donation Records (linking to created donors)
  const donationRecordsData = [
    {
      donationId: "DON-4001",
      donorId: createdDonors[0]._id,
      donorCode: createdDonors[0].donorId,
      donorName: createdDonors[0].fullName,
      bloodGroup: createdDonors[0].bloodGroup,
      donationDate: new Date(now - 45 * dayMs),
      unitsDonated: 1,
      collectionCenter: "Central Blood Bank - Andheri Center",
      status: "Completed" as const,
      notes: "Donor felt healthy; post-donation vitals normal.",
    },
    {
      donationId: "DON-4002",
      donorId: createdDonors[1]._id,
      donorCode: createdDonors[1].donorId,
      donorName: createdDonors[1].fullName,
      bloodGroup: createdDonors[1].bloodGroup,
      donationDate: new Date(now - 70 * dayMs),
      unitsDonated: 1,
      collectionCenter: "Red Cross Camp - Koramangala",
      status: "Completed" as const,
    },
    {
      donationId: "DON-4003",
      donorId: createdDonors[2]._id,
      donorCode: createdDonors[2].donorId,
      donorName: createdDonors[2].fullName,
      bloodGroup: createdDonors[2].bloodGroup,
      donationDate: new Date(now - 15 * dayMs),
      unitsDonated: 1,
      collectionCenter: "AIIMS Blood Transfusion Unit",
      status: "Completed" as const,
      notes: "Whole blood donation 450ml.",
    },
    {
      donationId: "DON-4004",
      donorId: createdDonors[3]._id,
      donorCode: createdDonors[3].donorId,
      donorName: createdDonors[3].fullName,
      bloodGroup: createdDonors[3].bloodGroup,
      donationDate: new Date(now - 90 * dayMs),
      unitsDonated: 1,
      collectionCenter: "General Hospital Blood Bank Kochi",
      status: "Completed" as const,
    },
    {
      donationId: "DON-4005",
      donorId: createdDonors[4]._id,
      donorCode: createdDonors[4].donorId,
      donorName: createdDonors[4].fullName,
      bloodGroup: createdDonors[4].bloodGroup,
      donationDate: new Date(now - 30 * dayMs),
      unitsDonated: 1,
      collectionCenter: "Armed Forces Medical College Center",
      status: "Completed" as const,
    },
    {
      donationId: "DON-4006",
      donorId: createdDonors[7]._id,
      donorCode: createdDonors[7].donorId,
      donorName: createdDonors[7].fullName,
      bloodGroup: createdDonors[7].bloodGroup,
      donationDate: new Date(now - 60 * dayMs),
      unitsDonated: 1,
      collectionCenter: "Civil Hospital Transfusion Center",
      status: "Completed" as const,
    },
  ];

  const createdDonations = await DonationRecord.insertMany(donationRecordsData);
  console.log(`Inserted ${createdDonations.length} donation records.`);

  console.log("Database seeded successfully with initial operational records!");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
