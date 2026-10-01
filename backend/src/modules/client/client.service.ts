import mongoose from "mongoose";
import { ProjectModel } from "../projects/project.model.js";
import { ProjectMembershipModel } from "../auth/projectMembership.model.js";
import { MilestoneModel } from "../milestones/milestone.model.js";
import { DailyReport } from "../daily-reports/dailyReport.model.js";
import { TaskModel } from "../tasks/task.model.js";
import { Issue } from "../issues/issue.model.js";
import { Budget } from "../budget/budget.model.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../../utils/AppError.js";

export interface ClientProjectSummary {
  id: string;
  code: string;
  name: string;
  description: string;
  location: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  status: string;
  health: string;
  overallCompletionPercentage: number;
}

export interface ClientMilestoneItem {
  id: string;
  title: string;
  targetDate: Date;
  actualDate: Date | null;
  status: "PENDING" | "ACHIEVED" | "MISSED";
  completionPercentage: number;
  description: string;
}

export interface ClientDailyReportItem {
  id: string;
  reportNumber: string;
  reportDate: Date;
  workPerformed: string;
  photos: string[];
  weatherCondition?: string;
}

export interface ClientQualityInspectionSummary {
  totalCheckpoints: number;
  passedCheckpoints: number;
  pendingCheckpoints: number;
  passPercentage: number;
}

export interface ClientPaymentMilestone {
  id: string;
  title: string;
  targetDate: Date;
  status: "PENDING" | "BILLED" | "PAID";
  amount: number;
  percentage: number;
  isPaid: boolean;
}

export interface ClientFinancialSummary {
  currency: string;
  totalBudget: number;
  totalBilled: number;
  totalPaid: number;
  billedPercentage: number;
  paidPercentage: number;
  paymentMilestones: ClientPaymentMilestone[];
}

export interface ClientProjectDetails {
  project: ClientProjectSummary;
  milestones: ClientMilestoneItem[];
  dailySiteProgress: ClientDailyReportItem[];
  qualityInspectionSummary: ClientQualityInspectionSummary;
  financialSummary: ClientFinancialSummary;
}

export class ClientService {
  /**
   * Returns only projects where the client user is an assigned member in project_memberships (or client owner).
   */
  async getClientProjects(clientId: string, userRole?: string): Promise<ClientProjectSummary[]> {
    if (!clientId) {
      throw new BadRequestError("Client ID is required");
    }

    const memberships = await ProjectMembershipModel.find({
      userId: clientId,
      assignmentStatus: "ACTIVE",
    })
      .lean()
      .exec();

    const assignedProjectIds = memberships.map((m) => m.projectId).filter(Boolean);

    let query: Record<string, unknown>;
    if (userRole === "ADMIN" && assignedProjectIds.length === 0) {
      query = { status: { $ne: "ARCHIVED" } };
    } else {
      const validIds = assignedProjectIds
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const orConditions: Array<Record<string, unknown>> = [{ _id: { $in: validIds } }];
      if (mongoose.isValidObjectId(clientId)) {
        orConditions.push({ clientUserId: new mongoose.Types.ObjectId(clientId) });
      }

      query = {
        $or: orConditions,
        status: { $ne: "ARCHIVED" },
      };
    }

    const projects = await ProjectModel.find(query).sort({ updatedAt: -1 }).lean().exec();

    return projects.map((p) => ({
      id: p._id.toString(),
      code: p.code,
      name: p.name,
      description: p.description || "",
      location: p.location,
      plannedStartDate: p.plannedStartDate,
      plannedEndDate: p.plannedEndDate,
      actualStartDate: p.actualStartDate || null,
      actualEndDate: p.actualEndDate || null,
      status: p.status,
      health: p.health,
      overallCompletionPercentage: p.progress ?? 0,
    }));
  }

