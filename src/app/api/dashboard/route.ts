import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Donor, { BLOOD_GROUPS } from "@/models/Donor";
import BloodInventory from "@/models/BloodInventory";
import BloodRequest from "@/models/BloodRequest";
import DonationRecord from "@/models/DonationRecord";

// GET /api/dashboard - Compute live operational metrics from MongoDB
export async function GET() {
  try {
    await connectToDatabase();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalDonors,
      activeDonors,
      totalDonationRecords,
      pendingRequestsCount,
      criticalRequestsCount,
      fulfilledRequestsCount,
      expiringUnitsAgg,
      stockByGroupAgg,
      recentDonations,
      recentRequests,
    ] = await Promise.all([
      Donor.countDocuments(),
      Donor.countDocuments({ status: "Active" }),
      DonationRecord.countDocuments(),
      BloodRequest.countDocuments({ status: "Pending" }),
      BloodRequest.countDocuments({
        urgency: "Critical",
        status: { $in: ["Pending", "Approved"] },
      }),
      BloodRequest.countDocuments({ status: "Fulfilled" }),
      // Expiring stock in the next 7 days that is marked Available
      BloodInventory.aggregate([
        {
          $match: {
            status: "Available",
            expiryDate: { $gte: now, $lte: sevenDaysFromNow },
          },
        },
        { $group: { _id: null, totalExpiring: { $sum: "$units" } } },
      ]),
      // Stock breakdown by blood group for unexpired available units
      BloodInventory.aggregate([
        {
          $match: {
            status: "Available",
            expiryDate: { $gt: now },
            units: { $gt: 0 },
          },
        },
        { $group: { _id: "$bloodGroup", totalUnits: { $sum: "$units" } } },
      ]),
      // Latest 5 donations
      DonationRecord.find()
        .sort({ donationDate: -1 })
        .limit(5)
        .lean(),
      // Latest 5 blood requests
      BloodRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Build complete stock distribution across all 8 blood groups
    const stockDistribution: Record<string, number> = {};
    BLOOD_GROUPS.forEach((bg) => {
      stockDistribution[bg] = 0;
    });

    stockByGroupAgg.forEach((item) => {
      if (item._id && stockDistribution[item._id] !== undefined) {
        stockDistribution[item._id] = item.totalUnits;
      }
    });

    const totalAvailableUnits = Object.values(stockDistribution).reduce(
      (sum, count) => sum + count,
      0
    );

    const expiringUnitsSoon = expiringUnitsAgg[0]?.totalExpiring || 0;

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          totalDonors,
          activeDonors,
          totalAvailableUnits,
          totalDonationRecords,
          pendingRequestsCount,
          criticalRequestsCount,
          fulfilledRequestsCount,
          expiringUnitsSoon,
        },
        stockDistribution,
        recentDonations,
        recentRequests,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute dashboard metrics." },
      { status: 500 }
    );
  }
}
