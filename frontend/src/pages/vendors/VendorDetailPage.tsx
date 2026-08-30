import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { procurementService } from "../../services/procurementService.js";
import { materialService } from "../../services/materialService.js";
import { Vendor, VendorStatus } from "../../types/procurement.js";
import { Material } from "../../types/material.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import Card from "../../components/ui/Card.js";
import Button from "../../components/ui/Button.js";
import Input from "../../components/ui/Input.js";
import Select from "../../components/ui/Select.js";
import StatusBadge from "../../components/ui/StatusBadge.js";
import Modal from "../../components/ui/Modal.js";
import LoadingState from "../../components/ui/LoadingState.js";
import ErrorState from "../../components/ui/ErrorState.js";

export const VendorDetailPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    status: "ACTIVE" as VendorStatus,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactDesignation: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    selectedMaterials: [] as string[],
  });

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "STORE_MANAGER" ||
    user?.primaryRole === "PROJECT_MANAGER";

  const fetchVendorDetails = useCallback(async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      setError(null);
      const [vendorRes, matRes] = await Promise.all([
        procurementService.getVendorById(vendorId),
        materialService.getMaterials({ status: "ACTIVE" }),
      ]);

      if (vendorRes.success && vendorRes.data) {
        const v = vendorRes.data;
        setVendor(v);

        const currentMatIds = (v.materialsSupplied || []).map((m) =>
          typeof m === "object" ? m._id : String(m)
        );

        setEditFormData({
          name: v.name,
          status: v.status,
          contactName: v.contact.name,
          contactEmail: v.contact.email,
          contactPhone: v.contact.phone,
          contactDesignation: v.contact.designation || "",
          street: v.address.street || "",
          city: v.address.city,
          state: v.address.state || "",
          postalCode: v.address.postalCode || "",
          country: v.address.country,
          selectedMaterials: currentMatIds,
        });
      }

      if (matRes.success && matRes.data) {
        setAllMaterials(matRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load vendor details");
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchVendorDetails();
  }, [fetchVendorDetails]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;

    try {
      setUpdating(true);
      const res = await procurementService.updateVendor(vendorId, {
        name: editFormData.name.trim(),
        status: editFormData.status,
        contact: {
          name: editFormData.contactName.trim(),
          email: editFormData.contactEmail.trim(),
          phone: editFormData.contactPhone.trim(),
          designation: editFormData.contactDesignation.trim(),
        },
        address: {
          street: editFormData.street.trim(),
          city: editFormData.city.trim(),
          state: editFormData.state.trim(),
          postalCode: editFormData.postalCode.trim(),
          country: editFormData.country.trim(),
        },
        materialsSupplied: editFormData.selectedMaterials,
      });

      if (res.success && res.data) {
        showSuccess("Vendor Updated", "Vendor details updated successfully.");
        setIsEditModalOpen(false);
        fetchVendorDetails();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to update vendor");
    } finally {
      setUpdating(false);
    }
  };

  const handleMaterialToggle = (matId: string) => {
    const isSelected = editFormData.selectedMaterials.includes(matId);
    if (isSelected) {
      setEditFormData({
        ...editFormData,
        selectedMaterials: editFormData.selectedMaterials.filter((id) => id !== matId),
      });
    } else {
      setEditFormData({
        ...editFormData,
        selectedMaterials: [...editFormData.selectedMaterials, matId],
      });
    }
  };

  if (loading) return <LoadingState message="Loading supplier profile..." />;
  if (error || !vendor) return <ErrorState message={error || "Vendor not found"} onRetry={fetchVendorDetails} />;

  const suppliedMaterialsList = (vendor.materialsSupplied || []) as Material[];

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/vendors" className="hover:underline text-brand-600 dark:text-brand-400 font-medium">
            ← Vendor Directory
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-700 dark:text-slate-200">{vendor.code}</span>
        </div>

        {canManage && (
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            Edit Supplier Info
          </Button>
        )}
      </div>

      {/* Header Info Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {vendor.code}
              </span>
              <StatusBadge status={vendor.status.toLowerCase()} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {vendor.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Registered Supplier | {vendor.address.city}, {vendor.address.state ? `${vendor.address.state}, ` : ""}{vendor.address.country}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-center">
            <div>
              <div className="text-xs text-slate-500 font-sans">Rating</div>
              <div className="text-xl font-bold text-amber-500">
                ★ {vendor.performanceSummary?.rating?.toFixed(1) || "5.0"}
              </div>
            </div>
            <div className="border-x border-slate-200 dark:border-slate-700 px-3">
              <div className="text-xs text-slate-500 font-sans">Total Orders</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">
                {vendor.performanceSummary?.totalOrders || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-sans">On-Time Rate</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {vendor.performanceSummary?.onTimeDeliveryRate || 100}%
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info Card */}
        <Card className="p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
            Contact & Communication
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs text-slate-500 font-medium">Primary Contact Person</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {vendor.contact.name} {vendor.contact.designation ? `(${vendor.contact.designation})` : ""}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Email Address</div>
              <a href={`mailto:${vendor.contact.email}`} className="text-brand-600 dark:text-brand-400 hover:underline">
                {vendor.contact.email}
              </a>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Phone Number</div>
              <div className="font-mono text-slate-800 dark:text-slate-200">
                {vendor.contact.phone}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Postal Address</div>
              <div className="text-slate-700 dark:text-slate-300">
                {vendor.address.street && `${vendor.address.street}, `}
                {vendor.address.city}, {vendor.address.state} {vendor.address.postalCode}
              </div>
            </div>
          </div>
        </Card>

        {/* Supplied Materials Catalog */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Supplied Materials ({suppliedMaterialsList.length})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-4">Material Code</th>
                    <th className="py-3.5 px-4">Material Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Unit</th>
                    <th className="py-3.5 px-4 text-right">Standard Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                  {suppliedMaterialsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                        No specific catalog materials tagged to this vendor yet.
                      </td>
                    </tr>
                  ) : (
                    suppliedMaterialsList.map((m) => (
                      <tr key={m._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-400">
                          <Link to={`/materials/${m._id}`} className="hover:underline">
                            {m.code}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                          {m.name}
                        </td>
                        <td className="py-3.5 px-4 font-sans">{m.category}</td>
                        <td className="py-3.5 px-4">{m.unit}</td>
                        <td className="py-3.5 px-4 text-right text-slate-900 dark:text-white">
                          ${m.unitPrice?.toFixed(2) || "0.00"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Vendor Modal */}
      {isEditModalOpen && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Vendor Details"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Name *
                </label>
                <Input
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Supplier Status
                </label>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as VendorStatus })}
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                    { value: "BLACKLISTED", label: "Blacklisted" },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contact Person *
                </label>
                <Input
                  value={editFormData.contactName}
                  onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={editFormData.contactEmail}
                  onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Phone *
                </label>
                <Input
                  value={editFormData.contactPhone}
                  onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  City *
                </label>
                <Input
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  State
                </label>
                <Input
                  value={editFormData.state}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Country
                </label>
                <Input
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                />
              </div>
            </div>

            {/* Tag Supplied Materials */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Supplied Materials Catalog Selection
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                {allMaterials.map((mat) => {
                  const isChecked = editFormData.selectedMaterials.includes(mat._id);
                  return (
                    <label key={mat._id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleMaterialToggle(mat._id)}
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="font-mono text-brand-600 dark:text-brand-400 font-medium">{mat.code}</span>
                      <span>- {mat.name} ({mat.category})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={updating}>
                {updating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VendorDetailPage;
