import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import BloodRequest, {
  REQUEST_STATUSES,
  REQUEST_URGENCIES,
  RequestStatus,
  RequestUrgency,
} from "@/models/BloodRequest";
import BloodInventory from "@/models/BloodInventory";
import { BLOOD_GROUPS, BloodGroup } from "@/models/Donor";

// GET /api/requests/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const bloodReq = await BloodRequest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }],
    }).lean();

    if (!bloodReq) {
      return NextResponse.json({ success: false, error: "Blood request not found." }, { status: 404 });
    }

    // Check available inventory for this blood group in real time
    const now = new Date();
    const inventorySummary = await BloodInventory.aggregate([
      {
        $match: {
          bloodGroup: bloodReq.bloodGroup,
          status: "Available",
          expiryDate: { $gt: now },
          units: { $gt: 0 },
        },
      },
      { $group: { _id: "$bloodGroup", totalAvailable: { $sum: "$units" } } },
    ]);

    const availableUnits = inventorySummary[0]?.totalAvailable || 0;

    return NextResponse.json({
      success: true,
      data: {
        ...bloodReq,
        availableUnitsInStock: availableUnits,
      },
    });
  } catch (error) {
    console.error("GET /api/requests/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve blood request." }, { status: 500 });
  }
}

// PUT /api/requests/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const {
      patientOrHospitalName,
      contactNumber,
      bloodGroup,
      unitsRequested,
      urgency,
      status,
      requiredByDate,
      notes,
      fulfillUnits, // Optional specific action to fulfill from stock
    } = body;

    const existingReq = await BloodRequest.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }],
    });

    if (!existingReq) {
      return NextResponse.json({ success: false, error: "Blood request not found." }, { status: 404 });
    }

    // Handle Stock Fulfillment Workflow if requested
    if (fulfillUnits || status === "Fulfilled") {
      const unitsToFulfill = fulfillUnits ? Number(fulfillUnits) : (existingReq.unitsRequested - existingReq.allocatedUnits);

      if (unitsToFulfill > 0) {
        const now = new Date();
        // Find valid, non-expired inventory batches for this blood group, FIFO by expiryDate
        const availableBatches = await BloodInventory.find({
          bloodGroup: existingReq.bloodGroup,
          status: "Available",
          expiryDate: { $gt: now },
          units: { $gt: 0 },
        }).sort({ expiryDate: 1 });

        const totalAvailable = availableBatches.reduce((acc, b) => acc + b.units, 0);

        if (totalAvailable < unitsToFulfill) {
          return NextResponse.json(
            {
              success: false,
              error: `Insufficient stock in inventory to fulfill request. Available: ${totalAvailable} units of ${existingReq.bloodGroup}. Requested fulfillment: ${unitsToFulfill} units.`,
            },
            { status: 400 }
          );
        }

        // Deduct units FIFO across batches
        let remainingToDeduct = unitsToFulfill;
        for (const batch of availableBatches) {
          if (remainingToDeduct <= 0) break;

          if (batch.units <= remainingToDeduct) {
            remainingToDeduct -= batch.units;
            batch.units = 0;
            batch.status = "Reserved";
            await batch.save();
          } else {
            batch.units -= remainingToDeduct;
            remainingToDeduct = 0;
            await batch.save();
          }
        }

        existingReq.allocatedUnits += unitsToFulfill;
        if (existingReq.allocatedUnits >= existingReq.unitsRequested) {
          existingReq.status = "Fulfilled";
        } else {
          existingReq.status = "Partially Fulfilled";
        }
      }
    } else if (status !== undefined) {
      if (!REQUEST_STATUSES.includes(status as RequestStatus)) {
        return NextResponse.json({ success: false, error: "Invalid request status." }, { status: 400 });
      }
      existingReq.status = status;
    }

    if (patientOrHospitalName !== undefined) existingReq.patientOrHospitalName = patientOrHospitalName.trim();
    if (contactNumber !== undefined) existingReq.contactNumber = contactNumber.trim();
    if (bloodGroup !== undefined) {
      if (!BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
        return NextResponse.json({ success: false, error: "Invalid blood group." }, { status: 400 });
      }
      existingReq.bloodGroup = bloodGroup;
    }
    if (unitsRequested !== undefined) {
      const u = Number(unitsRequested);
      if (isNaN(u) || u < 1) {
        return NextResponse.json({ success: false, error: "Units requested must be at least 1." }, { status: 400 });
      }
      existingReq.unitsRequested = u;
    }
    if (urgency !== undefined) {
      if (!REQUEST_URGENCIES.includes(urgency as RequestUrgency)) {
        return NextResponse.json({ success: false, error: "Invalid urgency level." }, { status: 400 });
      }
      existingReq.urgency = urgency;
    }
    if (requiredByDate !== undefined) existingReq.requiredByDate = new Date(requiredByDate);
    if (notes !== undefined) existingReq.notes = notes.trim();

    await existingReq.save();

    return NextResponse.json({
      success: true,
      message: "Blood request updated successfully.",
      data: existingReq,
    });
  } catch (error) {
    console.error("PUT /api/requests/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update blood request." }, { status: 500 });
  }
}

// DELETE /api/requests/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const deleted = await BloodRequest.findOneAndDelete({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { requestId: id }],
    });

    if (!deleted) {
      return NextResponse.json({ success: false, error: "Blood request not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Blood request ${deleted.requestId} (${deleted.patientOrHospitalName}) removed successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/requests/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete blood request." }, { status: 500 });
  }
}