  /**
   * Returns strictly curated, client-safe project data (no internal engineering blockers, no worker wage details).
   */
  async getClientProjectDetails(
    projectId: string,
    clientId: string,
    userRole?: string
  ): Promise<ClientProjectDetails> {
    if (!projectId || !mongoose.isValidObjectId(projectId)) {
      throw new BadRequestError("Valid Project ID is required");
    }
    if (!clientId) {
      throw new BadRequestError("Client ID is required");
    }

    const project = await ProjectModel.findById(projectId).lean().exec();
    if (!project || project.status === "ARCHIVED") {
      throw new NotFoundError("Project not found or archived");
    }

    // Access control: Ensure user is authorized
    if (userRole !== "ADMIN") {
      const membership = await ProjectMembershipModel.findOne({
        userId: clientId,
        projectId: projectId.toString(),
        assignmentStatus: "ACTIVE",
      })
        .lean()
        .exec();

      const isClientOwner =
        project.clientUserId && project.clientUserId.toString() === clientId.toString();

      if (!membership && !isClientOwner) {
        throw new ForbiddenError("You do not have permission to view this project");
      }
    }

    const projectObjectId = new mongoose.Types.ObjectId(projectId);

    // Fetch related client-safe data in parallel
    const [
      milestonesDocs,
      approvedReportsDocs,
      completedTasksCount,
      pendingTasksCount,
      resolvedQualityIssuesCount,
      openQualityIssuesCount,
      budgetDoc,
    ] = await Promise.all([
      MilestoneModel.find({ projectId: projectObjectId, clientVisible: true })
        .sort({ plannedDate: 1 })
        .lean()
        .exec(),
      DailyReport.find({ projectId: projectObjectId, status: "APPROVED" })
        .sort({ date: -1, reportDate: -1 })
        .limit(30)
        .lean()
        .exec(),
      TaskModel.countDocuments({ projectId: projectObjectId, status: "COMPLETED" }),
      TaskModel.countDocuments({
        projectId: projectObjectId,
        status: { $in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"] },
      }),
      Issue.countDocuments({
        projectId: projectObjectId,
        category: "QUALITY",
        status: "RESOLVED",
      }),
      Issue.countDocuments({
        projectId: projectObjectId,
        category: "QUALITY",
        status: { $ne: "RESOLVED" },
      }),
      Budget.findOne({ projectId: projectObjectId }).lean().exec(),
    ]);

    // Curated milestones (no engineering blockers)
    const curatedMilestones: ClientMilestoneItem[] = milestonesDocs.map((m) => {
      let completionPercentage = 0;
      if (m.status === "ACHIEVED") {
        completionPercentage = 100;
      } else if (m.status === "PENDING") {
        completionPercentage = project.progress ? Math.min(Math.round(project.progress), 80) : 0;
      } else {
        completionPercentage = 0;
      }

      return {
        id: m._id.toString(),
        title: m.name,
        targetDate: m.plannedDate,
        actualDate: m.actualDate || null,
        status: m.status,
        completionPercentage,
        description: m.description || "",
      };
    });

    // Approved DPR reports (strictly curated: work performed, photos; excludes worker wage/labor rate details)
    const approvedDailyProgress: ClientDailyReportItem[] = approvedReportsDocs.map((r) => ({
      id: r._id.toString(),
      reportNumber: r.reportNumber,
      reportDate: r.reportDate || r.date,
      workPerformed: r.workPerformed,
      photos: Array.isArray(r.photos) ? r.photos : [],
      weatherCondition: r.weatherCondition,
    }));

    // Approved Quality Handover / Inspection Summary
    const passedCheckpoints =
      completedTasksCount +
      resolvedQualityIssuesCount +
      curatedMilestones.filter((m) => m.status === "ACHIEVED").length;

    const pendingCheckpoints =
      pendingTasksCount +
      openQualityIssuesCount +
      curatedMilestones.filter((m) => m.status !== "ACHIEVED").length;

    const totalCheckpoints = passedCheckpoints + pendingCheckpoints;
    const passPercentage =
      totalCheckpoints > 0 ? Math.round((passedCheckpoints / totalCheckpoints) * 100) : 100;

    const qualityInspectionSummary: ClientQualityInspectionSummary = {
      totalCheckpoints,
      passedCheckpoints,
      pendingCheckpoints,
      passPercentage,
    };

    // Client Invoices / Payment Milestones summary: Billed vs paid milestone progress
    const totalBudget = budgetDoc?.totalPlanned || 0;
    const currency = budgetDoc?.currency || "USD";

    const milestoneCount = curatedMilestones.length || 1;
    const sliceWeight = 100 / milestoneCount;
    const trancheAmount = totalBudget > 0 ? Math.round(totalBudget / milestoneCount) : 0;

    let totalBilled = 0;
    let totalPaid = 0;

    const paymentMilestones: ClientPaymentMilestone[] = curatedMilestones.map((m, idx) => {
      const isPaid = m.status === "ACHIEVED";
      const isBilled = isPaid || (project.progress > 0 && idx === 0);

      const amount = trancheAmount;
      if (isPaid) {
        totalPaid += amount;
        totalBilled += amount;
      } else if (isBilled) {
        totalBilled += amount;
      }

      return {
        id: m.id,
        title: m.title,
        targetDate: m.targetDate,
        status: isPaid ? "PAID" : isBilled ? "BILLED" : "PENDING",
        amount,
        percentage: Math.round(sliceWeight),
        isPaid,
      };
    });

    const billedPercentage =
      totalBudget > 0
        ? Math.min(100, Math.round((totalBilled / totalBudget) * 100))
        : Math.round(
            (paymentMilestones.filter((p) => p.status !== "PENDING").length / milestoneCount) * 100
          );

    const paidPercentage =
      totalBudget > 0
        ? Math.min(100, Math.round((totalPaid / totalBudget) * 100))
        : Math.round((paymentMilestones.filter((p) => p.isPaid).length / milestoneCount) * 100);

    const financialSummary: ClientFinancialSummary = {
      currency,
      totalBudget,
      totalBilled,
      totalPaid,
      billedPercentage,
      paidPercentage,
      paymentMilestones,
    };

    return {
      project: {
        id: project._id.toString(),
        code: project.code,
        name: project.name,
        description: project.description || "",
        location: project.location,
        plannedStartDate: project.plannedStartDate,
        plannedEndDate: project.plannedEndDate,
        actualStartDate: project.actualStartDate || null,
        actualEndDate: project.actualEndDate || null,
        status: project.status,
        health: project.health,
        overallCompletionPercentage: project.progress ?? 0,
      },
      milestones: curatedMilestones,
      dailySiteProgress: approvedDailyProgress,
      qualityInspectionSummary,
      financialSummary,
    };
  }
}

export const clientService = new ClientService();
export default clientService;
