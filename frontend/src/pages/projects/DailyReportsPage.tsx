import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileText,
  Plus,
  Calendar,
  Sun,
  CloudRain,
  Cloud,
  CloudLightning,
  Wind,
  Thermometer,
  Users,
  CheckCircle2,
  Clock,
  Eye,
  Check,
  Truck,
  Package,
  CheckSquare,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { dailyReportService } from "../../services/dailyReportService.js";
import {
  DailyReport,
  WeatherCondition,
  CreateDailyReportInput,
} from "../../types/dailyReport.js";
import { useAuth } from "../../hooks/useAuth.js";
import { useToast } from "../../hooks/useToast.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { SlideOverDrawer } from "../../components/ui/SlideOverDrawer.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { Pagination } from "../../components/ui/Pagination.js";
import { Metric } from "../../components/ui/Metric.js";

const weatherIcons: Record<WeatherCondition, React.ReactNode> = {
  SUNNY: <Sun className="w-4 h-4 text-amber-500" />,
  RAINY: <CloudRain className="w-4 h-4 text-blue-500" />,
  CLOUDY: <Cloud className="w-4 h-4 text-zinc-500" />,
  STORMY: <CloudLightning className="w-4 h-4 text-purple-500" />,
  WINDY: <Wind className="w-4 h-4 text-teal-500" />,
  HOT: <Thermometer className="w-4 h-4 text-red-500" />,
  COLD: <Thermometer className="w-4 h-4 text-cyan-500" />,
  OTHER: <Cloud className="w-4 h-4 text-zinc-500" />,
};

