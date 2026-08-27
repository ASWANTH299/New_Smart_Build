import React from "react";
import { Link } from "react-router-dom";
import {
  FolderKanban,
  CheckSquare,
  Package,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader.js";
import { Metric } from "../../components/ui/Metric.js";
import { Card } from "../../components/ui/Card.js";
import { Button } from "../../components/ui/Button.js";
import { StatusBadge } from "../../components/ui/StatusBadge.js";
import { ProgressIndicator } from "../../components/ui/ProgressIndicator.js";
import { useAuth } from "../../hooks/useAuth.js";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const mockProjects = [
    {
      id: "PRJ-001",
      name: "Metro Tower Phase 2",
      client: "Urban Skyline Developers",
      status: "active",
      progress: 68,
      plannedQty: 1200,
      completedQty: 816,
      unit: "m³ Concrete",
      endDate: "Dec 2026",
    },
    {
      id: "PRJ-002",
      name: "Highway Overpass Sector 4",
      client: "National Infrastructure Corp",
      status: "active",
      progress: 42,
      plannedQty: 4500,
      completedQty: 1890,
      unit: "m Asphalting",
      endDate: "Mar 2027",
    },
    {
      id: "PRJ-003",
      name: "Greenfield Commercial Park",
      client: "Apex Real Estate Holdings",
      status: "risk",
      progress: 25,
      plannedQty: 800,
      completedQty: 200,
      unit: "Tons Steel",
      endDate: "Aug 2027",
    },
  ];

  const mockActivities = [
    {
      id: 1,
      title: "Daily Log submitted for Metro Tower Phase 2",
      time: "25 minutes ago",
      author: "Site Eng. Sharma",
      tag: "Log",
    },
    {
      id: 2,
      title: "Material Dispatch: 400 Bags Grade 53 Cement",
      time: "1 hour ago",
      author: "Store Mgr. Verma",
      tag: "Inventory",
    },
    {
      id: 3,
      title: "Safety Audit cleared: Zero Critical NCRs",
      time: "3 hours ago",
      author: "Safety Officer Patil",
      tag: "Quality",
    },
    {
      id: 4,
      title: "Milestone B-2 Foundation Pour Completed",
      time: "Yesterday at 17:30",
      author: "PM Mukherjee",
      tag: "Milestone",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Operations Dashboard`}
        description={`Welcome, ${user?.name || "Team Member"}. Construction operations overview and operational status.`}
        actions={
          <div className="flex items-center gap-2.5">
            <Link to="/projects">
              <Button variant="outline" size="sm" leftIcon={<FolderKanban className="w-4 h-4" />}>
                View All Projects
              </Button>
            </Link>
            {user?.primaryRole !== "CLIENT" && (
              <Link to="/projects">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  New Project
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          label="Active Projects"
          value="12"
          subtext="Across 4 operational sectors"
          trend={{ value: "+2 this quarter", isPositive: true }}
          icon={<FolderKanban className="w-5 h-5" />}
        />
        <Metric
          label="Open Tasks Today"
          value="38"
          subtext="8 high priority work orders"
          trend={{ value: "92% completion rate", isPositive: true }}
          icon={<CheckSquare className="w-5 h-5" />}
        />
        <Metric
          label="Material Requests"
          value="6"
          subtext="Pending store verification"
          icon={<Package className="w-5 h-5" />}
        />
        <Metric
          label="Safety Compliance"
          value="100%"
          subtext="0 lost-time incidents (30d)"
          trend={{ value: "All Clear", isPositive: true }}
          icon={<ShieldCheck className="w-5 h-5" />}
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Status Overview */}
        <div className="lg:col-span-2 space-y-4">
          <Card
            title="Active Construction Projects"
            subtitle="Quantity-based tracking & schedule progression"
            action={
              <Link
                to="/projects"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
              >
                <span>Full Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="divide-y divide-slate-100">
              {mockProjects.map((project) => (
                <div key={project.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 font-mono">{project.id}</span>
                        <h4 className="text-sm font-semibold text-slate-900">{project.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500">{project.client}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={project.status} size="sm" />
                      <span className="text-xs text-slate-500 font-medium">Target: {project.endDate}</span>
                    </div>
                  </div>

                  <ProgressIndicator
                    progress={project.progress}
                    plannedQuantity={project.plannedQty}
                    completedQuantity={project.completedQty}
                    unit={project.unit}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Operational Feed */}
        <div className="space-y-4">
          <Card
            title="Site Operations Feed"
            subtitle="Recent logs, inspections & material updates"
          >
            <div className="flow-root">
              <ul className="-mb-8">
                {mockActivities.map((activity, idx) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {idx !== mockActivities.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                            <TrendingUp className="w-4 h-4 text-brand-600" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{activity.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">By {activity.author}</p>
                          </div>
                          <div className="whitespace-nowrap text-right text-[10px] text-slate-400">
                            {activity.time}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
