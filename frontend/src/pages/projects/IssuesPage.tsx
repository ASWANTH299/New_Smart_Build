import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AlertTriangle,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Calendar,
  Eye,
  FileText,
  Users,
  CheckSquare,
  ShieldAlert,
  BarChart3,
} from "lucide-react";
import { issueService } from "../../services/issueService.js";
import { projectService } from "../../services/projectService.js";
import {
  Issue,
  IssueCategory,
  IssuePriority,
  IssueStatus,
  CreateIssueInput,
} from "../../types/issue.js";
import { useToast } from "../../hooks/useToast.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { SlideOverDrawer } from "../../components/ui/SlideOverDrawer.js";
import { Modal } from "../../components/ui/Modal.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { EmptyState } from "../../components/ui/EmptyState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { Pagination } from "../../components/ui/Pagination.js";
import { Metric } from "../../components/ui/Metric.js";

const categoryColors: Record<IssueCategory, { bg: string; text: string; border: string }> = {
  SAFETY: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-800" },
  QUALITY: { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  MATERIAL: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800" },
  EQUIPMENT: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800" },
  SCHEDULE: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-800" },
  WEATHER: { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800" },
  PROJECT: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  PHASE: { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800" },
  TASK: { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800" },
  OTHER: { bg: "bg-zinc-100 dark:bg-zinc-800", text: "text-zinc-700 dark:text-zinc-300", border: "border-zinc-200 dark:border-zinc-700" },
};

const priorityStyles: Record<IssuePriority, { bg: string; text: string; dot: string }> = {
  CRITICAL: { bg: "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30", text: "CRITICAL", dot: "bg-red-500 animate-pulse" },
  HIGH: { bg: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/30", text: "HIGH", dot: "bg-orange-500" },
  MEDIUM: { bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30", text: "MEDIUM", dot: "bg-blue-500" },
  LOW: { bg: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border border-zinc-500/30", text: "LOW", dot: "bg-zinc-400" },
};

export const IssuesPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { showSuccess, showError } = useToast();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Team members for assignee dropdown
  const [teamMembers, setTeamMembers] = useState<
    Array<{ id: string; name: string; email: string; primaryRole: string }>
  >([]);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalIssues, setTotalIssues] = useState<number>(0);

  // Detail Drawer
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateIssueInput>({
    title: "",
    description: "",
    category: "OTHER",
    priority: "MEDIUM",
    assignedTo: null,
    dueDate: null,
  });

  // Resolve Modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [issueToResolve, setIssueToResolve] = useState<Issue | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolving, setResolving] = useState(false);

  // Quick updating ID
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await projectService.getProjectTeam(projectId);
      if (res.data) {
        setTeamMembers(res.data.map((m) => m.user));
      }
    } catch (err) {
      console.error("Failed to load project team:", err);
    }
  }, [projectId]);

  const fetchIssues = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await issueService.getIssues(projectId, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        category: categoryFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit: 10,
      });
      setIssues(res.data);
      setTotalIssues(res.meta.total);
      setTotalPages(res.meta.totalPages);
    } catch (err: any) {
      console.error("Failed to load issues:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [projectId, statusFilter, priorityFilter, categoryFilter, searchQuery, page]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      showError("Please provide both title and description");
      return;
    }

    try {
      setSubmitting(true);
      await issueService.createIssue(projectId, formData);
      showSuccess("Site issue logged successfully");
      setIsCreateModalOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "OTHER",
        priority: "MEDIUM",
        assignedTo: null,
        dueDate: null,
      });
      fetchIssues();
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to log site issue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (issueId: string, newStatus: IssueStatus) => {
    if (!projectId) return;

    if (newStatus === "RESOLVED") {
      const target = issues.find((i) => i._id === issueId);
      if (target) {
        setIssueToResolve(target);
        setResolutionNotes("");
        setIsResolveModalOpen(true);
      }
      return;
    }

    try {
      setUpdatingId(issueId);
      await issueService.updateIssue(projectId, issueId, { status: newStatus });
      showSuccess(`Status changed to ${newStatus.replace("_", " ")}`);
      fetchIssues();
      if (selectedIssue?._id === issueId) {
        setSelectedIssue((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !issueToResolve) return;

    if (!resolutionNotes.trim()) {
      showError("Please enter resolution notes describing how this issue was resolved");
      return;
    }

    try {
      setResolving(true);
      await issueService.resolveIssue(projectId, issueToResolve._id, resolutionNotes);
      showSuccess("Issue marked as RESOLVED");
      setIsResolveModalOpen(false);
      setIssueToResolve(null);
      setResolutionNotes("");
      fetchIssues();
      if (selectedIssue?._id === issueToResolve._id) {
        setSelectedIssue((prev) =>
          prev
            ? {
                ...prev,
                status: "RESOLVED",
                resolvedAt: new Date().toISOString(),
                resolutionNotes,
              }
            : null
        );
      }
    } catch (err: any) {
      showError(err?.response?.data?.message || "Failed to resolve issue");
    } finally {
      setResolving(false);
    }
  };

  // KPIs
  const openCount = issues.filter((i) => i.status === "OPEN").length;
  const criticalCount = issues.filter(
    (i) => (i.priority === "CRITICAL" || i.priority === "HIGH") && i.status !== "CLOSED" && i.status !== "RESOLVED"
  ).length;
  const resolvedCount = issues.filter(
    (i) => i.status === "RESOLVED" || i.status === "CLOSED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
          Site Issues & Snag Tracking
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Report Issue
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Links */}
      <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2 text-sm overflow-x-auto">
        <Link
          to={`/projects/${projectId}/daily-reports`}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 pb-2 flex items-center gap-1.5 shrink-0"
        >
          <FileText className="w-4 h-4" /> Daily Site Reports
        </Link>
        <Link
          to={`/projects/${projectId}/issues`}
          className="font-semibold border-b-2 border-amber-500 text-zinc-900 dark:text-white pb-2 -mb-2.5 flex items-center gap-1.5 shrink-0"
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
          label="Total Issues"
          value={totalIssues}
          subtext="Logged in project ledger"
          icon={<AlertTriangle className="w-5 h-5 text-zinc-500" />}
        />
        <Metric
          label="Open Issues"
          value={openCount}
          subtext="Unresolved active items"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
        />
        <Metric
          label="Critical / High"
          value={criticalCount}
          subtext="Requires urgent mitigation"
          icon={<ShieldAlert className="w-5 h-5 text-red-500" />}
        />
        <Metric
          label="Resolved / Closed"
          value={resolvedCount}
          subtext="Successfully rectified"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800/80 rounded-lg mb-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <Input
              placeholder="Search..."
              className="h-8 text-xs pl-8 w-32"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            className="h-8 text-xs min-w-[120px]"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Statuses" },
              { value: "OPEN", label: "Open" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "RESOLVED", label: "Resolved" },
              { value: "CLOSED", label: "Closed" },
            ]}
          />
          <Select
            className="h-8 text-xs min-w-[120px]"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Priorities" },
              { value: "CRITICAL", label: "Critical" },
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
              { value: "LOW", label: "Low" },
            ]}
          />
          <Select
            className="h-8 text-xs min-w-[130px]"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: "", label: "All Categories" },
              { value: "SAFETY", label: "Safety" },
              { value: "QUALITY", label: "Quality" },
              { value: "MATERIAL", label: "Material" },
              { value: "EQUIPMENT", label: "Equipment" },
              { value: "SCHEDULE", label: "Schedule" },
              { value: "WEATHER", label: "Weather" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => {
            setStatusFilter("");
            setPriorityFilter("");
            setCategoryFilter("");
            setSearchQuery("");
            setPage(1);
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* Issues Table & Card View */}
      {loading ? (
        <LoadingState message="Loading site issues..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchIssues} />
      ) : issues.length === 0 ? (
        <EmptyState
          title="No site issues reported"
          description="No active hazards or snags match your current criteria. Log site issues promptly to keep team informed."
          action={<Button onClick={() => setIsCreateModalOpen(true)}>Report Site Issue</Button>}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {issues.map((issue) => {
              const pStyle = priorityStyles[issue.priority] || priorityStyles.MEDIUM;
              const catStyle = categoryColors[issue.category] || categoryColors.OTHER;

              return (
                <Card
                  key={issue._id}
                  className="hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedIssue(issue);
                    setIsDetailDrawerOpen(true);
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                          {issue.issueNumber}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${pStyle.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot}`} />
                          {pStyle.text}
                        </span>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {issue.category}
                        </span>

                        <StatusBadge
                          status={issue.status.toLowerCase()}
                          label={issue.status.replace("_", " ")}
                        />
                      </div>

                      <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {issue.title}
                      </h3>

                      <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">
                        {issue.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                        <span>Reported by: <strong className="text-zinc-700 dark:text-zinc-300">{issue.reportedBy?.name || "Member"}</strong></span>
                        {issue.assignedTo ? (
                          <span className="flex items-center gap-1">
                            <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                            Assigned to: <strong className="text-zinc-700 dark:text-zinc-300">{issue.assignedTo.name}</strong>
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 italic">Unassigned</span>
                        )}
                        {issue.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            Due: {new Date(issue.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {issue.resolvedAt && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Resolved on {new Date(issue.resolvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Quick Status Select */}
                      <div className="w-36">
                        <Select
                          value={issue.status}
                          disabled={updatingId === issue._id}
                          onChange={(e) =>
                            handleQuickStatusChange(issue._id, e.target.value as IssueStatus)
                          }
                          options={[
                            { value: "OPEN", label: "Open" },
                            { value: "IN_PROGRESS", label: "In Progress" },
                            { value: "RESOLVED", label: "Resolve..." },
                            { value: "CLOSED", label: "Closed" },
                          ]}
                        />
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => {
                          setSelectedIssue(issue);
                          setIsDetailDrawerOpen(true);
                        }}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Report Issue Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Report New Site Issue or Hazard"
      >
        <form onSubmit={handleCreateIssue} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Issue Title *
            </label>
            <Input
              required
              placeholder="e.g. Scaffolding defect on Sector 4 east facade"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Category
              </label>
              <Select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as IssueCategory })
                }
                options={[
                  { value: "SAFETY", label: "Safety Hazard" },
                  { value: "QUALITY", label: "Quality Defect" },
                  { value: "MATERIAL", label: "Material Shortage / Damage" },
                  { value: "EQUIPMENT", label: "Equipment Breakdown" },
                  { value: "SCHEDULE", label: "Schedule Delay" },
                  { value: "WEATHER", label: "Weather Impasse" },
                  { value: "OTHER", label: "Other / Operational" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Priority
              </label>
              <Select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as IssuePriority })
                }
                options={[
                  { value: "LOW", label: "Low (Minor observation)" },
                  { value: "MEDIUM", label: "Medium (Standard attention)" },
                  { value: "HIGH", label: "High (Action required soon)" },
                  { value: "CRITICAL", label: "Critical (Halt work / Urgent)" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Assignee
              </label>
              <Select
                value={formData.assignedTo || ""}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value || null })
                }
                options={[
                  { value: "", label: "Unassigned" },
                  ...teamMembers.map((m) => ({
                    value: m.id,
                    label: `${m.name} (${m.primaryRole})`,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Target Due Date
              </label>
              <Input
                type="date"
                value={formData.dueDate || ""}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value || null })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Issue Description & Immediate Impact *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Provide exact location, hazards encountered, trades affected, and any initial containment taken..."
              className="w-full text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Report Issue
            </Button>
          </div>
        </form>
      </Modal>

      {/* Resolve Issue Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false);
          setIssueToResolve(null);
        }}
        title={`Resolve Issue: ${issueToResolve?.issueNumber || ""}`}
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Please document the corrective actions taken to rectify: <strong>{issueToResolve?.title}</strong>
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Resolution Notes & Root Cause Fix *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail actions taken, repairs performed, replacements delivered, or inspections verified..."
              className="w-full text-sm rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsResolveModalOpen(false);
                setIssueToResolve(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={resolving}>
              Mark as Resolved
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issue Detail Drawer */}
      <SlideOverDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        title={selectedIssue ? `${selectedIssue.issueNumber} - Details` : "Issue Detail"}
      >
        {selectedIssue && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    priorityStyles[selectedIssue.priority]?.bg
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityStyles[selectedIssue.priority]?.dot}`} />
                  {selectedIssue.priority}
                </span>

                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    categoryColors[selectedIssue.category]?.bg
                  } ${categoryColors[selectedIssue.category]?.text} ${
                    categoryColors[selectedIssue.category]?.border
                  }`}
                >
                  {selectedIssue.category}
                </span>

                <StatusBadge
                  status={selectedIssue.status.toLowerCase()}
                  label={selectedIssue.status.replace("_", " ")}
                />
              </div>

              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {selectedIssue.title}
              </h3>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Description & Impact
              </h4>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {selectedIssue.description}
              </div>
            </div>

            {selectedIssue.resolutionNotes && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Resolution Notes
                </h4>
                <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">
                  {selectedIssue.resolutionNotes}
                </div>
              </div>
            )}

            {/* Assignments & Dates */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Assigned To:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedIssue.assignedTo?.name || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Reported By:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedIssue.reportedBy?.name || "Member"}
                </span>
              </div>
              {selectedIssue.dueDate && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Target Due Date:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {new Date(selectedIssue.dueDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {selectedIssue.resolvedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Resolved Date:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {new Date(selectedIssue.resolvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Reported Date:</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {new Date(selectedIssue.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Update Status
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedIssue.status !== "IN_PROGRESS" && selectedIssue.status !== "RESOLVED" && selectedIssue.status !== "CLOSED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickStatusChange(selectedIssue._id, "IN_PROGRESS")}
                  >
                    Start In Progress
                  </Button>
                )}
                {selectedIssue.status !== "RESOLVED" && selectedIssue.status !== "CLOSED" && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIssueToResolve(selectedIssue);
                      setResolutionNotes("");
                      setIsResolveModalOpen(true);
                    }}
                  >
                    Resolve Issue
                  </Button>
                )}
                {selectedIssue.status !== "CLOSED" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickStatusChange(selectedIssue._id, "CLOSED")}
                  >
                    Close Issue
                  </Button>
                )}
                {selectedIssue.status === "RESOLVED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickStatusChange(selectedIssue._id, "OPEN")}
                  >
                    Reopen Issue
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </SlideOverDrawer>
    </div>
  );
};

export default IssuesPage;
