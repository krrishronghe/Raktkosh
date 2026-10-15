"use client";

import { useEffect, useState } from "react";
import {
  Database,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Clock,
  Warehouse,
  Calendar,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import BloodGroupBadge from "@/components/BloodGroupBadge";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import {
  BLOOD_GROUPS,
  BloodGroup,
  INVENTORY_STATUSES,
  InventoryStatus,
} from "@/types";

interface InventoryBatch {
  _id: string;
  inventoryId: string;
  bloodGroup: BloodGroup;
  units: number;
  collectionDate: string;
  expiryDate: string;
  storageLocation: string;
  status: InventoryStatus;
  notes?: string;
  createdAt: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [stockByGroup, setStockByGroup] = useState<Record<string, number>>({});
  const [totalUnits, setTotalUnits] = useState(0);
  const [serverTime, setServerTime] = useState("");
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterBloodGroup, setFilterBloodGroup] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [filterExpired, setFilterExpired] = useState(false);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryBatch | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    bloodGroup: "O+" as BloodGroup,
    units: 5,
    collectionDate: "",
    expiryDate: "",
    storageLocation: "Cold Vault Alpha - Rack 1",
    status: "Available" as InventoryStatus,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadInventory = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterBloodGroup) params.append("bloodGroup", filterBloodGroup);
    if (filterStatus) params.append("status", filterStatus);
    if (filterExpiring) params.append("expiring", "true");
    if (filterExpired) params.append("expired", "true");

    fetch(`/api/inventory?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setInventory(result.data);
          setStockByGroup(result.stockByGroup || {});
          setTotalUnits(result.totalAvailableUnits || 0);
          if (result.serverTime) setServerTime(result.serverTime);
          setActionError(null);
        } else {
          setActionError(result.error || "Failed to load inventory.");
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
    if (filterBloodGroup) params.append("bloodGroup", filterBloodGroup);
    if (filterStatus) params.append("status", filterStatus);
    if (filterExpiring) params.append("expiring", "true");
    if (filterExpired) params.append("expired", "true");

    fetch(`/api/inventory?${params.toString()}`)
      .then((res) => res.json())
      .then((result) => {
        if (!ignore) {
          if (result.success) {
            setInventory(result.data);
            setStockByGroup(result.stockByGroup || {});
            setTotalUnits(result.totalAvailableUnits || 0);
            if (result.serverTime) setServerTime(result.serverTime);
          } else {
            setActionError(result.error);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setActionError("Error connecting to inventory collection.");
          setLoading(false);
        }
        console.error(err);
      });

    return () => {
      ignore = true;
    };
  }, [filterBloodGroup, filterStatus, filterExpiring, filterExpired]);

  // Open Add Modal
  const openAddModal = () => {
    const today = new Date();
    const expiry = new Date(today.getTime() + 42 * 24 * 60 * 60 * 1000);
    setFormData({
      bloodGroup: "O+",
      units: 5,
      collectionDate: today.toISOString().split("T")[0],
      expiryDate: expiry.toISOString().split("T")[0],
      storageLocation: "Cold Vault Alpha - Rack 1",
      status: "Available",
      notes: "",
    });
    setActionError(null);
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: InventoryBatch) => {
    setSelectedItem(item);
    setFormData({
      bloodGroup: item.bloodGroup,
      units: item.units,
      collectionDate: new Date(item.collectionDate).toISOString().split("T")[0],
      expiryDate: new Date(item.expiryDate).toISOString().split("T")[0],
      storageLocation: item.storageLocation,
      status: item.status,
      notes: item.notes || "",
    });
    setActionError(null);
    setIsEditOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (item: InventoryBatch) => {
    setSelectedItem(item);
    setActionError(null);
    setIsDeleteOpen(true);
  };

  // Handle Add Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Batch ${data.data.inventoryId} (${data.data.bloodGroup}, ${data.data.units} units) recorded!`);
        setIsAddOpen(false);
        loadInventory();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to add inventory record.");
      }
    } catch (err) {
      setActionError("Error saving record.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/inventory/${selectedItem.inventoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(`Batch ${selectedItem.inventoryId} updated successfully.`);
        setIsEditOpen(false);
        loadInventory();
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
    if (!selectedItem) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/inventory/${selectedItem.inventoryId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccess(data.message);
        setIsDeleteOpen(false);
        loadInventory();
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setActionError(data.error || "Failed to remove inventory record.");
      }
    } catch (err) {
      setActionError("Error deleting inventory record.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-[#E50914] mb-1">
            <Database className="h-4 w-4" />
            <span>Vault Inventory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#F5F5F1] tracking-tight">
            Blood Inventory Management
          </h1>
          <p className="text-sm text-[#9E9A97] mt-1">
            Track batches, monitor cold storage shelf life, and manage transfusion-ready stock.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-white text-sm font-semibold shadow-lg shadow-red-900/40 transition-all hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          <span>Add Blood Stock Batch</span>
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
      {actionError && !isAddOpen && !isEditOpen && !isDeleteOpen && (
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

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {BLOOD_GROUPS.map((bg) => {
          const units = stockByGroup[bg] || 0;
          const isSelected = filterBloodGroup === bg;
          return (
            <button
              key={bg}
              type="button"
              onClick={() => setFilterBloodGroup(isSelected ? "" : bg)}
              className={`p-3 rounded-xl border text-center transition-all ${
                isSelected
                  ? "bg-[#E50914]/20 border-[#E50914] text-white shadow-lg shadow-red-950/50"
                  : "bg-[#221F1F]/60 border-white/5 hover:border-white/20 text-[#F5F5F1]"
              }`}
            >
              <div className="text-xs font-mono font-bold text-[#E50914]">{bg}</div>
              <div className="text-lg font-black mt-0.5">{units}</div>
              <div className="text-[10px] text-[#9E9A97]">Available</div>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="rounded-2xl bg-[#221F1F]/80 border border-white/10 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Quick Pills */}
          <button
            type="button"
            onClick={() => {
              setFilterExpiring(false);
              setFilterExpired(false);
              setFilterStatus("");
              setFilterBloodGroup("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              !filterExpiring && !filterExpired && !filterStatus && !filterBloodGroup
                ? "bg-white/10 border-white/30 text-white"
                : "border-white/5 text-[#9E9A97] hover:text-[#F5F5F1]"
            }`}
          >
            All Stock ({inventory.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterExpiring(false);
              setFilterExpired(false);
              setFilterStatus("Available");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filterStatus === "Available"
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                : "border-white/5 text-[#9E9A97] hover:text-[#F5F5F1]"
            }`}
          >
            Available ({totalUnits} Units)
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterExpiring(!filterExpiring);
              setFilterExpired(false);
              setFilterStatus("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center space-x-1 ${
              filterExpiring
                ? "bg-amber-500/20 border-amber-500 text-amber-300"
                : "border-white/5 text-[#9E9A97] hover:text-[#F5F5F1]"
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>Expiring Soon (&lt; 7 Days)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterExpired(!filterExpired);
              setFilterExpiring(false);
              setFilterStatus("");
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center space-x-1 ${
              filterExpired
                ? "bg-red-500/20 border-red-500 text-red-300"
                : "border-white/5 text-[#9E9A97] hover:text-[#F5F5F1]"
            }`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span>Expired Batches</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setFilterExpiring(false);
              setFilterExpired(false);
            }}
            className="rounded-xl bg-[#1A1717] border border-white/10 px-3 py-1.5 text-xs text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
          >
            <option value="">Filter Status</option>
            {INVENTORY_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl bg-[#221F1F]/80 border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#F5F5F1]">
            <thead className="bg-[#1A1717] text-xs font-semibold text-[#9E9A97] uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Batch ID</th>
                <th className="px-6 py-4">Blood Group</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Collection Date</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Storage Location</th>
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
                      <span>Reading cold storage inventory from MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#9E9A97]">
                    <p className="text-base font-semibold text-[#F5F5F1]">No blood inventory records found</p>
                    <p className="text-xs text-[#9E9A97] mt-1">
                      {filterBloodGroup || filterStatus || filterExpiring || filterExpired
                        ? "Try clearing filters to view all batches."
                        : "Add your first blood inventory batch using the button above."}
                    </p>
                  </td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const expDate = new Date(item.expiryDate);
                  const refTime = serverTime ? new Date(serverTime).getTime() : 0;
                  const daysToExpiry = refTime
                    ? Math.ceil((expDate.getTime() - refTime) / (1000 * 60 * 60 * 24))
                    : 30;
                  const isExpired = daysToExpiry <= 0;
                  const isExpiringSoon = daysToExpiry > 0 && daysToExpiry <= 7;

                  return (
                    <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-[#E50914]">
                        {item.inventoryId}
                      </td>
                      <td className="px-6 py-4">
                        <BloodGroupBadge bloodGroup={item.bloodGroup} />
                      </td>
                      <td className="px-6 py-4 font-bold text-[#F5F5F1]">
                        {item.units} <span className="text-xs font-normal text-[#9E9A97]">unit(s)</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#9E9A97]">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{new Date(item.collectionDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="flex flex-col">
                          <span
                            className={
                              isExpired
                                ? "text-[#E50914] font-bold"
                                : isExpiringSoon
                                ? "text-amber-400 font-semibold"
                                : "text-[#F5F5F1]"
                            }
                          >
                            {expDate.toLocaleDateString()}
                          </span>
                          <span className="text-[11px] text-[#9E9A97]">
                            {isExpired
                              ? "Expired"
                              : `${daysToExpiry} day(s) remaining`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#9E9A97]">
                        <div className="flex items-center space-x-1">
                          <Warehouse className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{item.storageLocation}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                            title="Edit Inventory Details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                            title="Remove Batch"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: ADD INVENTORY BATCH ================= */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Blood Stock Batch"
        description="Record newly collected or received units into cold storage vault."
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              {actionError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Blood Group <span className="text-[#E50914]">*</span>
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Quantity (Units) <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={formData.units}
                onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value, 10) || 1 })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Collection Date <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.collectionDate}
                onChange={(e) => {
                  const newCol = e.target.value;
                  const colTime = new Date(newCol).getTime();
                  const newExp = new Date(colTime + 42 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
                  setFormData({ ...formData, collectionDate: newCol, expiryDate: newExp });
                }}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Expiry Date (Standard ~42 Days) <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Storage Location <span className="text-[#E50914]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                placeholder="e.g. Cold Vault Alpha - Rack 2"
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">
                Inventory Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {INVENTORY_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#9E9A97] mb-1">Batch Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Routine blood donation drive collection"
              className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#141212] border border-white/10 text-xs text-[#9E9A97] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#E50914] hover:bg-[#B81D24] text-xs font-semibold text-white shadow-lg shadow-red-900/40 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Add to Inventory"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: EDIT INVENTORY ================= */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Batch ${selectedItem?.inventoryId}`}
        description="Update unit count, storage location, or status."
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
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Available Units</label>
              <input
                type="number"
                min={0}
                value={formData.units}
                onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Storage Location</label>
              <input
                type="text"
                required
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9E9A97] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as InventoryStatus })}
                className="w-full rounded-xl bg-[#141212] border border-white/10 px-3.5 py-2 text-sm text-[#F5F5F1] focus:outline-none focus:border-[#E50914]"
              >
                {INVENTORY_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
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

      {/* ================= MODAL: DELETE INVENTORY ================= */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Batch Deletion"
        description="Permanently remove or decommission inventory record from MongoDB."
        maxWidth="sm"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
              {actionError}
            </div>
          )}

          <p className="text-xs text-[#F5F5F1]">
            Are you sure you want to remove batch{" "}
            <span className="font-bold text-[#E50914]">{selectedItem?.inventoryId}</span> (
            {selectedItem?.bloodGroup}, {selectedItem?.units} units)?
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
