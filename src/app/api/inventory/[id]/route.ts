import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import BloodInventory, { INVENTORY_STATUSES, InventoryStatus } from "@/models/BloodInventory";
import { BLOOD_GROUPS, BloodGroup } from "@/models/Donor";

// GET /api/inventory/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const item = await BloodInventory.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { inventoryId: id }],
    }).lean();

    if (!item) {
      return NextResponse.json({ success: false, error: "Inventory record not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("GET /api/inventory/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve inventory record." }, { status: 500 });
  }
}

// PUT /api/inventory/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const { bloodGroup, units, collectionDate, expiryDate, storageLocation, status, notes } = body;

    const updateFields: Record<string, unknown> = {};

    if (bloodGroup !== undefined) {
      if (!BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
        return NextResponse.json({ success: false, error: "Invalid blood group." }, { status: 400 });
      }
      updateFields.bloodGroup = bloodGroup;
    }

    if (units !== undefined) {
      const numericUnits = Number(units);
      if (isNaN(numericUnits) || numericUnits < 0) {
        return NextResponse.json({ success: false, error: "Units must be 0 or greater." }, { status: 400 });
      }
      updateFields.units = numericUnits;
    }

    if (collectionDate !== undefined) updateFields.collectionDate = new Date(collectionDate);
    if (expiryDate !== undefined) updateFields.expiryDate = new Date(expiryDate);
    if (storageLocation !== undefined) updateFields.storageLocation = storageLocation.trim();
    if (status !== undefined) {
      if (!INVENTORY_STATUSES.includes(status as InventoryStatus)) {
        return NextResponse.json({ success: false, error: "Invalid inventory status." }, { status: 400 });
      }
      updateFields.status = status;
    }
    if (notes !== undefined) updateFields.notes = notes.trim();

    const updated = await BloodInventory.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { inventoryId: id }] },
      { $set: updateFields },
      { returnDocument: "after", runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Inventory record not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Inventory record updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/inventory/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update inventory record." }, { status: 500 });
  }
}

// DELETE /api/inventory/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deleted = await BloodInventory.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { inventoryId: id }],
    });

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Inventory record not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Inventory batch ${deleted.inventoryId} (${deleted.bloodGroup}, ${deleted.units} units) removed successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/inventory/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete inventory record." }, { status: 500 });
  }
}
