import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Button } from "../../components/ui/Button.js";
import { LoadingState } from "../../components/ui/LoadingState.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { useToast } from "../../hooks/useToast.js";
import { projectService } from "../../services/projectService.js";
import { userService } from "../../services/userService.js";
import { User } from "../../types/index.js";

export const EditProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [managers, setManagers] = useState<User[]>([]);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [health, setHealth] = useState<"HEALTHY" | "AT_RISK" | "CRITICAL">("HEALTHY");

  useEffect(() => {
    if (!projectId) return;
    setIsLoading(true);
    Promise.all([
      projectService.getProjectById(projectId),
      userService.getUsers({ role: "PROJECT_MANAGER" }),
    ])
      .then(([projectRes, managersRes]) => {
        if (projectRes.success && projectRes.data) {
          const p = projectRes.data;
          setCode(p.code);
          setName(p.name);
          setLocation(p.location);
          setDescription(p.description || "");
          setStartDate(p.plannedStartDate ? p.plannedStartDate.slice(0, 10) : "");
          setEndDate(p.plannedEndDate ? p.plannedEndDate.slice(0, 10) : "");
          setSelectedManager(p.projectManagerId?._id || "");
          setHealth(p.health);
        }
        if (managersRes.success && managersRes.data) {
          setManagers(managersRes.data);
        }
      })
      .catch(() => {
        showError("Error", "Failed to load project details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [projectId, showError]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !name || !location) return;

    setIsSaving(true);
    try {
      await projectService.updateProject(projectId, {
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        plannedStartDate: startDate,
        plannedEndDate: endDate,
        projectManagerId: selectedManager || undefined,
        health,
      });

      showSuccess("Project Updated", "Project configuration saved.");
      navigate(`/projects/${projectId}`);
    } catch (error) {
      showError(
        "Save Failed",
        error instanceof Error ? error.message : "Error updating project."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading project configuration..." />;
  if (!projectId) return <ErrorState title="Project Not Found" message="Invalid project ID." />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link
          to={`/projects/${projectId}`}
          className="hover:text-slate-900 dark:hover:text-slate-100 inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Project Workspace
        </Link>
      </div>

      <PageHeader
        title={`Edit Project: ${name}`}
        description={`Update project parameters, schedules, and operational leads.`}
      />

      <form onSubmit={handleSave} className="space-y-6">
        <Card title="Project Identification">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Project Code" disabled value={code} helperText="Unique code is immutable." />
            <Input
              label="Project Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </Card>

        <Card title="Location & Scope">
          <div className="space-y-4">
            <Input
              label="Site Location"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Textarea
              label="Description & Scope"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </Card>

        <Card title="Timeline & Management">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Planned Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Planned End Date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Select
              label="Project Manager"
              options={managers.map((m) => ({
                value: m.id,
                label: `${m.name} (${m.email})`,
              }))}
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link to={`/projects/${projectId}`}>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Project Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProjectPage;
