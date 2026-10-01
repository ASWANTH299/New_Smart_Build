export interface ProjectAnalytics {
  project: {
    id: string;
    code: string;
    name: string;
    status: string;
    health: string;
    location: string;
    plannedStartDate: string;
    plannedEndDate: string;
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
    milestoneHealth: number;
  };
  budget: {
    totalPlanned: number;
    totalActual: number;
    remainingBalance: number;
    costVariance: number;
    variancePercentage: number;
    burnRate: number;
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

export type ReportExportFormat = "json" | "csv";
