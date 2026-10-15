import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import DonationRecord, {
  DONATION_STATUSES,
  DonationStatus,
} from "@/models/DonationRecord";

// GET /api/donations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const record = await DonationRecord.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donationId: id }],
    }).lean();

    if (!record) {
      return NextResponse.json({ success: false, error: "Donation record not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error("GET /api/donations/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve donation record." }, { status: 500 });
  }
}

// PUT /api/donations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const { unitsDonated, collectionCenter, status, donationDate, notes } = body;

    const updateFields: Record<string, unknown> = {};

    if (unitsDonated !== undefined) {
      const u = Number(unitsDonated);
      if (isNaN(u) || u < 1) {
        return NextResponse.json({ success: false, error: "Units donated must be at least 1." }, { status: 400 });
      }
      updateFields.unitsDonated = u;
    }

    if (collectionCenter !== undefined) updateFields.collectionCenter = collectionCenter.trim();
    if (status !== undefined) {
      if (!DONATION_STATUSES.includes(status as DonationStatus)) {
        return NextResponse.json({ success: false, error: "Invalid donation status." }, { status: 400 });
      }
      updateFields.status = status;
    }
    if (donationDate !== undefined) updateFields.donationDate = new Date(donationDate);
    if (notes !== undefined) updateFields.notes = notes.trim();

    const updated = await DonationRecord.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donationId: id }] },
      { $set: updateFields },
      { returnDocument: "after", runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Donation record not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Donation record updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("PUT /api/donations/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update donation record." }, { status: 500 });
  }
}

// DELETE /api/donations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deleted = await DonationRecord.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donationId: id }],
    });

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Donation record not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Donation record ${deleted.donationId} (${deleted.donorName}) removed successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/donations/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete donation record." }, { status: 500 });
  }
}
