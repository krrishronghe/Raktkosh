"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  RefreshCw,
  HeartHandshake,
} from "lucide-react";
import BloodGroupBadge from "@/components/BloodGroupBadge";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { BLOOD_GROUPS, BloodGroup, DONOR_STATUSES, DonorStatus } from "@/types";

interface DonorRecord {
  _id: string;
  donorId: string;
  fullName: string;
  bloodGroup: BloodGroup;
  age: number;
  gender: "Male" | "Female" | "Other";
  contactNumber: string;
  email?: string;
  city: string;
  lastDonationDate?: string;
  status: DonorStatus;
  createdAt: string;
}

interface DonorDetail extends DonorRecord {
  donations?: Array<{
    _id: string;
    donationId: string;
    donationDate: string;
    unitsDonated: number;
    collectionCenter: string;
    status: string;
  }>;
}

export default function DonorsPage() {
  const [donors, setDonors] = useState<DonorRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterBloodGroup, setFilterBloodGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedDonor, setSelectedDonor] = useState<DonorRecord | null>(null);
  const [selectedDonorDetail, setSelectedDonorDetail] = useState<DonorDetail | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    bloodGroup: "O+" as BloodGroup,
    age: 25,
    gender: "Male" as "Male" | "Female" | "Other",
    contactNumber: "",
    email: "",
    city: "",
    status: "Active" as DonorStatus,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch donors list
  const loadDonors = (currentPage = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    if (filterBloodGroup) params.append("bloodGroup", filterBloodGroup);
    if (filterStatus) params.append("status", filterStatus);
    params.append("page", currentPage.toString());
    params.append("limit", "10");

    fetch(`/api/donors?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setDonors(result.data);
          setTotalCount(result.pagination.totalCount);
          setTotalPages(result.pagination.totalPages);
          setActionError(null);
        } else {
          setActionError(result.error || "Failed to load donors.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setActionError("Network error loading donors from database.");
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
    params.append("page", page.toString());
    params.append("limit", "10");

    fetch(`/api/donors?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (!ignore) {
          if (result.success) {
            setDonors(result.data);
            setTotalCount(result.pagination.totalCount);
            setTotalPages(result.pagination.totalPages);
          } else {
            setActionError(result.error);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setActionError("Error connecting to database.");
          setLoading(false);
        }
        console.error(err);
      });

    return () => {
      ignore = true;
    };
  }, [page, filterBloodGroup, filterStatus, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadDonors(1);
  };

  const handleResetFilters = () => {
    setSearch("");
    setFilterBloodGroup("");
    setFilterStatus("");
    setPage(1);
    startTransition(() => {
      loadDonors(1);
    });
  };

  // Open Create Modal
  const openCreateModal = () => {
    setFormData({
      fullName: "",
      bloodGroup: "O+",
      age: 25,
      gender: "Male",
      contactNumber: "",
      email: "",
      city: "",
      status: "Active",
    });
    setActionError(null);
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (donor: DonorRecord) => {
    setSelectedDonor(donor);
    setFormData({
      fullName: donor.fullName,
      bloodGroup: donor.bloodGroup,
      age: donor.age,
      gender: donor.gender,
      contactNumber: donor.contactNumber,
      email: donor.email || "",
      city: donor.city,
      status: donor.status,
    });
    setActionError(null);
    setIsEditOpen(true);
  };

  // Open Detail Modal
  const openDetailModal = async (donor: DonorRecord) => {
    setSelectedDonor(donor);
    setSelectedDonorDetail(donor);
    setIsDetailOpen(true);
    try {
      const res = await fetch(`/api/donors/${donor.donorId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedDonorDetail(data.data);
      }
    } catch (err) {
      console.error("Failed to load full donor history", err);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (donor: DonorRecord) => {
    setSelectedDonor(donor);
    setActionError(null);
    setIsDeleteOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Donor ${data.data.fullName} (${data.data.donorId}) registered successfully!`);
        setIsCreateOpen(false);
        loadDonors();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to register donor.");
      }
    } catch (err) {
      setActionError("Error connecting to server.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDonor) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/donors/${selectedDonor.donorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Donor information for ${data.data.fullName} updated successfully!`);
        setIsEditOpen(false);
        loadDonors();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to update donor.");
      }
    } catch (err) {
      setActionError("Error updating donor record.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!selectedDonor) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/donors/${selectedDonor.donorId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setIsDeleteOpen(false);
        loadDonors();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to delete donor record.");
      }
    } catch (err) {
      setActionError("Error deleting donor record.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#E50914] mb-1">
            <Users className="h-4 w-4" />
            <span>Donor Registry Terminal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-[#F5F5F1] tracking-tight">
            Donor Management
          </h1>
          <p className="text-sm text-zinc-600 dark:text-[#9E9A97] mt-1">
            Audit, register, search, update, and manage verified voluntary blood donors.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B81D24] text-white text-xs font-bold shadow-lg shadow-red-900/30 transition-all hover:scale-105"
        >
          <UserPlus className="h-4 w-4" />
          <span>Register New Donor</span>
        </button>
      </div>

      {/* Action Feedback Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-sm animate-in fade-in">
          <span className="font-medium">{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            &times;
          </button>
        </div>
      )}
      {actionError && !isCreateOpen && !isEditOpen && !isDeleteOpen && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/40 text-red-800 dark:text-red-300 text-sm flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[#E50914]" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700">
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-3xl glass-panel border border-slate-200 dark:border-white/10 p-4 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-[#9E9A97]" />
            <input
              type="text"
              placeholder="Search by full name, ID (e.g. DNR-1001), phone, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl bg-white dark:bg-[#181415] border border-slate-300 dark:border-white/10 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] placeholder-slate-400 dark:placeholder-[#9E9A97] focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterBloodGroup}
              onChange={(e) => {
                setFilterBloodGroup(e.target.value);
                setPage(1);
              }}
              className="rounded-2xl bg-white dark:bg-[#181415] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914]"
            >
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Group: {bg}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-2xl bg-white dark:bg-[#181415] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914]"
            >
              <option value="">All Statuses</option>
              {DONOR_STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-slate-900 dark:bg-white/10 hover:bg-slate-800 dark:hover:bg-white/15 text-xs font-bold text-white transition-all"
            >
              Filter
            </button>

            {(search || filterBloodGroup || filterStatus) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-[#9E9A97] dark:hover:text-[#F5F5F1] transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Donors Data Table */}
      <div className="rounded-3xl glass-panel border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-800 dark:text-[#F5F5F1]">
            <thead className="bg-slate-100/90 dark:bg-[#1C1718] text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider border-b border-slate-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Donor ID</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Group</th>
                <th className="px-6 py-4">Age / Gender</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500 dark:text-[#9E9A97]">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-[#E50914]" />
                      <span className="font-medium">Querying donor records from MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : donors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500 dark:text-[#9E9A97]">
                    <p className="text-base font-bold text-zinc-900 dark:text-[#F5F5F1]">No donor records found</p>
                    <p className="text-xs text-zinc-500 dark:text-[#9E9A97] mt-1">
                      {search || filterBloodGroup || filterStatus
                        ? "Try adjusting your search criteria or resetting filters."
                        : "Register your first voluntary donor above to begin."}
                    </p>
                  </td>
                </tr>
              ) : (
                donors.map((donor) => (
                  <tr
                    key={donor._id}
                    className="hover:bg-zinc-100/60 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-[#E50914]">
                      {donor.donorId}
                    </td>
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-[#F5F5F1]">
                      {donor.fullName}
                    </td>
                    <td className="px-6 py-4">
                      <BloodGroupBadge bloodGroup={donor.bloodGroup} />
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-[#9E9A97] text-xs">
                      {donor.age} yrs • {donor.gender}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-zinc-600 dark:text-[#9E9A97]">
                        <span className="font-semibold text-zinc-900 dark:text-[#F5F5F1]">{donor.contactNumber}</span>
                        {donor.email && <span className="text-[11px] truncate max-w-xs">{donor.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-[#9E9A97] text-xs">
                      {donor.city}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={donor.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openDetailModal(donor)}
                          className="p-1.5 rounded-lg text-zinc-500 dark:text-[#9E9A97] hover:text-zinc-900 dark:hover:text-[#F5F5F1] hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                          title="View Profile File"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(donor)}
                          className="p-1.5 rounded-lg text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                          title="Edit Donor Record"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(donor)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Delete Donor Record"
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

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-[#1A1717] flex items-center justify-between text-xs text-zinc-500 dark:text-[#9E9A97]">
            <span>
              Showing {donors.length} of {totalCount} donors
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#221F1F] border border-zinc-200 dark:border-white/10 disabled:opacity-40 hover:text-zinc-900 dark:hover:text-white"
              >
                Previous
              </button>
              <span className="font-bold text-zinc-900 dark:text-[#F5F5F1]">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#221F1F] border border-zinc-200 dark:border-white/10 disabled:opacity-40 hover:text-zinc-900 dark:hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: CREATE DONOR ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Register Voluntary Blood Donor"
        description="Verify demographic details and persist into the central MongoDB collection."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/40 text-red-800 dark:text-red-300 text-xs font-medium">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Full Legal Name <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Ramesh Patel"
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Blood Group <span className="text-[#E50914]">*</span>
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914]"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Age (18 - 65) <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="number"
                required
                min={18}
                max={65}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 18 })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Male" | "Female" | "Other" })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Contact Phone <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="donor@example.com"
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                City / Location <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Mumbai"
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DonorStatus })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914]"
              >
                {DONOR_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-[#9E9A97] dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B81D24] text-xs font-bold text-white shadow-lg shadow-red-900/30 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Confirm Registration"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT DONOR ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Donor File — ${selectedDonor?.donorId}`}
        description="Modify donor demographics and availability status."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/40 text-red-800 dark:text-red-300 text-xs font-medium">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914]"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Age</label>
              <input
                type="number"
                min={18}
                max={65}
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 18 })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Male" | "Female" | "Other" })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Contact Phone</label>
              <input
                type="text"
                required
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Location / City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914] focus:ring-2 focus:ring-red-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as DonorStatus })}
                className="w-full rounded-2xl bg-white dark:bg-[#141212] border border-slate-300 dark:border-white/10 px-3.5 py-2.5 text-xs text-slate-900 dark:text-[#F5F5F1] font-medium focus:outline-none focus:border-[#E50914]"
              >
                {DONOR_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-[#9E9A97] dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#E50914] to-[#B81D24] text-xs font-bold text-white shadow-lg shadow-red-900/30 disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: DONOR PROFILE & SESSIONS ================= */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Donor Bio-File & History"
        description="Audited demographic profile and linked donation logs from MongoDB."
        maxWidth="lg"
      >
        {selectedDonorDetail && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10">
              <div className="flex items-center space-x-3">
                <BloodGroupBadge bloodGroup={selectedDonorDetail.bloodGroup} size="lg" />
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-[#F5F5F1]">{selectedDonorDetail.fullName}</h4>
                  <p className="text-xs text-zinc-500 dark:text-[#9E9A97] font-mono">{selectedDonorDetail.donorId}</p>
                </div>
              </div>
              <StatusBadge status={selectedDonorDetail.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200/80 dark:border-white/5 space-y-1">
                <span className="text-zinc-500 dark:text-[#9E9A97]">Demographics</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1]">
                  {selectedDonorDetail.age} yrs • {selectedDonorDetail.gender}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200/80 dark:border-white/5 space-y-1">
                <span className="text-zinc-500 dark:text-[#9E9A97]">Phone Contact</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1] flex items-center">
                  <Phone className="h-3.5 w-3.5 mr-1 text-[#E50914]" />
                  {selectedDonorDetail.contactNumber}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200/80 dark:border-white/5 space-y-1">
                <span className="text-zinc-500 dark:text-[#9E9A97]">Email</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1] flex items-center truncate">
                  <Mail className="h-3.5 w-3.5 mr-1 text-[#E50914]" />
                  {selectedDonorDetail.email || "Not specified"}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200/80 dark:border-white/5 space-y-1">
                <span className="text-zinc-500 dark:text-[#9E9A97]">Location</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1] flex items-center">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-[#E50914]" />
                  {selectedDonorDetail.city}
                </p>
              </div>
            </div>

            {/* Donation History Section */}
            <div>
              <h5 className="text-xs font-bold uppercase text-zinc-600 dark:text-[#9E9A97] tracking-wider mb-2 flex items-center">
                <HeartHandshake className="h-3.5 w-3.5 mr-1.5 text-[#E50914]" />
                Donation Sessions ({selectedDonorDetail.donations?.length || 0})
              </h5>

              {!selectedDonorDetail.donations || selectedDonorDetail.donations.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-[#9E9A97] p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200/80 dark:border-white/5">
                  No recorded donations found for this donor yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedDonorDetail.donations.map((don) => (
                    <div
                      key={don._id}
                      className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200/80 dark:border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-[#F5F5F1]">{don.collectionCenter}</span>
                        <div className="text-[11px] text-zinc-500 dark:text-[#9E9A97] mt-0.5">
                          ID: {don.donationId} • {don.unitsDonated} unit(s)
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-zinc-500 dark:text-[#9E9A97]">
                          {new Date(don.donationDate).toLocaleDateString()}
                        </span>
                        <StatusBadge status={don.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold text-zinc-800 dark:text-[#F5F5F1]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: DELETE DONOR ================= */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Donor Deletion"
        description="Permanently remove donor record from database."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/40 text-red-800 dark:text-red-300 text-xs font-medium">
              {actionError}
            </div>
          )}

          <p className="text-xs text-zinc-800 dark:text-[#F5F5F1]">
            Are you sure you want to delete donor{" "}
            <span className="font-bold text-[#E50914]">{selectedDonor?.fullName}</span> (
            {selectedDonor?.donorId})?
          </p>

          <p className="text-[11px] text-zinc-500 dark:text-[#9E9A97] leading-relaxed">
            Referential safety rule: If this donor has prior donation records in the system, deletion will be blocked to maintain medical history integrity.
          </p>

          <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-[#9E9A97] dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleDeleteSubmit}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-lg shadow-red-900/40 disabled:opacity-50"
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
