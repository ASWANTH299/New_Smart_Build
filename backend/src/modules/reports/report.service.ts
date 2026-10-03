import mongoose from "mongoose";
import { ProjectModel } from "../projects/project.model.js";
import { PhaseModel } from "../phases/phase.model.js";
import { TaskModel } from "../tasks/task.model.js";
import { MilestoneModel } from "../milestones/milestone.model.js";
import { Budget } from "../budget/budget.model.js";
import { Expense } from "../budget/expense.model.js";
import { BOMItemModel } from "../bom/bomItem.model.js";
import { WorkforceAssignment } from "../workforce/workforceAssignment.model.js";
import { Attendance } from "../attendance/attendance.model.js";
import { Issue } from "../issues/issue.model.js";
import { AppError } from "../../utils/AppError.js";

export interface ProjectAnalyticsData {
  project: {
    id: string;
    code: string;
    name: string;
    status: string;
    health: string;
    location: string;
    plannedStartDate: Date;
    plannedEndDate: Date;
  };
  progress: {
    overallProgress: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    delayedTasks: number;
    blockedTasks: number;
    totalPhases: number;
    completedPhases: number;
  };
  milestones: {
    totalMilestones: number;
    achievedMilestones: number;
    pendingMilestones: number;
    milestoneHealth: number; // percentage
  };
  budget: {
    totalPlanned: number;
    totalActual: number;
    remainingBalance: number;
    costVariance: number;
    variancePercentage: number;
    burnRate: number; // % of budget spent
    categoryBreakdown: Array<{
      category: string;
      planned: number;
      actual: number;
      variance: number;
    }>;
  };
  materials: {
    totalItems: number;
    lowStockCount: number;
  };
  workforce: {
    totalWorkers: number;
    averageAttendance: number;
    presentToday: number;
  };
  issues: {
    totalIssues: number;
    openIssues: number;
    inProgressIssues: number;
    resolvedIssues: number;
    closedIssues: number;
    criticalHazardCount: number;
    highPriorityCount: number;
  };
}

export class ReportService {
  async getProjectAnalytics(projectId: string): Promise<ProjectAnalyticsData> {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw new AppError("Invalid project ID", 400);
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);
    const project = await ProjectModel.findById(projectObjectId);
    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Concurrently fetch all metrics for high performance
    const [
      phases,
      tasks,
      milestones,
      budget,
      expenses,
      bomItems,
      workforceAssignments,
      recentAttendance,
      todayAttendance,
      issues,
    ] = await Promise.all([
      PhaseModel.find({ projectId: projectObjectId }).lean(),
      TaskModel.find({ projectId: projectObjectId }).lean(),
      MilestoneModel.find({ projectId: projectObjectId }).lean(),
      Budget.findOne({ projectId: projectObjectId }).lean(),
      Expense.find({ projectId: projectObjectId }).lean(),
      BOMItemModel.find({ projectId: projectObjectId }).lean(),
      WorkforceAssignment.find({ projectId: projectObjectId, status: "ACTIVE" }).lean(),
      Attendance.find({
        projectId: projectObjectId,
        status: { $in: ["PRESENT", "OVERTIME", "HALF_DAY"] },
      }).lean(),
      Attendance.countDocuments({
        projectId: projectObjectId,
        date: todayStr,
        status: { $in: ["PRESENT", "OVERTIME", "HALF_DAY"] },
      }),
      Issue.find({ projectId: projectObjectId }).lean(),
    ]);

    // 1. Progress Metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const blockedTasks = tasks.filter((t) => t.status === "BLOCKED").length;
    const delayedTasks = tasks.filter(
      (t) => t.status !== "COMPLETED" && new Date(t.plannedEndDate) < now
    ).length;

    const totalPhases = phases.length;
    const completedPhases = phases.filter((p) => p.status === "COMPLETED").length;
    const calculatedTaskProgress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const overallProgress = project.progress ?? calculatedTaskProgress;

    // 2. Milestone Metrics
    const totalMilestones = milestones.length;
    const achievedMilestones = milestones.filter((m) => m.status === "ACHIEVED").length;
    const pendingMilestones = totalMilestones - achievedMilestones;
    const milestoneHealth =
      totalMilestones > 0 ? Math.round((achievedMilestones / totalMilestones) * 100) : 100;

