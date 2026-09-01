import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Check } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Card } from "../../components/ui/Card.js";
import { Input } from "../../components/ui/Input.js";
import { Select } from "../../components/ui/Select.js";
import { Textarea } from "../../components/ui/Textarea.js";
import { Button } from "../../components/ui/Button.js";
import { useToast } from "../../hooks/useToast.js";
import { useAuth } from "../../hooks/useAuth.js";
import { projectService, ProjectType, ProjectTemplate } from "../../services/projectService.js";
import { userService } from "../../services/userService.js";
import { User } from "../../types/index.js";

export const CreateProjectPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [types, setTypes] = useState<ProjectType[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedTeamUserIds, setSelectedTeamUserIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedManager, setSelectedManager] = useState("");

  useEffect(() => {
    Promise.all([
      projectService.getProjectTypes(),
      projectService.getProjectTemplates(),
      userService.getUsers({ role: "PROJECT_MANAGER" }),
      userService.getUsers({ status: "ACTIVE", limit: 100 }),
    ])
      .then(([typesRes, templatesRes, managersRes, allUsersRes]) => {
        if (typesRes.success && typesRes.data) {
          setTypes(typesRes.data);
          if (typesRes.data.length > 0) setSelectedType(typesRes.data[0]._id);
        }
        if (templatesRes.success && templatesRes.data) {
          setTemplates(templatesRes.data);
        }
        if (managersRes.success && managersRes.data) {
          setManagers(managersRes.data);
          if (managersRes.data.length > 0) {
            setSelectedManager(managersRes.data[0].id);
          } else if (user?.id) {
            setSelectedManager(user.id);
          }
        }
        if (allUsersRes.success && allUsersRes.data) {
          setAllUsers(allUsersRes.data);
        }
      })
      .catch(() => {
        showError("Initialization Error", "Failed to load project configuration options.");
      });
  }, [user, showError]);

  const toggleTeamUser = (userId: string) => {
    setSelectedTeamUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const managerId = selectedManager || (managers.length > 0 ? managers[0].id : user?.id || "");
    if (!code || !name || !location || !startDate || !endDate || !managerId) {
      showError("Validation Error", "Please fill in all mandatory project fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await projectService.createProject({
        code: code.toUpperCase().trim(),
        name: name.trim(),
        typeId: selectedType || undefined,
        templateId: selectedTemplate || undefined,
        location: location.trim(),
        description: description.trim(),
        plannedStartDate: startDate,
        plannedEndDate: endDate,
        projectManagerId: managerId,
        teamUserIds: selectedTeamUserIds,
      });

      if (res.success && res.data) {
        showSuccess("Project Created", `Initialized ${res.data.name} (${res.data.code}) with standard phases.`);
        navigate(`/projects/${res.data._id}`);
      }
    } catch (error) {
      showError(
        "Creation Failed",
        error instanceof Error ? error.message : "Error creating capital project."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const nonManagerUsers = allUsers.filter((u) => u.id !== selectedManager);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link to="/projects" className="hover:text-slate-900 dark:hover:text-slate-100 inline-flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects Directory
        </Link>
      </div>

      <PageHeader
        title="Initialize Capital Project"
        description="Set up project identification, type blueprint, scheduled timeline, and operational team roster."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="1. Project Identification">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Project Code (Unique)"
              required
              placeholder="e.g. PRJ-BLR-001"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              helperText="Uppercase alphanumeric format"
            />
            <Input
              label="Project Name"
              required
              placeholder="e.g. Metro Heights Phase 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </Card>

        <Card title="2. Category & Blueprint Template">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Construction Type"
              options={types.map((t) => ({ value: t._id, label: `${t.name} (${t.code})` }))}
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            />
            <Select
              label="Roadmap Template"
              options={[
                { value: "", label: "Standard Construction Lifecycle (4 Default Phases)" },
                ...templates.map((tmpl) => ({ value: tmpl._id, label: tmpl.name })),
              ]}
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            />
          </div>
        </Card>

        <Card title="3. Location & Description">
          <div className="space-y-4">
            <Input
              label="Site Location / Address"
              required
              placeholder="e.g. Plot 42, Electronic City Phase 2, Bengaluru"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <Textarea
              label="Scope Summary & Description"
              placeholder="Summary of construction scope, total built-up area, structural specifications..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </Card>

        <Card title="4. Timeline & Management Leadership">
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
              label="Assigned Project Manager"
              options={
                managers.length > 0
                  ? managers.map((m) => ({ value: m.id, label: `${m.name} (${m.email})` }))
                  : [{ value: user?.id || "", label: user?.name || "Current User" }]
              }
              value={selectedManager}
              onChange={(e) => setSelectedManager(e.target.value)}
            />
          </div>
        </Card>

        <Card
          title={`5. Project Team Assignment (${selectedTeamUserIds.length} Selected)`}
          action={
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Site Engineers, Store Managers, Contractors, Client Reps
            </span>
          }
        >
          {nonManagerUsers.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              No additional registered users found. You can invite team members after project creation.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {nonManagerUsers.map((u) => {
                const isSelected = selectedTeamUserIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleTeamUser(u.id)}
                    className={`p-2.5 rounded-lg border text-left flex items-start justify-between gap-2 text-xs transition-all ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-900 dark:text-brand-200 ring-1 ring-brand-500"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{u.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                        {u.email}
                      </div>
                      <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium mt-0.5">
                        {u.primaryRole.replace(/_/g, " ")}
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
                          ? "bg-brand-600 border-brand-600 text-white"
                          : "border-slate-300 dark:border-slate-700 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link to="/projects">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button
            variant="primary"
            type="submit"
            isLoading={isLoading}
            leftIcon={<Building2 className="w-4 h-4" />}
          >
            Create & Initialize Project
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
