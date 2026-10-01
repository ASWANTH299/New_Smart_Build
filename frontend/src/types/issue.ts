export type IssueCategory =
  | "SAFETY"
  | "QUALITY"
  | "MATERIAL"
  | "EQUIPMENT"
  | "SCHEDULE"
  | "WEATHER"
  | "PROJECT"
  | "PHASE"
  | "TASK"
  | "OTHER";

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Issue {
  _id: string;
  projectId: string;
  issueNumber: string;
  title: string;
  description: string;
  category: IssueCategory;
  priority: IssuePriority;
  status: IssueStatus;
  assignedTo?: {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role?: string;
    primaryRole?: string;
  } | null;
  reportedBy: {
    _id: string;
    id?: string;
    name: string;
    email: string;
    role?: string;
    primaryRole?: string;
  };
  phaseId?: {
    _id: string;
    name: string;
    code?: string;
  } | null;
  taskId?: {
    _id: string;
    title: string;
    code?: string;
  } | null;
  dueDate?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIssueInput {
  title: string;
  description: string;
  category?: IssueCategory;
  priority?: IssuePriority;
  assignedTo?: string | null;
  phaseId?: string | null;
  taskId?: string | null;
  dueDate?: string | null;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  category?: IssueCategory;
  priority?: IssuePriority;
  status?: IssueStatus;
  assignedTo?: string | null;
  phaseId?: string | null;
  taskId?: string | null;
  dueDate?: string | null;
  resolutionNotes?: string;
}

export interface ResolveIssueInput {
  resolutionNotes: string;
}
