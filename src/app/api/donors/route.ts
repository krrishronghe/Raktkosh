import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Donor, { BLOOD_GROUPS, BloodGroup, DonorStatus } from "@/models/Donor";

// GET /api/donors - List donors with search, filter, and pagination
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const bloodGroup = searchParams.get("bloodGroup") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // Build filter query
    const query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { donorId: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    if (bloodGroup && BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
      query.bloodGroup = bloodGroup;
    }

    if (status) {
      query.status = status;
    }

    const [donors, totalCount] = await Promise.all([
      Donor.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Donor.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: donors,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    console.error("GET /api/donors error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve donors." },
      { status: 500 }
    );
  }
}

// POST /api/donors - Register a new donor
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();

    const { fullName, bloodGroup, age, gender, contactNumber, email, city, status } = body;

    // Validation
    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!bloodGroup || !BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
      return NextResponse.json(
        { success: false, error: `Invalid blood group. Permitted values: ${BLOOD_GROUPS.join(", ")}` },
        { status: 400 }
      );
    }

    const numericAge = Number(age);
    if (isNaN(numericAge) || numericAge < 18 || numericAge > 65) {
      return NextResponse.json(
        { success: false, error: "Donor age must be between 18 and 65 years." },
        { status: 400 }
      );
    }

    if (!contactNumber || !contactNumber.trim()) {
      return NextResponse.json(
        { success: false, error: "Contact number is required." },
        { status: 400 }
      );
    }

    if (!city || !city.trim()) {
      return NextResponse.json(
        { success: false, error: "City/location is required." },
        { status: 400 }
      );
    }

    // Generate readable Unique Donor ID: DNR-XXXX
    const lastDonor = await Donor.findOne({ donorId: /^DNR-\d+$/ })
      .sort({ donorId: -1 })
      .lean();
    let nextNum = 1001;
    if (lastDonor && lastDonor.donorId) {
      const match = lastDonor.donorId.match(/DNR-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    while (await Donor.exists({ donorId: `DNR-${nextNum}` })) {
      nextNum++;
    }
    const donorId = `DNR-${nextNum}`;

    const newDonor = await Donor.create({
      donorId,
      fullName: fullName.trim(),
      bloodGroup,
      age: numericAge,
      gender: gender || "Male",
      contactNumber: contactNumber.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      city: city.trim(),
      status: (status as DonorStatus) || "Active",
    });

    return NextResponse.json(
      { success: true, message: "Donor registered successfully.", data: newDonor },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/donors error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register donor." },
      { status: 500 }
    );
  }
}
