import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import BloodInventory, { INVENTORY_STATUSES, InventoryStatus } from "@/models/BloodInventory";
import { BLOOD_GROUPS, BloodGroup } from "@/models/Donor";

// GET /api/inventory - List blood inventory with filters and summary
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const bloodGroup = searchParams.get("bloodGroup") || "";
    const status = searchParams.get("status") || "";
    const filterExpiring = searchParams.get("expiring") === "true";
    const filterExpired = searchParams.get("expired") === "true";

    const query: Record<string, unknown> = {};

    if (bloodGroup && BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
      query.bloodGroup = bloodGroup;
    }

    if (status && INVENTORY_STATUSES.includes(status as InventoryStatus)) {
      query.status = status;
    }

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (filterExpired) {
      query.expiryDate = { $lt: now };
    } else if (filterExpiring) {
      query.expiryDate = { $gte: now, $lte: sevenDaysLater };
      query.status = "Available";
    }

    const inventory = await BloodInventory.find(query).sort({ expiryDate: 1 }).lean();

    // Calculate aggregated inventory summary by blood group
    const summaryAgg = await BloodInventory.aggregate([
      { $match: { status: "Available", expiryDate: { $gt: now } } },
      { $group: { _id: "$bloodGroup", totalUnits: { $sum: "$units" } } },
    ]);

    const stockByGroup: Record<string, number> = {};
    BLOOD_GROUPS.forEach((bg) => {
      stockByGroup[bg] = 0;
    });
    summaryAgg.forEach((item) => {
      stockByGroup[item._id] = item.totalUnits;
    });

    return NextResponse.json({
      success: true,
      data: inventory,
      stockByGroup,
      totalAvailableUnits: Object.values(stockByGroup).reduce((acc, curr) => acc + curr, 0),
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/inventory error:", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve inventory." }, { status: 500 });
  }
}

// POST /api/inventory - Add new blood inventory record
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { bloodGroup, units, collectionDate, expiryDate, storageLocation, status, notes } = body;

    if (!bloodGroup || !BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
      return NextResponse.json({ success: false, error: "Valid blood group is required." }, { status: 400 });
    }

    const numericUnits = Number(units);
    if (isNaN(numericUnits) || numericUnits <= 0) {
      return NextResponse.json({ success: false, error: "Units must be a positive number." }, { status: 400 });
    }

    if (!storageLocation || !storageLocation.trim()) {
      return NextResponse.json({ success: false, error: "Storage location is required." }, { status: 400 });
    }

    const colDate = collectionDate ? new Date(collectionDate) : new Date();
    // Default expiry is 42 days from collection for whole blood if not specified
    const expDate = expiryDate ? new Date(expiryDate) : new Date(colDate.getTime() + 42 * 24 * 60 * 60 * 1000);

    if (expDate <= colDate) {
      return NextResponse.json({ success: false, error: "Expiry date must be after collection date." }, { status: 400 });
    }

    // Auto-detect if already expired
    let finalStatus: InventoryStatus = status || "Available";
    if (expDate < new Date() && finalStatus === "Available") {
      finalStatus = "Expired";
    }

    // Generate readable inventory ID: INV-XXXX
    const lastItem = await BloodInventory.findOne({ inventoryId: /^INV-\d+$/ })
      .sort({ inventoryId: -1 })
      .lean();
    let nextNum = 2001;
    if (lastItem && lastItem.inventoryId) {
      const match = lastItem.inventoryId.match(/INV-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    while (await BloodInventory.exists({ inventoryId: `INV-${nextNum}` })) {
      nextNum++;
    }
    const inventoryId = `INV-${nextNum}`;

    const newRecord = await BloodInventory.create({
      inventoryId,
      bloodGroup,
      units: numericUnits,
      collectionDate: colDate,
      expiryDate: expDate,
      storageLocation: storageLocation.trim(),
      status: finalStatus,
      notes: notes ? notes.trim() : undefined,
    });

    return NextResponse.json(
      { success: true, message: "Inventory record added successfully.", data: newRecord },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/inventory error:", error);
    return NextResponse.json({ success: false, error: "Failed to add inventory record." }, { status: 500 });
  }
}
