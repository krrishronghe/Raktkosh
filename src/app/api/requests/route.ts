import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import BloodRequest, {
  REQUEST_STATUSES,
  REQUEST_URGENCIES,
  RequestStatus,
  RequestUrgency,
} from "@/models/BloodRequest";
import { BLOOD_GROUPS, BloodGroup } from "@/models/Donor";

// GET /api/requests - List requests with search and filters
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const urgency = searchParams.get("urgency") || "";
    const status = searchParams.get("status") || "";

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { patientOrHospitalName: { $regex: search, $options: "i" } },
        { requestId: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
      ];
    }

    if (bloodGroup && BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
      query.bloodGroup = bloodGroup;
    }

    if (urgency && REQUEST_URGENCIES.includes(urgency as RequestUrgency)) {
      query.urgency = urgency;
    }

    if (status && REQUEST_STATUSES.includes(status as RequestStatus)) {
      query.status = status;
    }

    const requests = await BloodRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Summary counts for quick visual feedback
    const [pendingCount, criticalCount, fulfilledCount] = await Promise.all([
      BloodRequest.countDocuments({ status: "Pending" }),
      BloodRequest.countDocuments({ urgency: "Critical", status: { $in: ["Pending", "Approved"] } }),
      BloodRequest.countDocuments({ status: "Fulfilled" }),
    ]);

    return NextResponse.json({
      success: true,
      data: requests,
      stats: {
        pendingCount,
        criticalCount,
        fulfilledCount,
      },
    });
  } catch (error) {
    console.error("GET /api/requests error:", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve blood requests." }, { status: 500 });
  }
}

// POST /api/requests - Register a new blood request
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      patientOrHospitalName,
      contactNumber,
      bloodGroup,
      unitsRequested,
      urgency,
      requiredByDate,
      notes,
    } = body;

    if (!patientOrHospitalName || !patientOrHospitalName.trim()) {
      return NextResponse.json({ success: false, error: "Hospital or patient name is required." }, { status: 400 });
    }

    if (!contactNumber || !contactNumber.trim()) {
      return NextResponse.json({ success: false, error: "Contact number is required." }, { status: 400 });
    }

    if (!bloodGroup || !BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
      return NextResponse.json({ success: false, error: "Valid blood group is required." }, { status: 400 });
    }

    const units = Number(unitsRequested);
    if (isNaN(units) || units < 1) {
      return NextResponse.json({ success: false, error: "Units requested must be at least 1." }, { status: 400 });
    }

    if (!requiredByDate) {
      return NextResponse.json({ success: false, error: "Required-by date is required." }, { status: 400 });
    }

    // Generate readable request ID: REQ-XXXX
    const lastReq = await BloodRequest.findOne({ requestId: /^REQ-\d+$/ })
      .sort({ requestId: -1 })
      .lean();
    let nextNum = 3001;
    if (lastReq && lastReq.requestId) {
      const match = lastReq.requestId.match(/REQ-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    while (await BloodRequest.exists({ requestId: `REQ-${nextNum}` })) {
      nextNum++;
    }
    const requestId = `REQ-${nextNum}`;

    const newRequest = await BloodRequest.create({
      requestId,
      patientOrHospitalName: patientOrHospitalName.trim(),
      contactNumber: contactNumber.trim(),
      bloodGroup,
      unitsRequested: units,
      allocatedUnits: 0,
      urgency: (urgency as RequestUrgency) || "Normal",
      status: "Pending",
      requiredByDate: new Date(requiredByDate),
      notes: notes ? notes.trim() : undefined,
    });

    return NextResponse.json(
      { success: true, message: "Blood request submitted successfully.", data: newRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/requests error:", error);
    return NextResponse.json({ success: false, error: "Failed to submit blood request." }, { status: 500 });
  }
}