    // 3. Budget & Financial Metrics
    const totalPlanned = (budget as any)?.totalAllocated || (budget as any)?.totalAmount || 0;
    const totalActualFromExpenses = expenses
      .filter((e) => e.status !== "REJECTED")
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalActual = (budget as any)?.actualAmount || totalActualFromExpenses;
    const remainingBalance = totalPlanned - totalActual;
    const costVariance = totalPlanned - totalActual;
    const variancePercentage =
      totalPlanned > 0 ? Number((((totalActual - totalPlanned) / totalPlanned) * 100).toFixed(1)) : 0;
    const burnRate =
      totalPlanned > 0 ? Number(((totalActual / totalPlanned) * 100).toFixed(1)) : 0;

    // Group expenses by category
    const categoryMap: Record<string, { planned: number; actual: number }> = {};
    if (budget?.categories) {
      for (const cat of budget.categories) {
        categoryMap[cat.category] = {
          planned: cat.plannedAmount || 0,
          actual: cat.actualAmount || 0,
        };
      }
    }
    for (const exp of expenses) {
      if (exp.status === "REJECTED") continue;
      if (!categoryMap[exp.category]) {
        categoryMap[exp.category] = { planned: 0, actual: 0 };
      }
      if (!budget?.categories) {
        categoryMap[exp.category].actual += exp.amount || 0;
      }
    }

    const categoryBreakdown = Object.entries(categoryMap).map(([category, vals]) => ({
      category,
      planned: vals.planned,
      actual: vals.actual,
      variance: vals.planned - vals.actual,
    }));

    // 4. Materials Metrics
    const totalItems = bomItems.length;
    const lowStockCount = bomItems.filter(
      (item) => ((item as any).quantityRequired || (item as any).quantity || 0) > ((item as any).quantityProcured || 0)
    ).length;

    // 5. Workforce Metrics
    const totalWorkers = workforceAssignments.length;
    const attendanceDates = new Set(recentAttendance.map((a) => a.date));
    const averageAttendance =
      attendanceDates.size > 0
        ? Math.round(recentAttendance.length / attendanceDates.size)
        : totalWorkers;

    // 6. Issues Metrics
    const totalIssues = issues.length;
    const openIssues = issues.filter((i) => i.status === "OPEN").length;
    const inProgressIssues = issues.filter((i) => i.status === "IN_PROGRESS").length;
    const resolvedIssues = issues.filter((i) => i.status === "RESOLVED").length;
    const closedIssues = issues.filter((i) => i.status === "CLOSED").length;
    const criticalHazardCount = issues.filter(
      (i) => i.priority === "CRITICAL" && i.status !== "RESOLVED" && i.status !== "CLOSED"
    ).length;
    const highPriorityCount = issues.filter(
      (i) => i.priority === "HIGH" && i.status !== "RESOLVED" && i.status !== "CLOSED"
    ).length;

