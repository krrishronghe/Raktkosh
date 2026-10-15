"use client";

import { useEffect, useState } from "react";
import {
  HeartHandshake,
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  Building2,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";
import BloodGroupBadge from "@/components/BloodGroupBadge";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import {
  BLOOD_GROUPS,
  BloodGroup,
  DONATION_STATUSES,
  DonationStatus,
} from "@/types";

interface DonationItem {
  _id: string;
  donationId: string;
  donorId: string;
  donorCode: string;
  donorName: string;
  bloodGroup: BloodGroup;
  donationDate: string;
  unitsDonated: number;
  collectionCenter: string;
  status: DonationStatus;
  notes?: string;
  createdAt: string;
}

interface DonorOption {
  _id: string;
  donorId: string;
  fullName: string;
  bloodGroup: BloodGroup;
  status: string;
}

export default function DonationsPage() {
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterBloodGroup, setFilterBloodGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedDonation, setSelectedDonation] = useState<DonationItem | null>(null);

  // Available donors for dropdown
  const [donorsList, setDonorsList] = useState<DonorOption[]>([]);
  const [loadingDonors, setLoadingDonors] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    donorId: "",
    unitsDonated: 1,
    collectionCenter: "Central Transfusion Center - Ward 1",
    status: "Completed" as DonationStatus,
    donationDate: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDonations = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    if (filterBloodGroup) params.append("bloodGroup", filterBloodGroup);
    if (filterStatus) params.append("status", filterStatus);

    fetch(`/api/donations?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setDonations(result.data);
          setActionError(null);
        } else {
          setActionError(result.error || "Failed to load donation records.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setActionError("Network error contacting database.");
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    if (filterBloodGroup) params.append("bloodGroup", filterBloodGroup);
    if (filterStatus) params.append("status", filterStatus);

    fetch(`/api/donations?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (!ignore) {
          if (result.success) {
            setDonations(result.data);
          } else {
            setActionError(result.error);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setActionError("Error connecting to donations database.");
          setLoading(false);
        }
        console.error(err);
      });

    return () => {
      ignore = true;
    };
  }, [filterBloodGroup, filterStatus, search]);

  // Load donors for the select picker
  const loadDonorsForSelect = async () => {
    setLoadingDonors(true);
    try {
      const res = await fetch("/api/donors?limit=50&status=Active");
      const data = await res.json();
      if (data.success) {
        setDonorsList(data.data);
        if (data.data.length > 0 && !formData.donorId) {
          setFormData((prev) => ({ ...prev, donorId: data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error("Failed to load donors", err);
    } finally {
      setLoadingDonors(false);
    }
  };

  // Open Record Modal
  const openRecordModal = () => {
    const today = new Date().toISOString().split("T")[0];
    setFormData({
      donorId: donorsList[0]?._id || "",
      unitsDonated: 1,
      collectionCenter: "Central Transfusion Center - Ward 1",
      status: "Completed",
      donationDate: today,
      notes: "Post-donation vitals normal, donor rested 15 minutes.",
    });
    setActionError(null);
    setIsRecordOpen(true);
    loadDonorsForSelect();
  };

  // Open Edit Modal
  const openEditModal = (item: DonationItem) => {
    setSelectedDonation(item);
    setFormData({
      donorId: item.donorId,
      unitsDonated: item.unitsDonated,
      collectionCenter: item.collectionCenter,
      status: item.status,
      donationDate: new Date(item.donationDate).toISOString().split("T")[0],
      notes: item.notes || "",
    });
    setActionError(null);
    setIsEditOpen(true);
  };

  // Open Detail Modal
  const openDetailModal = (item: DonationItem) => {
    setSelectedDonation(item);
    setIsDetailOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (item: DonationItem) => {
    setSelectedDonation(item);
    setActionError(null);
    setIsDeleteOpen(true);
  };

  // Handle Record Submit
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Donation session ${data.data.donationId} recorded successfully!`);
        setIsRecordOpen(false);
        loadDonations();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to record donation.");
      }
    } catch (err) {
      setActionError("Error saving donation record.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonation) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/donations/${selectedDonation.donationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Donation record ${selectedDonation.donationId} updated.`);
        setIsEditOpen(false);
        loadDonations();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to update record.");
      }
    } catch (err) {
      setActionError("Error updating record.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!selectedDonation) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/donations/${selectedDonation.donationId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setIsDeleteOpen(false);
        loadDonations();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to delete donation record.");
      }
    } catch (err) {
      setActionError("Error deleting donation record.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#E50914] mb-1">
            <HeartHandshake className="h-4 w-4" />
            <span>Donation Log</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F5F1] tracking-tight">
            Donation Records
          </h1>
          <p className="text-sm text-[#9E9A97] mt-1">
            Audit history of blood donation sessions linked directly to registered donors.
          </p>
        </div>

        <button
          onClick={openRecordModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white text-sm font-semibold shadow-lg shadow-red-900/40 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          <span>Record New Donation</span>
        </button>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm flex items-center justify-between animate-in fade-in">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">
            &times;
          </button>
        </div>
      )}
      {actionError && !isRecordOpen && !isEditOpen && !isDetailOpen && !isDeleteOpen && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[#E50914]" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-[#221F1F]/80 border border-white/10 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#9E9A97]" />
            <input
              type="text"
              placeholder="Search by donor name, donor ID, donation ID, or center..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl bg-[#1A1717] border border-white/10 pl-10 pr-4 py-2 text-sm text-[#F5F5F1] placeholder-[#9E9A97] focus:outline-none focus:border-[#E50914] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterBloodGroup}
              onChange={(e) => setFilterBloodGroup(e.target.value)}
              className="rounded-xl bg-[#1A1717] border border-white/10 px-3 py-2 text-xs text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            >
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl bg-[#1A1717] border border-white/10 px-3 py-2 text-xs text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            >
              <option value="">All Statuses</option>
              {DONATION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>

            {(search || filterBloodGroup || filterStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterBloodGroup("");
                  setFilterStatus("");
                }}
                className="px-3 py-2 rounded-xl text-xs text-[#9E9A97] hover:text-[#F5F5F1]"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Donation Records Table */}
      <div className="rounded-2xl bg-[#221F1F]/80 border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#F5F5F1]">
            <thead className="bg-[#1A1717] text-xs font-semibold text-[#9E9A97] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Donation ID</th>
                <th className="px-6 py-4">Donor Name & Code</th>
                <th className="px-6 py-4">Blood Group</th>
                <th className="px-6 py-4">Quantity Collected</th>
                <th className="px-6 py-4">Collection Center</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9E9A97]">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-[#E50914]" />
                      <span>Loading donation audit logs from MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : donations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9E9A97]">
                    <p className="text-base font-semibold text-[#F5F5F1]">No donation records found</p>
                    <p className="text-xs text-[#9E9A97] mt-1">
                      {search || filterBloodGroup || filterStatus
                        ? "Try clearing filters to display all records."
                        : "Record your first blood donation session using the button above."}
                    </p>
                  </td>
                </tr>
              ) : (
                donations.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-[#E50914]">
                      {item.donationId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#F5F5F1]">{item.donorName}</span>
                        <span className="text-xs text-[#9E9A97] font-mono">{item.donorCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <BloodGroupBadge bloodGroup={item.bloodGroup} />
                    </td>
                    <td className="px-6 py-4 font-bold text-[#F5F5F1]">
                      {item.unitsDonated} <span className="text-xs font-normal text-[#9E9A97]">unit(s)</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#9E9A97]">
                      <div className="flex items-center space-x-1">
                        <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{item.collectionCenter}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-[#9E9A97]">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{new Date(item.donationDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openDetailModal(item)}
                          className="p-1.5 rounded-lg text-[#9E9A97] hover:text-[#F5F5F1] hover:bg-white/5 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(item)}
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: RECORD DONATION ================= */}
      <Modal
        isOpen={isRecordOpen}
        onClose={() => setIsRecordOpen(false)}
        title="Record Blood Donation Session"
        description="Link a new donation to an existing registered voluntary donor."
        maxWidth="lg"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#9E9A97] mb-1">
              Select Registered Donor <span className="text-[#E50914]">*</span>
            </label>
            {loadingDonors ? (
              <p className="text-xs text-[#9E9A97]">Loading donor registry...</p>
            ) : donorsList.length === 0 ? (
              <p className="text-xs text-amber-400">
                No active donors registered. Please register a donor in the Donors module first.
              </p>
            ) : (
              <select
                required
                value={formData.donorId}
                onChange={(e) => setFormData({ ...formData, donorId: e.target.value })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {donorsList.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.fullName} ({d.donorId}) — Group {d.bloodGroup}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[11px] text-[#9E9A97] mt-1">
              Blood group and demographics are automatically inherited from the donor profile.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Units Donated <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={2}
                value={formData.unitsDonated}
                onChange={(e) => setFormData({ ...formData, unitsDonated: parseInt(e.target.value, 10) || 1 })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Donation Date <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.donationDate}
                onChange={(e) => setFormData({ ...formData, donationDate: e.target.value })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Collection Center <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.collectionCenter}
                onChange={(e) => setFormData({ ...formData, collectionCenter: e.target.value })}
                placeholder="e.g. Central Transfusion Center"
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Screening Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DonationStatus })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {DONATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9E9A97] mb-1">Clinical Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Normal blood pressure, no dizziness observed"
              className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsRecordOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#141212] border border-white/10 text-xs text-[#9E9A97] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || donorsList.length === 0}
              className="px-5 py-2 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-xs font-semibold text-white shadow-lg shadow-red-900/40 disabled:opacity-50"
            >
              {submitting ? "Recording..." : "Save Donation Record"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT DONATION ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Donation Record — ${selectedDonation?.donationId}`}
        description="Update collection center reference or screening outcome."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Donor Name</label>
              <input
                type="text"
                disabled
                value={selectedDonation?.donorName || ""}
                className="w-full rounded-xl bg-[#141212] border border-white/5 px-3.5 py-2 text-sm text-[#9E9A97] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Blood Group</label>
              <input
                type="text"
                disabled
                value={selectedDonation?.bloodGroup || ""}
                className="w-full rounded-xl bg-[#141212] border border-white/5 px-3.5 py-2 text-sm text-[#9E9A97] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Units Donated</label>
              <input
                type="number"
                min={1}
                value={formData.unitsDonated}
                onChange={(e) => setFormData({ ...formData, unitsDonated: parseInt(e.target.value, 10) || 1 })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Collection Center</label>
              <input
                type="text"
                required
                value={formData.collectionCenter}
                onChange={(e) => setFormData({ ...formData, collectionCenter: e.target.value })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DonationStatus })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {DONATION_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Donation Date</label>
              <input
                type="date"
                required
                value={formData.donationDate}
                onChange={(e) => setFormData({ ...formData, donationDate: e.target.value })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9E9A97] mb-1">Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#141212] border border-white/10 text-xs text-[#9E9A97] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-xs font-semibold text-white shadow-lg shadow-red-900/40 disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: DETAIL ================= */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Donation Session Details"
        description="Audited record details preserved in MongoDB."
        maxWidth="sm"
      >
        {selectedDonation && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#141212] border border-white/10">
              <div>
                <span className="font-mono text-sm font-bold text-[#E50914]">{selectedDonation.donationId}</span>
                <h4 className="text-sm font-semibold text-[#F5F5F1] mt-0.5">{selectedDonation.donorName}</h4>
                <p className="text-[11px] text-[#9E9A97] font-mono">{selectedDonation.donorCode}</p>
              </div>
              <StatusBadge status={selectedDonation.status} />
            </div>

            <div className="space-y-2 p-3 rounded-xl bg-[#141212] border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[#9E9A97]">Blood Group:</span>
                <BloodGroupBadge bloodGroup={selectedDonation.bloodGroup} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9E9A97]">Units Donated:</span>
                <span className="font-bold text-[#F5F5F1]">{selectedDonation.unitsDonated} unit</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9E9A97]">Collection Center:</span>
                <span className="font-semibold text-[#F5F5F1]">{selectedDonation.collectionCenter}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#9E9A97]">Donation Date:</span>
                <span className="text-[#F5F5F1]">{new Date(selectedDonation.donationDate).toLocaleDateString()}</span>
              </div>
            </div>

            {selectedDonation.notes && (
              <div className="p-3 rounded-xl bg-[#141212] border border-white/5 space-y-1">
                <span className="text-[#9E9A97]">Notes</span>
                <p className="text-[#F5F5F1]">{selectedDonation.notes}</p>
              </div>
            )}

            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-[#F5F5F1]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: DELETE ================= */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Record Deletion"
        description="Permanently delete test donation entry."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#F5F5F1]">
            Are you sure you want to remove donation record{" "}
            <span className="font-bold text-[#E50914]">{selectedDonation?.donationId}</span> for donor{" "}
            {selectedDonation?.donorName}?
          </p>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#141212] border border-white/10 text-xs text-[#9E9A97] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleDeleteSubmit}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-lg shadow-red-900/40 disabled:opacity-50"
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
