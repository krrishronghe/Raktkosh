import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Donor, { BLOOD_GROUPS, BloodGroup } from "@/models/Donor";
import DonationRecord from "@/models/DonationRecord";

// GET /api/donors/[id] - Fetch a single donor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const donor = await Donor.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donorId: id }],
    }).lean();

    if (!donor) {
      return NextResponse.json(
        { success: false, error: "Donor record not found." },
        { status: 404 }
      );
    }

    // Also fetch donor's donation history
    const donations = await DonationRecord.find({ donorId: donor._id })
      .sort({ donationDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...donor,
        donations,
      },
    });
  } catch (error) {
    console.error("GET /api/donors/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve donor details." },
      { status: 500 }
    );
  }
}

// PUT /api/donors/[id] - Update donor record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const { fullName, bloodGroup, age, gender, contactNumber, email, city, status } = body;

    const updateFields: Record<string, unknown> = {};

    if (fullName !== undefined) {
      if (!fullName.trim()) {
        return NextResponse.json({ success: false, error: "Full name cannot be empty." }, { status: 400 });
      }
      updateFields.fullName = fullName.trim();
    }

    if (bloodGroup !== undefined) {
      if (!BLOOD_GROUPS.includes(bloodGroup as BloodGroup)) {
        return NextResponse.json({ success: false, error: "Invalid blood group specified." }, { status: 400 });
      }
      updateFields.bloodGroup = bloodGroup;
    }

    if (age !== undefined) {
      const numericAge = Number(age);
      if (isNaN(numericAge) || numericAge < 18 || numericAge > 65) {
        return NextResponse.json({ success: false, error: "Age must be between 18 and 65." }, { status: 400 });
      }
      updateFields.age = numericAge;
    }

    if (gender !== undefined) updateFields.gender = gender;
    if (contactNumber !== undefined) updateFields.contactNumber = contactNumber.trim();
    if (email !== undefined) updateFields.email = email.trim().toLowerCase();
    if (city !== undefined) updateFields.city = city.trim();
    if (status !== undefined) updateFields.status = status;

    const updatedDonor = await Donor.findOneAndUpdate(
      { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donorId: id }] },
      { $set: updateFields },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedDonor) {
      return NextResponse.json({ success: false, error: "Donor record not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Donor details updated successfully.",
      data: updatedDonor,
    });
  } catch (error) {
    console.error("PUT /api/donors/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update donor record." }, { status: 500 });
  }
}

// DELETE /api/donors/[id] - Safely delete or archive donor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const donor = await Donor.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { donorId: id }],
    });

    if (!donor) {
      return NextResponse.json({ success: false, error: "Donor not found." }, { status: 404 });
    }

    // Check referential integrity: has this donor made recorded donations?
    const donationCount = await DonationRecord.countDocuments({ donorId: donor._id });
    if (donationCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete donor '${donor.fullName}' because ${donationCount} historical donation record(s) exist. Set donor status to 'Inactive' instead to preserve audit logs.`,
        },
        { status: 409 }
      );
    }

    await Donor.findByIdAndDelete(donor._id);

    return NextResponse.json({
      success: true,
      message: `Donor record '${donor.fullName}' (${donor.donorId}) deleted successfully.`,
    });
  } catch (error) {
    console.error("DELETE /api/donors/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete donor." }, { status: 500 });
  }
}
