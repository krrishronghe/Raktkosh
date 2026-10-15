import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import DonationRecord, {
  DONATION_STATUSES,
  DonationStatus,
} from "@/models/DonationRecord";
import Donor, { BLOOD_GROUPS, BloodGroup } from "@/models/Donor";

// GET /api/donations - List donation records
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const status = searchParams.get("status") || "";

    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { donorName: { $regex: search, $options: "i" } },
        { donorCode: { $regex: search, $options: "i" } },
        { donationId: { $regex: search, $options: "i" } },
        { collectionCenter: { $regex: search, $options: "i" } },
      ];
    }

    if (bloodGroup && BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
      query.bloodGroup = bloodGroup;
    }

    if (status && DONATION_STATUSES.includes(status as DonationStatus)) {
      query.status = status;
    }

    const records = await DonationRecord.find(query)
      .sort({ donationDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("GET /api/donations error:", error);
    return NextResponse.json({ success: false, error: "Failed to retrieve donation records." }, { status: 500 });
  }
}

// POST /api/donations - Record a new donation
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const {
      donorId, // MongoDB ObjectId or donorCode
      unitsDonated,
      collectionCenter,
      status,
      donationDate,
      notes,
    } = body;

    if (!donorId) {
      return NextResponse.json({ success: false, error: "Donor reference is required." }, { status: 400 });
    }

    // Verify donor exists in MongoDB
    const donor = await Donor.findOne({
      $or: [
        { _id: donorId.match(/^[0-9a-fA-F]{24}$/) ? donorId : null },
        { donorId: donorId },
      ],
    });

    if (!donor) {
      return NextResponse.json({ success: false, error: "Referenced donor record does not exist." }, { status: 404 });
    }

    if (!collectionCenter || !collectionCenter.trim()) {
      return NextResponse.json({ success: false, error: "Collection center is required." }, { status: 400 });
    }

    const units = Number(unitsDonated) || 1;
    if (units < 1) {
      return NextResponse.json({ success: false, error: "Units donated must be at least 1." }, { status: 400 });
    }

    // Generate readable donation ID: DON-XXXX
    const lastDonation = await DonationRecord.findOne({ donationId: /^DON-\d+$/ })
      .sort({ donationId: -1 })
      .lean();
    let nextNum = 4001;
    if (lastDonation && lastDonation.donationId) {
      const match = lastDonation.donationId.match(/DON-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    while (await DonationRecord.exists({ donationId: `DON-${nextNum}` })) {
      nextNum++;
    }
    const donationId = `DON-${nextNum}`;

    const donDate = donationDate ? new Date(donationDate) : new Date();

    const newRecord = await DonationRecord.create({
      donationId,
      donorId: donor._id,
      donorCode: donor.donorId,
      donorName: donor.fullName,
      bloodGroup: donor.bloodGroup,
      donationDate: donDate,
      unitsDonated: units,
      collectionCenter: collectionCenter.trim(),
      status: (status as DonationStatus) || "Completed",
      notes: notes ? notes.trim() : undefined,
    });

    // Update donor's last donation date
    donor.lastDonationDate = donDate;
    await donor.save();

    return NextResponse.json(
      {
        success: true,
        message: `Donation record created for donor ${donor.fullName} (${donor.bloodGroup}).`,
        data: newRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/donations error:", error);
    return NextResponse.json({ success: false, error: "Failed to record donation." }, { status: 500 });
  }
}
