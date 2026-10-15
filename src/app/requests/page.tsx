"use client";

import { useEffect, useState } from "react";
import {
  GitPullRequest,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle,
  Clock,
  Phone,
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  ShieldAlert,
  Droplet,
} from "lucide-react";
import BloodGroupBadge from "@/components/BloodGroupBadge";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import {
  BLOOD_GROUPS,
  BloodGroup,
  REQUEST_STATUSES,
  REQUEST_URGENCIES,
  RequestStatus,
  RequestUrgency,
} from "@/types";

interface BloodRequestItem {
  _id: string;
  requestId: string;
  patientOrHospitalName: string;
  contactNumber: string;
  bloodGroup: BloodGroup;
  unitsRequested: number;
  allocatedUnits: number;
  urgency: RequestUrgency;
  status: RequestStatus;
  requiredByDate: string;
  notes?: string;
  createdAt: string;
  availableUnitsInStock?: number;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<BloodRequestItem[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    criticalCount: 0,
    fulfilledCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterBloodGroup, setFilterBloodGroup] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFulfillOpen, setIsFulfillOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedReq, setSelectedReq] = useState<BloodRequestItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    patientOrHospitalName: "",
    contactNumber: "",
    bloodGroup: "O+" as BloodGroup,
    unitsRequested: 2,
    urgency: "Normal" as RequestUrgency,
    status: "Pending" as RequestStatus,
    requiredByDate: "",
    notes: "",
  });

  const [fulfillUnitsInput, setFulfillUnitsInput] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadRequests = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    if (filterBloodGroup) params.append("bloodGroup", filterBloodGroup);
    if (filterUrgency) params.append("urgency", filterUrgency);
    if (filterStatus) params.append("status", filterStatus);

    fetch(`/api/requests?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setRequests(result.data);
          if (result.stats) setStats(result.stats);
          setActionError(null);
        } else {
          setActionError(result.error || "Failed to load requests.");
        }
        setLoading(false);
      })
      .catch((err) => {
        setActionError("Network error fetching requests.");
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams();
    if (search.trim()) params.append("search", search.trim());
    if (filterBloodGroup) params.append("bloodGroup", filterBloodGroup);
    if (filterUrgency) params.append("urgency", filterUrgency);
    if (filterStatus) params.append("status", filterStatus);

    fetch(`/api/requests?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (!ignore) {
          if (result.success) {
            setRequests(result.data);
            if (result.stats) setStats(result.stats);
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
  }, [filterBloodGroup, filterUrgency, filterStatus, search]);

  // Open Create Modal
  const openCreateModal = () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setFormData({
      patientOrHospitalName: "",
      contactNumber: "",
      bloodGroup: "O+",
      unitsRequested: 2,
      urgency: "Normal",
      status: "Pending",
      requiredByDate: tomorrow,
      notes: "",
    });
    setActionError(null);
    setIsCreateOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: BloodRequestItem) => {
    setSelectedReq(item);
    setFormData({
      patientOrHospitalName: item.patientOrHospitalName,
      contactNumber: item.contactNumber,
      bloodGroup: item.bloodGroup,
      unitsRequested: item.unitsRequested,
      urgency: item.urgency,
      status: item.status,
      requiredByDate: new Date(item.requiredByDate).toISOString().split("T")[0],
      notes: item.notes || "",
    });
    setActionError(null);
    setIsEditOpen(true);
  };

  // Open Detail Modal
  const openDetailModal = async (item: BloodRequestItem) => {
    setSelectedReq(item);
    setIsDetailOpen(true);
    try {
      const res = await fetch(`/api/requests/${item.requestId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedReq(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Fulfill Modal
  const openFulfillModal = async (item: BloodRequestItem) => {
    setSelectedReq(item);
    setActionError(null);
    const needed = item.unitsRequested - item.allocatedUnits;
    setFulfillUnitsInput(Math.max(1, needed));
    setIsFulfillOpen(true);

    // Fetch current live stock for this blood group
    try {
      const res = await fetch(`/api/requests/${item.requestId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedReq(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (item: BloodRequestItem) => {
    setSelectedReq(item);
    setActionError(null);
    setIsDeleteOpen(true);
  };

  // Handle Create Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Blood request ${data.data.requestId} created successfully.`);
        setIsCreateOpen(false);
        loadRequests();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to create request.");
      }
    } catch (err) {
      setActionError("Error saving request.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/requests/${selectedReq.requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Blood request ${selectedReq.requestId} updated.`);
        setIsEditOpen(false);
        loadRequests();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to update request.");
      }
    } catch (err) {
      setActionError("Error updating request.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Fulfill Submit (FIFO Inventory Deduction)
  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/requests/${selectedReq.requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillUnits: fulfillUnitsInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(
          `Successfully allocated ${fulfillUnitsInput} units of ${selectedReq.bloodGroup} from cold storage inventory.`
        );
        setIsFulfillOpen(false);
        loadRequests();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to fulfill request.");
      }
    } catch (err) {
      setActionError("Error allocating blood units.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!selectedReq) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/requests/${selectedReq.requestId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setIsDeleteOpen(false);
        loadRequests();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to delete request.");
      }
    } catch (err) {
      setActionError("Error deleting request.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#E50914] mb-1">
            <GitPullRequest className="h-4 w-4" />
            <span>Hospital Requisitions</span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-[#F5F5F1] tracking-tight">
            Blood Request Management
          </h1>
          <p className="text-sm text-zinc-500 dark:text-[#9E9A97] mt-1">
            Manage hospital requisition orders, check inventory stock, and issue blood units.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-5 py-3 rounded-2xl bg-[#E50914] hover:bg-[#B81D24] text-white text-sm font-bold shadow-lg shadow-red-900/30 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          <span>New Blood Requisition</span>
        </button>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-between shadow-sm animate-in fade-in">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-white">
            &times;
          </button>
        </div>
      )}
      {actionError && !isCreateOpen && !isEditOpen && !isDetailOpen && !isFulfillOpen && !isDeleteOpen && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-sm flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[#E50914]" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-red-500 hover:text-red-700 dark:hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Status Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl glass-panel border border-zinc-200 dark:border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-[#9E9A97] uppercase">Pending Review</span>
            <div className="text-3xl font-black text-zinc-900 dark:text-[#F5F5F1] mt-1">{stats.pendingCount}</div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Clock className="h-6 w-6 text-amber-500" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-zinc-200 dark:border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-[#9E9A97] uppercase">Critical Urgency</span>
            <div className="text-3xl font-black text-[#E50914] mt-1">{stats.criticalCount}</div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-[#E50914]" />
          </div>
        </div>

        <div className="p-5 rounded-3xl glass-panel border border-zinc-200 dark:border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-[#9E9A97] uppercase">Dispatched / Fulfilled</span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.fulfilledCount}</div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl glass-panel border border-zinc-200 dark:border-white/10 p-4 shadow-lg">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400 dark:text-[#9E9A97]" />
            <input
              type="text"
              placeholder="Search by hospital, patient name, ID (e.g. REQ-3001), or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl bg-zinc-50 dark:bg-[#1A1717] border border-zinc-200 dark:border-white/10 pl-10 pr-4 py-2.5 text-xs text-zinc-900 dark:text-[#F5F5F1] placeholder-zinc-400 dark:placeholder-[#9E9A97] focus:outline-none focus:border-[#E50914] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={filterBloodGroup}
              onChange={(e) => setFilterBloodGroup(e.target.value)}
              className="rounded-2xl bg-zinc-50 dark:bg-[#1A1717] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            >
              <option value="">All Blood Groups</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  Group: {bg}
                </option>
              ))}
            </select>

            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="rounded-2xl bg-zinc-50 dark:bg-[#1A1717] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            >
              <option value="">All Urgencies</option>
              {REQUEST_URGENCIES.map((u) => (
                <option key={u} value={u}>
                  Urgency: {u}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-2xl bg-zinc-50 dark:bg-[#1A1717] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            >
              <option value="">All Statuses</option>
              {REQUEST_STATUSES.map((st) => (
                <option key={st} value={st}>
                  Status: {st}
                </option>
              ))}
            </select>

            {(search || filterBloodGroup || filterUrgency || filterStatus) && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterBloodGroup("");
                  setFilterUrgency("");
                  setFilterStatus("");
                }}
                className="px-3 py-2.5 rounded-2xl text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-[#9E9A97] dark:hover:text-[#F5F5F1] transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Requests Data Table */}
      <div className="rounded-3xl glass-panel border border-zinc-200 dark:border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-800 dark:text-[#F5F5F1]">
            <thead className="bg-zinc-100/90 dark:bg-[#1A1717] text-[11px] font-bold text-zinc-500 dark:text-[#9E9A97] uppercase tracking-wider border-b border-zinc-200 dark:border-white/10">
              <tr>
                <th className="px-6 py-4">Request ID</th>
                <th className="px-6 py-4">Requester / Hospital</th>
                <th className="px-6 py-4">Group</th>
                <th className="px-6 py-4">Units (Allocated/Total)</th>
                <th className="px-6 py-4">Urgency</th>
                <th className="px-6 py-4">Required By</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500 dark:text-[#9E9A97]">
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-[#E50914]" />
                      <span className="font-medium">Retrieving requisitions from MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-500 dark:text-[#9E9A97]">
                    <p className="text-base font-bold text-zinc-900 dark:text-[#F5F5F1]">No blood requests found</p>
                    <p className="text-xs text-zinc-500 dark:text-[#9E9A97] mt-1">
                      {search || filterBloodGroup || filterUrgency || filterStatus
                        ? "Try clearing filters to display all requisitions."
                        : "Submit a new blood requisition using the button above."}
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((item) => (
                  <tr key={item._id} className="hover:bg-zinc-100/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#E50914]">
                      {item.requestId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900 dark:text-[#F5F5F1]">{item.patientOrHospitalName}</span>
                        <span className="text-xs text-zinc-500 dark:text-[#9E9A97] flex items-center mt-0.5">
                          <Phone className="h-3 w-3 mr-1 text-zinc-400 dark:text-zinc-500" />
                          {item.contactNumber}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <BloodGroupBadge bloodGroup={item.bloodGroup} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-zinc-900 dark:text-[#F5F5F1]">
                        {item.allocatedUnits} / {item.unitsRequested}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-[#9E9A97] ml-1">units</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.urgency} />
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-600 dark:text-[#9E9A97]">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                        <span>{new Date(item.requiredByDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => openDetailModal(item)}
                          className="p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-[#9E9A97] dark:hover:text-[#F5F5F1] hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
                          title="View Requisition Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {item.status !== "Fulfilled" && item.status !== "Cancelled" && (
                          <button
                            onClick={() => openFulfillModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-[#E50914]/15 hover:bg-[#E50914] text-[#E50914] hover:text-white border border-[#E50914]/30 text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
                            title="Issue Blood Stock from Inventory"
                          >
                            <Droplet className="h-3.5 w-3.5" />
                            <span>Issue Stock</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit Request"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(item)}
                          className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete Request"
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

      {/* ================= MODAL: CREATE REQUISITION ================= */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Submit Blood Requisition"
        description="Create a formal medical requisition for hospital or emergency patient needs."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">
                Hospital or Patient Name <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.patientOrHospitalName}
                onChange={(e) => setFormData({ ...formData, patientOrHospitalName: e.target.value })}
                placeholder="e.g. City General Hospital - ICU"
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">
                Contact Number <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+91 22 2456 7890"
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">
                Blood Group <span className="text-[#E50914]">*</span>
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">
                Units Requested <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.unitsRequested}
                onChange={(e) => setFormData({ ...formData, unitsRequested: parseInt(e.target.value, 10) || 1 })}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">
                Urgency Level
              </label>
              <select
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value as RequestUrgency })}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {REQUEST_URGENCIES.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">
                Required By Date <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.requiredByDate}
                onChange={(e) => setFormData({ ...formData, requiredByDate: e.target.value })}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">Clinical Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Emergency trauma surgery or scheduled procedure details"
              className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-[#9E9A97] hover:text-zinc-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl bg-[#E50914] hover:bg-[#B81D24] text-xs font-bold text-white shadow-lg shadow-red-900/30 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Requisition"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT REQUISITION ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Requisition — ${selectedReq?.requestId}`}
        description="Update requester contact, requested units, or operational status."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">Requester / Hospital</label>
              <input
                type="text"
                required
                value={formData.patientOrHospitalName}
                onChange={(e) => setFormData({ ...formData, patientOrHospitalName: e.target.value })}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">Contact Number</label>
              <input
                type="text"
                required
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">Units Requested</label>
              <input
                type="number"
                min={1}
                value={formData.unitsRequested}
                onChange={(e) => setFormData({ ...formData, unitsRequested: parseInt(e.target.value, 10) || 1 })}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as RequestStatus })}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {REQUEST_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-[#9E9A97] hover:text-zinc-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-2xl bg-[#E50914] hover:bg-[#B81D24] text-xs font-bold text-white shadow-lg shadow-red-900/30 disabled:opacity-50"
            >
              {submitting ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: ISSUE / FULFILL FROM INVENTORY ================= */}
      <Modal
        isOpen={isFulfillOpen}
        onClose={() => setIsFulfillOpen(false)}
        title={`Allocate Blood Stock — ${selectedReq?.requestId}`}
        description="Verify inventory stock levels and deduct transfusion units using FIFO."
        maxWidth="md"
      >
        {selectedReq && (
          <form onSubmit={handleFulfillSubmit} className="space-y-4">
            {actionError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">
                {actionError}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-[#9E9A97]">Target Blood Group:</span>
                <BloodGroupBadge bloodGroup={selectedReq.bloodGroup} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-[#9E9A97]">Requisition Target:</span>
                <span className="font-bold text-zinc-900 dark:text-[#F5F5F1]">
                  {selectedReq.allocatedUnits} of {selectedReq.unitsRequested} units fulfilled
                </span>
              </div>
              <div className="flex items-center justify-between pt-2.5 border-t border-zinc-200 dark:border-white/5">
                <span className="text-zinc-600 dark:text-[#9E9A97]">Available in Cold Storage:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedReq.availableUnitsInStock ?? "Checking..."} unit(s) ready
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-[#9E9A97] mb-1.5">
                Units to Issue in this Batch
              </label>
              <input
                type="number"
                required
                min={1}
                max={selectedReq.unitsRequested - selectedReq.allocatedUnits}
                value={fulfillUnitsInput}
                onChange={(e) => setFulfillUnitsInput(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
              <p className="text-[11px] text-zinc-500 dark:text-[#9E9A97] mt-1.5">
                Inventory will automatically decrement the oldest unexpired batches first.
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsFulfillOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-[#9E9A97] hover:text-zinc-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 disabled:opacity-50"
              >
                {submitting ? "Issuing..." : "Confirm Stock Issuance"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ================= MODAL: VIEW REQUISITION DETAILS ================= */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Requisition Details"
        description="Full clinical request parameters and allocation progress."
        maxWidth="md"
      >
        {selectedReq && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-100 dark:bg-[#141212] border border-zinc-200 dark:border-white/10">
              <div>
                <span className="font-mono text-sm font-bold text-[#E50914]">{selectedReq.requestId}</span>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1] mt-0.5">{selectedReq.patientOrHospitalName}</h4>
              </div>
              <div className="flex flex-col items-end space-y-1.5">
                <StatusBadge status={selectedReq.status} />
                <StatusBadge status={selectedReq.urgency} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/5 space-y-1">
                <span className="text-zinc-500 dark:text-[#9E9A97]">Target Blood Group</span>
                <div>
                  <BloodGroupBadge bloodGroup={selectedReq.bloodGroup} />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/5 space-y-1">
                <span className="text-zinc-500 dark:text-[#9E9A97]">Units Allocated</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1]">
                  {selectedReq.allocatedUnits} / {selectedReq.unitsRequested} units
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/5 space-y-1">
                <span className="text-zinc-500 dark:text-[#9E9A97]">Contact Phone</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1]">{selectedReq.contactNumber}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/5 space-y-1">
                <span className="text-zinc-500 dark:text-[#9E9A97]">Required By</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-[#F5F5F1]">
                  {new Date(selectedReq.requiredByDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            {selectedReq.notes && (
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#141212] border border-zinc-200 dark:border-white/5 space-y-1">
                <span className="text-zinc-500 dark:text-[#9E9A97]">Clinical Notes</span>
                <p className="text-sm text-zinc-900 dark:text-[#F5F5F1]">{selectedReq.notes}</p>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-200 dark:border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2.5 rounded-2xl bg-zinc-200 dark:bg-white/10 hover:bg-zinc-300 dark:hover:bg-white/15 text-xs font-bold text-zinc-800 dark:text-[#F5F5F1] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ================= MODAL: DELETE REQUISITION ================= */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Requisition Deletion"
        description="Permanently delete or cancel request record."
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-700 dark:text-[#F5F5F1]">
            Are you sure you want to remove request{" "}
            <span className="font-bold text-[#E50914]">{selectedReq?.requestId}</span> from{" "}
            {selectedReq?.patientOrHospitalName}?
          </p>

          <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              className="px-4 py-2.5 rounded-2xl bg-zinc-100 dark:bg-[#141212] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-600 dark:text-[#9E9A97] hover:text-zinc-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleDeleteSubmit}
              className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-lg shadow-red-900/30 disabled:opacity-50"
            >
              {submitting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
