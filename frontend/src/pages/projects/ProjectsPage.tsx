import React, { useState, useMemo } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { FilterBar } from "../../components/ui/FilterBar.js";
import { DataTable, Column } from "../../components/ui/DataTable.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { Button } from "../../components/ui/Button.js";
import { Modal } from "../../components/ui/Modal.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { useProjectContext } from "../../hooks/useProjectContext.js";
import { useToast } from "../../hooks/useToast.js";
import { ProjectContextType } from "../../types/index.js";

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  client: string;
  manager: string;
  status: string;
  health: "HEALTHY" | "AT_RISK" | "CRITICAL";
  progress: number;
  startDate: string;
  targetCompletionDate: string;
}

const INITIAL_MOCK_PROJECTS: ProjectRow[] = [
  {
    id: "p1",
    code: "PRJ-001",
    name: "Metro Tower Phase 2",
    client: "Urban Skyline Developers",
    manager: "Rajesh Kumar (PM)",
    status: "active",
    health: "HEALTHY",
    progress: 68,
    startDate: "2025-01-15",
    targetCompletionDate: "2026-12-30",
  },
  {
    id: "p2",
    code: "PRJ-002",
    name: "Highway Overpass Sector 4",
    client: "National Infrastructure Corp",
    manager: "Ananya Sen (PM)",
    status: "active",
    health: "HEALTHY",
    progress: 42,
    startDate: "2025-04-01",
    targetCompletionDate: "2027-03-31",
  },
  {
    id: "p3",
    code: "PRJ-003",
    name: "Greenfield Commercial Park",
    client: "Apex Real Estate Holdings",
    manager: "Vikram Malhotra (PM)",
    status: "risk",
    health: "AT_RISK",
    progress: 25,
    startDate: "2025-08-10",
    targetCompletionDate: "2027-08-15",
  },
  {
    id: "p4",
    code: "PRJ-004",
    name: "Coastal Water Treatment Facility",
    client: "Municipal Water Board",
    manager: "Rajesh Kumar (PM)",
    status: "planning",
    health: "HEALTHY",
    progress: 10,
    startDate: "2026-02-01",
    targetCompletionDate: "2028-01-30",
  },
];

export const ProjectsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectCode, setNewProjectCode] = useState("");
  const [newProjectClient, setNewProjectClient] = useState("");

  const { activeProject, setActiveProject } = useProjectContext();
  const { showSuccess } = useToast();

  const filteredProjects = useMemo(() => {
    return INITIAL_MOCK_PROJECTS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.client.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || p.status.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const handleSelectActiveProject = (row: ProjectRow) => {
    const projectContext: ProjectContextType = {
      id: row.id,
      code: row.code,
      name: row.name,
      status: "ACTIVE",
      health: row.health,
      progress: row.progress,
    };
    setActiveProject(projectContext);
    showSuccess("Active Context Set", `Switched to project: ${row.name} (${row.code})`);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess("Project Created (Shell Demo)", `Project ${newProjectName} created.`);
    setIsModalOpen(false);
    setNewProjectName("");
    setNewProjectCode("");
    setNewProjectClient("");
  };

  const columns: Column<ProjectRow>[] = [
    {
      key: "code",
      header: "Code",
      className: "w-28 font-mono text-xs font-semibold text-slate-700",
    },
    {
      key: "name",
      header: "Project & Client",
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500">{row.client}</div>
        </div>
      ),
    },
    {
      key: "health",
      header: "Health",
      render: (row) => <StatusBadge status={row.health.toLowerCase()} size="sm" />,
    },
    {
      key: "progress",
      header: "Progress",
      className: "w-44",
      render: (row) => (
        <ProgressIndicator progress={row.progress} size="sm" showLabel={false} />
      ),
    },
    {
      key: "manager",
      header: "Project Manager",
      className: "text-xs text-slate-600 hidden md:table-cell",
    },
    {
      key: "actions",
      header: "Context",
      align: "right",
      render: (row) => {
        const isCurrent = activeProject?.id === row.id;
        return (
          <Button
            variant={isCurrent ? "secondary" : "outline"}
            size="sm"
            onClick={() => handleSelectActiveProject(row)}
            leftIcon={isCurrent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : undefined}
            className="text-xs py-1 px-2.5"
          >
            {isCurrent ? "Active" : "Set Active"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Construction Projects Directory"
        description="Comprehensive overview of all active, planning, and completed capital projects."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create Project
          </Button>
        }
      />

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Filter by project code, title, or client..."
        hasActiveFilters={searchTerm !== "" || statusFilter !== "ALL"}
        onClearFilters={() => {
          setSearchTerm("");
          setStatusFilter("ALL");
        }}
      >
        <Select
          options={[
            { value: "ALL", label: "All Statuses" },
            { value: "ACTIVE", label: "Active" },
            { value: "PLANNING", label: "Planning" },
            { value: "RISK", label: "At Risk" },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-36 py-1.5 text-xs"
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={filteredProjects}
        keyExtractor={(row) => row.id}
        emptyTitle="No Projects Found"
        emptyDescription="Try adjusting your search criteria or create a new project."
      />

      {/* Create Project Modal (Phase 3 Shell) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
        description="Initialize a new construction project shell."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Code"
            required
            placeholder="e.g. PRJ-005"
            value={newProjectCode}
            onChange={(e) => setNewProjectCode(e.target.value)}
          />
          <Input
            label="Project Name"
            required
            placeholder="e.g. Riverside Residential Complex"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <Input
            label="Client Organization"
            required
            placeholder="e.g. Riverside Infrastructure Ltd."
            value={newProjectClient}
            onChange={(e) => setNewProjectClient(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectsPage;