    return {
      project: {
        id: project._id.toString(),
        code: project.code,
        name: project.name,
        status: project.status,
        health: project.health,
        location: project.location,
        plannedStartDate: project.plannedStartDate,
        plannedEndDate: project.plannedEndDate,
      },
      progress: {
        overallProgress,
        totalTasks,
        completedTasks,
        inProgressTasks,
        delayedTasks,
        blockedTasks,
        totalPhases,
        completedPhases,
      },
      milestones: {
        totalMilestones,
        achievedMilestones,
        pendingMilestones,
        milestoneHealth,
      },
      budget: {
        totalPlanned,
        totalActual,
        remainingBalance,
        costVariance,
        variancePercentage,
        burnRate,
        categoryBreakdown,
      },
      materials: {
        totalItems,
        lowStockCount,
      },
      workforce: {
        totalWorkers,
        averageAttendance,
        presentToday: todayAttendance,
      },
      issues: {
        totalIssues,
        openIssues,
        inProgressIssues,
        resolvedIssues,
        closedIssues,
        criticalHazardCount,
        highPriorityCount,
      },
    };
  }

  async generateProjectSummaryReport(
    projectId: string,
    format: "json" | "csv" = "json"
  ): Promise<{ format: "json" | "csv"; data: any; csv?: string }> {
    const analytics = await this.getProjectAnalytics(projectId);

    if (format === "csv") {
      const csv = this.convertAnalyticsToCSV(analytics);
      return { format: "csv", data: analytics, csv };
    }

    return { format: "json", data: analytics };
  }

  private convertAnalyticsToCSV(a: ProjectAnalyticsData): string {
    const lines: string[] = [];

    // Header & Project Metadata
    lines.push("SMART BUILD - PROJECT OPERATIONAL SUMMARY REPORT");
    lines.push(`Generated At,${new Date().toISOString()}`);
    lines.push("");
    lines.push("PROJECT DETAILS");
    lines.push(`Project Code,${a.project.code}`);
    lines.push(`Project Name,"${a.project.name.replace(/"/g, '""')}"`);
    lines.push(`Status,${a.project.status}`);
    lines.push(`Health,${a.project.health}`);
    lines.push(`Location,"${a.project.location.replace(/"/g, '""')}"`);
    lines.push(`Planned Start,${new Date(a.project.plannedStartDate).toISOString().slice(0, 10)}`);
    lines.push(`Planned End,${new Date(a.project.plannedEndDate).toISOString().slice(0, 10)}`);
    lines.push("");

    // Progress Section
    lines.push("PROGRESS & SCHEDULE");
    lines.push(`Overall Progress %,${a.progress.overallProgress}%`);
    lines.push(`Total Phases,${a.progress.totalPhases}`);
    lines.push(`Completed Phases,${a.progress.completedPhases}`);
    lines.push(`Total Tasks,${a.progress.totalTasks}`);
    lines.push(`Completed Tasks,${a.progress.completedTasks}`);
    lines.push(`In Progress Tasks,${a.progress.inProgressTasks}`);
    lines.push(`Delayed Tasks,${a.progress.delayedTasks}`);
    lines.push(`Blocked Tasks,${a.progress.blockedTasks}`);
    lines.push(`Milestone Health %,${a.milestones.milestoneHealth}%`);
    lines.push(`Achieved Milestones,${a.milestones.achievedMilestones}/${a.milestones.totalMilestones}`);
    lines.push("");

    // Financial Section
    lines.push("FINANCIAL & BUDGET BREAKDOWN");
    lines.push(`Total Planned Budget,${a.budget.totalPlanned}`);
    lines.push(`Total Actual Spent,${a.budget.totalActual}`);
    lines.push(`Remaining Balance,${a.budget.remainingBalance}`);
    lines.push(`Budget Burn Rate %,${a.budget.burnRate}%`);
    lines.push(`Cost Variance,${a.budget.costVariance}`);
    lines.push(`Cost Variance %,${a.budget.variancePercentage}%`);
    lines.push("");
    lines.push("Category,Planned Amount,Actual Amount,Variance");
    for (const cat of a.budget.categoryBreakdown) {
      lines.push(`"${cat.category}",${cat.planned},${cat.actual},${cat.variance}`);
    }
    lines.push("");

    // Workforce & Attendance
    lines.push("WORKFORCE & ATTENDANCE");
    lines.push(`Total Assigned Workers,${a.workforce.totalWorkers}`);
    lines.push(`Average Daily Attendance,${a.workforce.averageAttendance}`);
    lines.push(`Present Today,${a.workforce.presentToday}`);
    lines.push("");

    // Issues & Snag Tracking
    lines.push("ISSUES & SITE HAZARDS");
    lines.push(`Total Issues Logged,${a.issues.totalIssues}`);
    lines.push(`Open Issues,${a.issues.openIssues}`);
    lines.push(`In Progress Issues,${a.issues.inProgressIssues}`);
    lines.push(`Resolved Issues,${a.issues.resolvedIssues}`);
    lines.push(`Closed Issues,${a.issues.closedIssues}`);
    lines.push(`Critical Hazard Count,${a.issues.criticalHazardCount}`);
    lines.push(`High Priority Count,${a.issues.highPriorityCount}`);

    return lines.join("\n");
  }
}

export const reportService = new ReportService();
