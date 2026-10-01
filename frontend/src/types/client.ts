export interface ClientProjectMetadata {
  id: string;
  code: string;
  name: string;
  description: string;
  location: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  status: string;
  health: string;
  overallCompletionPercentage: number;
}

export interface ClientMilestone {
  id: string;
  title: string;
  targetDate: string;
  actualDate?: string | null;
  status: "PENDING" | "ACHIEVED" | "MISSED";
  completionPercentage: number;
  description?: string;
}

export interface ClientDailyProgress {
  id: string;
  reportNumber: string;
  reportDate: string;
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
  targetDate: string;
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

export interface ClientProjectDetailsResponse {
  project: ClientProjectMetadata;
  milestones: ClientMilestone[];
  dailySiteProgress: ClientDailyProgress[];
  qualityInspectionSummary: ClientQualityInspectionSummary;
  financialSummary: ClientFinancialSummary;
}