export const DailyReportsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalReports, setTotalReports] = useState<number>(0);

  // Detail Modal / Drawer
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Create Modal / Drawer
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateDailyReportInput>({
    date: new Date().toISOString().split("T")[0],
    weatherCondition: "SUNNY",
    workPerformed: "",
    laborHeadcount: 0,
    equipmentUsed: [],
    materialsConsumed: [],
    photos: [],
    notes: "",
    issues: [],
  });

  const [equipmentInput, setEquipmentInput] = useState("");
  const [materialNameInput, setMaterialNameInput] = useState("");
  const [materialQtyInput, setMaterialQtyInput] = useState<number>(0);
  const [materialUnitInput, setMaterialUnitInput] = useState("units");

  // Approval state
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const canApprove =
    user?.primaryRole === "ADMIN" || user?.primaryRole === "PROJECT_MANAGER";
  const canCreate =
    user?.primaryRole === "ADMIN" ||
    user?.primaryRole === "PROJECT_MANAGER" ||
    user?.primaryRole === "SITE_ENGINEER";

  const fetchReports = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await dailyReportService.getReports(projectId, {
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 10,
      });
      setReports(res.data);
      setTotalReports(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      console.error("Failed to load daily reports:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter, startDate, endDate, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (!formData.workPerformed.trim()) {
      showError("Please specify the work performed today");
      return;
    }

    try {
      setSubmitting(true);
      await dailyReportService.createReport(projectId, formData);
      showSuccess("Daily site report submitted successfully");
      setIsCreateDrawerOpen(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        weatherCondition: "SUNNY",
        workPerformed: "",
        laborHeadcount: 0,
        equipmentUsed: [],
        materialsConsumed: [],
        photos: [],
        notes: "",
        issues: [],
      });
      fetchReports();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to submit daily report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReport = async (reportId: string) => {
    if (!projectId) return;
    try {
      setApprovingId(reportId);
      await dailyReportService.approveReport(
        projectId,
        reportId,
        "Reviewed and verified by Project Management"
      );
      showSuccess("Report approved successfully");
      if (selectedReport?._id === reportId) {
        setSelectedReport((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
      }
      fetchReports();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to approve daily report");
    } finally {
      setApprovingId(null);
    }
  };

  const addEquipmentTag = () => {
    if (equipmentInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        equipmentUsed: [...(prev.equipmentUsed || []), equipmentInput.trim()],
      }));
      setEquipmentInput("");
    }
  };

  const removeEquipmentTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipmentUsed: (prev.equipmentUsed || []).filter((_, i) => i !== index),
    }));
  };

  const addMaterialItem = () => {
    if (materialNameInput.trim() && materialQtyInput > 0) {
      setFormData((prev) => ({
        ...prev,
        materialsConsumed: [
          ...(prev.materialsConsumed || []),
          {
            materialName: materialNameInput.trim(),
            quantity: materialQtyInput,
            unit: materialUnitInput.trim() || "units",
          },
        ],
      }));
      setMaterialNameInput("");
      setMaterialQtyInput(0);
      setMaterialUnitInput("units");
    }
  };

  const removeMaterialItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      materialsConsumed: (prev.materialsConsumed || []).filter((_, i) => i !== index),
    }));
  };

  // KPIs
  const submittedCount = reports.filter((r) => r.status === "SUBMITTED").length;
  const approvedCount = reports.filter((r) => r.status === "APPROVED").length;
  const totalHeadcountLogged = reports.reduce((acc, r) => acc + (r.laborHeadcount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
          Daily Site Operations (DPR)
        </h1>

        <div className="flex items-center gap-2">
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateDrawerOpen(true)}
            >
              + New Report
            </Button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-sm overflow-x-auto">
        <Link
          to={`/projects/${projectId}/daily-reports`}
          className="font-semibold border-b-2 border-amber-500 text-zinc-900 dark:text-white pb-2 -mb-2.5 flex items-center gap-1.5 shrink-0"
        >
          <FileText className="w-4 h-4" /> Daily Site Reports
        </Link>
        <Link
          to={`/projects/${projectId}/issues`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <AlertTriangle className="w-4 h-4" /> Site Issues & Snags
        </Link>
        <Link
          to={`/projects/${projectId}/workforce`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <Users className="w-4 h-4" /> Workforce
        </Link>
        <Link
          to={`/projects/${projectId}/attendance`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <Clock className="w-4 h-4" /> Attendance
        </Link>
        <Link
          to={`/projects/${projectId}/tasks`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <CheckSquare className="w-4 h-4" /> Tasks
        </Link>
        <Link
          to={`/projects/${projectId}/reports`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <BarChart3 className="w-4 h-4" /> Reports & Analytics
        </Link>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Metric
          label="Total Reports Filed"
          value={totalReports}
          subtext="Total DPR logs on record"
          icon={<FileText className="w-5 h-5 text-brand-600" />}
        />
        <Metric
          label="Pending Review"
          value={submittedCount}
          subtext="Awaiting PM signoff"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <Metric
          label="Approved Reports"
          value={approvedCount}
          subtext="Verified site logs"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />
        <Metric
          label="Recent Labor Headcount"
          value={totalHeadcountLogged}
          subtext="Personnel reported active"
          icon={<Users className="w-5 h-5 text-indigo-500" />}
        />
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/80 rounded-lg mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select
            className="h-8 text-xs min-w-[140px]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Statuses" },
              { value: "SUBMITTED", label: "Submitted (Pending)" },
              { value: "REVIEWED", label: "Reviewed" },
              { value: "APPROVED", label: "Approved" },
            ]}
          />
          <Input
            className="h-8 text-xs"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
          <span className="text-zinc-500 text-xs">to</span>
          <Input
            className="h-8 text-xs"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            setStatusFilter("");
            setStartDate("");
            setEndDate("");
            setPage(1);
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* Reports List */}
      {loading ? (
        <LoadingState message="Loading daily site reports..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReports} />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No daily site reports filed"
          description="Site engineers submit daily logs detailing weather, work progress, headcount, and site equipment."
          action={canCreate ? <Button onClick={() => setIsCreateDrawerOpen(true)}>Create First DPR</Button> : undefined}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <Card
                key={report._id}
                className="hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedReport(report);
                  setIsDetailDrawerOpen(true);
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                        {report.reportNumber}
                      </span>

                      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {weatherIcons[report.weatherCondition] || weatherIcons.OTHER}
                        <span>{report.weatherCondition}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{new Date(report.date || report.reportDate).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-medium">{report.laborHeadcount} Personnel</span>
                      </div>

                      <StatusBadge status={report.status.toLowerCase()} label={report.status} />
                    </div>

                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2">
                      {report.workPerformed}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>Submitted by: <strong className="text-zinc-700 dark:text-zinc-300">{report.submittedBy?.name || "Site Engineer"}</strong></span>
                      {report.reviewedBy && (
                        <span>Reviewed by: <strong className="text-zinc-700 dark:text-zinc-300">{report.reviewedBy.name}</strong></span>
                      )}
                      {report.equipmentUsed && report.equipmentUsed.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Truck className="w-3 h-3 text-zinc-400" />
                          {report.equipmentUsed.length} Equipment logged
                        </span>
                      )}
                      {report.materialsConsumed && report.materialsConsumed.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-zinc-400" />
                          {report.materialsConsumed.length} Materials consumed
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setSelectedReport(report);
                        setIsDetailDrawerOpen(true);
                      }}
                    >
                      View Log
                    </Button>

                    {canApprove && report.status !== "APPROVED" && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Check className="w-3.5 h-3.5" />}
                        disabled={approvingId === report._id}
                        onClick={() => handleApproveReport(report._id)}
                      >
                        {approvingId === report._id ? "Approving..." : "Approve Report"}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* New Report SlideOver Drawer */}
      <SlideOverDrawer
        isOpen={isCreateDrawerOpen}
        onClose={() => setIsCreateDrawerOpen(false)}
        title="Submit Daily Site Report (DPR)"
      >
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Report Date *
              </label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Weather Condition
              </label>
              <Select
                value={formData.weatherCondition}
                onChange={(e) =>
                  setFormData({ ...formData, weatherCondition: e.target.value as WeatherCondition })
                }
                options={[
                  { value: "SUNNY", label: "Sunny / Clear" },
                  { value: "RAINY", label: "Rainy / Wet" },
                  { value: "CLOUDY", label: "Cloudy / Overcast" },
                  { value: "STORMY", label: "Stormy / Adverse" },
                  { value: "WINDY", label: "High Winds" },
                  { value: "HOT", label: "Excessive Heat" },
                  { value: "COLD", label: "Cold Wave" },
                  { value: "OTHER", label: "Other" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Labor Headcount On-Site
            </label>
            <Input
              type="number"
              min={0}
              placeholder="e.g. 25"
              value={formData.laborHeadcount || ""}
              onChange={(e) =>
                setFormData({ ...formData, laborHeadcount: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Work Performed Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe work completed, zones covered, structural elements poured, masonry progress..."
              className="w-full text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.workPerformed}
              onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
            />
          </div>

          {/* Equipment Used */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Equipment Deployed
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="e.g. CAT 320 Excavator, JCB Backhoe..."
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addEquipmentTag();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addEquipmentTag}>
                Add
              </Button>
            </div>
            {formData.equipmentUsed && formData.equipmentUsed.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.equipmentUsed.map((eq, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  >
                    <Truck className="w-3 h-3 text-zinc-500" />
                    {eq}
                    <button
                      type="button"
                      onClick={() => removeEquipmentTag(i)}
                      className="text-zinc-400 hover:text-red-500 ml-1"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Materials Consumed */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Materials Consumed
            </label>
            <div className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-6">
                <Input
                  placeholder="Material name"
                  value={materialNameInput}
                  onChange={(e) => setMaterialNameInput(e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <Input
                  type="number"
                  placeholder="Qty"
                  min={0}
                  value={materialQtyInput || ""}
                  onChange={(e) => setMaterialQtyInput(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="col-span-3 flex gap-1">
                <Input
                  placeholder="Unit"
                  value={materialUnitInput}
                  onChange={(e) => setMaterialUnitInput(e.target.value)}
                />
                <Button type="button" variant="outline" size="sm" onClick={addMaterialItem}>
                  +
                </Button>
              </div>
            </div>
            {formData.materialsConsumed && formData.materialsConsumed.length > 0 && (
              <div className="space-y-1">
                {formData.materialsConsumed.map((mat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-2.5 py-1 text-xs rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                  >
                    <span className="font-medium">{mat.materialName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-500">
                        {mat.quantity} {mat.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMaterialItem(i)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Site Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              General Notes / Site Observations
            </label>
            <textarea
              rows={2}
              placeholder="Any remarks, safety briefings, site visitor notes..."
              className="w-full text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Submit Report
            </Button>
          </div>
        </form>
      </SlideOverDrawer>

      {/* Detail SlideOver Drawer */}
      <SlideOverDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedReport?.reportNumber || "Daily Report Details"}
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {new Date(selectedReport.date || selectedReport.reportDate).toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {weatherIcons[selectedReport.weatherCondition]}
                    <span>{selectedReport.weatherCondition} Weather</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{selectedReport.laborHeadcount} Personnel</span>
                  </div>
                </div>
              </div>
              <StatusBadge
                status={selectedReport.status.toLowerCase()}
                label={selectedReport.status}
              />
            </div>

            {/* Work Performed */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Work Performed
              </h4>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {selectedReport.workPerformed}
              </div>
            </div>

            {/* Equipment Deployed */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Equipment On-Site
              </h4>
              {selectedReport.equipmentUsed && selectedReport.equipmentUsed.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedReport.equipmentUsed.map((eq, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      <Truck className="w-3.5 h-3.5 text-zinc-400" />
                      {eq}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No heavy equipment recorded for this shift.</p>
              )}
            </div>

            {/* Materials Consumed */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Materials Consumed
              </h4>
              {selectedReport.materialsConsumed && selectedReport.materialsConsumed.length > 0 ? (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/70 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="p-2.5 font-semibold text-zinc-700 dark:text-zinc-300">Material</th>
                        <th className="p-2.5 font-semibold text-zinc-700 dark:text-zinc-300 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {selectedReport.materialsConsumed.map((mat, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-medium text-zinc-800 dark:text-zinc-200">
                            {mat.materialName || "Material"}
                          </td>
                          <td className="p-2.5 text-right font-mono text-zinc-600 dark:text-zinc-400">
                            {mat.quantity} {mat.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No materials recorded as consumed today.</p>
              )}
            </div>

            {/* Notes */}
            {selectedReport.notes && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                  General Notes
                </h4>
                <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-850 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {selectedReport.notes}
                </p>
              </div>
            )}

            {/* Submission & Review Metadata */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs text-zinc-500">
              <div className="flex justify-between">
                <span>Submitted by:</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {selectedReport.submittedBy?.name} ({selectedReport.submittedBy?.email})
                </span>
              </div>
              {selectedReport.reviewedBy && (
                <div className="flex justify-between">
                  <span>Reviewed by:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedReport.reviewedBy?.name}
                  </span>
                </div>
              )}
              {selectedReport.reviewNotes && (
                <div className="mt-2 p-2.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 text-xs">
                  Reviewer Notes: {selectedReport.reviewNotes}
                </div>
              )}
            </div>

            {/* PM Approval Action */}
            {canApprove && selectedReport.status !== "APPROVED" && (
              <div className="pt-4">
                <Button
                  variant="primary"
                  className="w-full"
                  leftIcon={<Check className="w-4 h-4" />}
                  isLoading={approvingId === selectedReport._id}
                  onClick={() => handleApproveReport(selectedReport._id)}
                >
                  Approve Daily Report
                </Button>
              </div>
            )}
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};

export default DailyReportsPage;
