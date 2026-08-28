import mongoose from "mongoose";
import { ProjectModel, ProjectHealth } from "./project.model.js";
import { TaskModel } from "../tasks/task.model.js";
import { MilestoneModel } from "../milestones/milestone.model.js";

export interface HealthAssessmentResult {
  health: ProjectHealth;
  healthFactors: string[];
  metrics: {
    progress: number;
    overdueTasksCount: number;
    blockedTasksCount: number;
    missedMilestonesCount: number;
    daysToDeadline: number;
    expectedProgress: number;
  };
}

export class HealthService {
  /**
   * Evaluates project health using transparent rule-based metrics.
   * Health is determined by:
   * 1. Schedule delay (overdue tasks, missed milestones, project deadline exceeded)
   * 2. Progress divergence (expected timeline progress vs actual progress)
   * 3. Operational blockers (tasks with status BLOCKED)
   */
  async evaluateProjectHealth(projectId: string): Promise<HealthAssessmentResult> {
    const project = await ProjectModel.findById(projectId).exec();
    if (!project) {
      throw new Error(`Project ${projectId} not found for health assessment.`);
    }

    const now = new Date();
    const factors: string[] = [];

    // 1. Task metrics
    const [overdueTasks, blockedTasks, missedMilestones] = await Promise.all([
      TaskModel.find({
        projectId: new mongoose.Types.ObjectId(projectId),
        status: { $ne: "COMPLETED" },
        plannedEndDate: { $lt: now },
      }).select("title priority plannedEndDate").exec(),

      TaskModel.find({
        projectId: new mongoose.Types.ObjectId(projectId),
        status: "BLOCKED",
      }).select("title priority").exec(),

      MilestoneModel.find({
        projectId: new mongoose.Types.ObjectId(projectId),
        status: { $in: ["MISSED", "PENDING"] },
        plannedDate: { $lt: now },
      }).select("name plannedDate").exec(),
    ]);

    const overdueCount = overdueTasks.length;
    const blockedCount = blockedTasks.length;
    const missedMilestonesCount = missedMilestones.length;

    // 2. Timeline & Expected Progress calculation
    const start = new Date(project.plannedStartDate).getTime();
    const end = new Date(project.plannedEndDate).getTime();
    const current = now.getTime();

    let expectedProgress = 0;
    if (end > start) {
      const elapsed = Math.max(0, current - start);
      const totalDuration = end - start;
      expectedProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100));
    }

    const actualProgress = project.progress || 0;
    const progressGap = expectedProgress - actualProgress;
    const daysToDeadline = Math.ceil((end - current) / (1000 * 60 * 60 * 24));

    // Evaluate Risk / Critical Factors
    if (daysToDeadline < 0 && actualProgress < 100) {
      factors.push(`Project past scheduled completion deadline by ${Math.abs(daysToDeadline)} days`);
    }

    if (overdueCount > 0) {
      factors.push(`${overdueCount} task(s) currently past planned deadline`);
    }

    if (blockedCount > 0) {
      factors.push(`${blockedCount} task(s) currently blocked by dependencies`);
    }

    if (missedMilestonesCount > 0) {
      factors.push(`${missedMilestonesCount} milestone(s) missed or overdue`);
    }

    if (progressGap > 25) {
      factors.push(`Progress lagging significantly behind schedule (${actualProgress}% actual vs ${expectedProgress}% expected)`);
    } else if (progressGap > 10) {
      factors.push(`Progress slightly behind schedule (${actualProgress}% actual vs ${expectedProgress}% expected)`);
    }

    // Determine Final Health Status
    let health: ProjectHealth = "HEALTHY";

    const hasCriticalUrgentBlocker = blockedTasks.some((t) => t.priority === "URGENT" || t.priority === "HIGH");
    const hasCriticalOverdue = overdueTasks.some((t) => t.priority === "URGENT");

    if (
      (daysToDeadline < 0 && actualProgress < 90) ||
      progressGap >= 25 ||
      missedMilestonesCount >= 2 ||
      hasCriticalUrgentBlocker ||
      hasCriticalOverdue ||
      overdueCount >= 5
    ) {
      health = "CRITICAL";
    } else if (
      factors.length > 0 ||
      progressGap > 10 ||
      overdueCount > 0 ||
      blockedCount > 0 ||
      missedMilestonesCount > 0
    ) {
      health = "AT_RISK";
    }

    if (factors.length === 0) {
      factors.push("All milestones and tasks on schedule");
    }

    // Persist health & factors on project
    project.health = health;
    project.healthFactors = factors;
    await project.save();

    return {
      health,
      healthFactors: factors,
      metrics: {
        progress: actualProgress,
        overdueTasksCount: overdueCount,
        blockedTasksCount: blockedCount,
        missedMilestonesCount,
        daysToDeadline,
        expectedProgress,
      },
    };
  }
}

export const healthService = new HealthService();
export default healthService;
