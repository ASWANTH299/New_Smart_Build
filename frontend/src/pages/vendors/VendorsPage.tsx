import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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
import EmptyState from "../../components/ui/EmptyState.js";
import ErrorState from "../../components/ui/ErrorState.js";

export const VendorsPage: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactDesignation: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    selectedMaterials: [] as string[],
  });

  const canManage =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "STORE_MANAGER" ||
    user?.primaryRole === "PROJECT_MANAGER";

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [vendorRes, matRes] = await Promise.all([
        procurementService.getVendors({
          search: searchTerm || undefined,
          status: (statusFilter as VendorStatus) || undefined,
        }),
        materialService.getMaterials({ status: "ACTIVE" }),
      ]);

      if (vendorRes.success && vendorRes.data) {
        setVendors(vendorRes.data);
      }
      if (matRes.success && matRes.data) {
        setMaterials(matRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.contactName || !formData.contactEmail || !formData.contactPhone || !formData.city) {
      showError("Validation Error", "Please fill in all required vendor fields.");
      return;
    }

    try {
      setCreating(true);
      const res = await procurementService.createVendor({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        contact: {
          name: formData.contactName.trim(),
          email: formData.contactEmail.trim().toLowerCase(),
          phone: formData.contactPhone.trim(),
          designation: formData.contactDesignation.trim(),
        },
        address: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          postalCode: formData.postalCode.trim(),
          country: formData.country.trim() || "India",
        },
        materialsSupplied: formData.selectedMaterials,
      });

      if (res.success && res.data) {
        showSuccess("Vendor Registered", `Vendor ${res.data.name} (${res.data.code}) registered successfully.`);
        setIsCreateModalOpen(false);
        setFormData({
          code: "",
          name: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          contactDesignation: "",
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India",
          selectedMaterials: [],
        });
        fetchVendors();
      }
    } catch (err: unknown) {
      showError("Error", err instanceof Error ? err.message : "Failed to register vendor");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Vendor Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supplier records, contacts, supplied materials catalog, and delivery performance metrics.
          </p>
        </div>

        {canManage && (
          <Button
            id="add-vendor-btn"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Register Vendor
          </Button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <Input
              id="search-vendors-input"
              type="text"
              placeholder="Search vendor name, code, contact or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: "", label: "All Statuses" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "BLACKLISTED", label: "Blacklisted" },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Vendors Table */}
      {loading ? (
        <LoadingState message="Loading vendor catalog..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchVendors} />
      ) : vendors.length === 0 ? (
        <EmptyState
          title="No vendors found"
          description="Register suppliers and contractors to begin issuing procurement purchase orders."
          action={
            canManage ? (
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                Register First Vendor
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Vendor Code</th>
                  <th className="py-3.5 px-4">Supplier Name</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Rating</th>
                  <th className="py-3.5 px-4 text-center">Orders</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/60 font-mono text-xs">
                {vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-brand-600 dark:text-brand-400">
                      <Link to={`/vendors/${vendor._id}`} className="hover:underline">
                        {vendor.code}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-900 dark:text-white">
                      {vendor.name}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div>{vendor.contact.name}</div>
                      <div className="text-slate-400 text-xs">{vendor.contact.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      {vendor.address.city}, {vendor.address.country}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                        ★ {vendor.performanceSummary?.rating?.toFixed(1) || "5.0"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {vendor.performanceSummary?.totalOrders || 0}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={vendor.status.toLowerCase()} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <Link
                        to={`/vendors/${vendor._id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Register Vendor Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Register New Vendor"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Vendor Code *
                </label>
                <Input
                  id="vendor-code-input"
                  placeholder="e.g. VEN-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company / Supplier Name *
                </label>
                <Input
                  id="vendor-name-input"
                  placeholder="e.g. Apex Steel Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Primary Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person *
                  </label>
                  <Input
                    id="contact-name-input"
                    placeholder="Full name"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email *
                  </label>
                  <Input
                    id="contact-email-input"
                    type="email"
                    placeholder="sales@vendor.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone *
                  </label>
                  <Input
                    id="contact-phone-input"
                    placeholder="+91-9876543210"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Location & Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    City *
                  </label>
                  <Input
                    id="address-city-input"
                    placeholder="e.g. Hyderabad"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    State
                  </label>
                  <Input
                    id="address-state-input"
                    placeholder="e.g. Telangana"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Country *
                  </label>
                  <Input
                    id="address-country-input"
                    placeholder="India"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Supplied Materials Tagging */}
            {materials.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Supplied Materials (Optional)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                  {materials.map((mat) => {
                    const isChecked = formData.selectedMaterials.includes(mat._id);
                    return (
                      <label key={mat._id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setFormData({
                                ...formData,
                                selectedMaterials: formData.selectedMaterials.filter((id) => id !== mat._id),
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selectedMaterials: [...formData.selectedMaterials, mat._id],
                              });
                            }
                          }}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="font-mono text-brand-600 dark:text-brand-400 font-medium">{mat.code}</span>
                        <span>- {mat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={creating}>
                {creating ? "Registering..." : "Register Vendor"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default VendorsPage;
